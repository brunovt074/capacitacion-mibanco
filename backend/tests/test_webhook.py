import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session


KEY = {"x-demo-webhook-token": "webhook-test-secret"}


def payload(text="MIBANCO", message_id="msg-1", **key):
    return {
        "event": "messages.upsert", "instance": "demo",
        "data": {"key": {"remoteJid": "5491112345678@s.whatsapp.net", "id": message_id, "fromMe": False, **key}, "message": {"conversation": text}},
    }


def settings(tmp_path):
    from training_demo.settings import Settings

    return Settings(
        evolution_base_url="https://evolution.example", evolution_api_key="provider-test-key",
        evolution_instance="demo", webhook_token="webhook-test-secret",
        database_url=f"sqlite:///{tmp_path / 'training.db'}", video_base_url="https://video.example",
    )


@pytest.mark.asyncio
async def test_webhook_rejects_unauthorized_requests_and_ignores_own_messages(tmp_path):
    from training_demo.app import create_app
    from training_demo.session_record import SessionRecord

    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(201, json={}))) as provider:
        app = create_app(settings(tmp_path), provider)
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://demo") as client:
                assert (await client.post("/webhook/evolution", json=payload())).status_code == 403
                assert (await client.post("/webhook/evolution", headers=KEY, json=payload(fromMe=True))).status_code == 200
                assert (await client.post("/webhook/evolution", headers=KEY, json=payload("quiero un turno"))).status_code == 200
                assert (await client.post("/webhook/evolution", headers=KEY, json=payload("HOLA"))).status_code == 200
                with Session(app.state.engine) as db:
                    assert db.scalars(select(SessionRecord)).all() == []


@pytest.mark.asyncio
async def test_duplicate_answer_is_scored_once_and_session_survives_restart(tmp_path):
    from training_demo.app import create_app
    from training_demo.session_record import SessionRecord

    config = settings(tmp_path)
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(201, json={}))) as provider:
        app = create_app(config, provider)
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://demo") as client:
                for index, command in enumerate(["MIBANCO", "CONTINUAR", "CONTINUAR", "B"]):
                    response = await client.post("/webhook/evolution", headers=KEY, json=payload(command, f"msg-{index}"))
                    assert response.status_code == 200
                response = await client.post("/webhook/evolution", headers=KEY, json=payload("B", "msg-3"))
                assert response.status_code == 200
                with Session(app.state.engine) as db:
                    state = db.get(SessionRecord, "5491112345678").state
                    assert state["case"] == 1
                    assert state["answers"] == [{"case_id": "MB-CN-C01", "answer": "B", "points": 1, "category": "En desarrollo"}]
        restarted = create_app(config, provider)
        async with restarted.router.lifespan_context(restarted):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=restarted), base_url="http://demo") as client:
                response = await client.post("/webhook/evolution", headers=KEY, json=payload("CONTINUAR", "after-restart"))
                assert response.status_code == 200
                with Session(restarted.state.engine) as db:
                    state = db.get(SessionRecord, "5491112345678").state
                    assert state["phase"] == "question"
                    assert state["case"] == 1
                    assert state["answers"][0]["points"] == 1


@pytest.mark.asyncio
async def test_video_link_returns_to_the_business_number_from_evolution(tmp_path):
    from training_demo.app import create_app
    from training_demo.receipt import Receipt

    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(201, json={}))) as provider:
        app = create_app(settings(tmp_path), provider)
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://demo") as client:
                for command, message_id in [("MIBANCO", "start"), ("CONTINUAR", "video")]:
                    event = payload(command, message_id)
                    event["sender"] = "51987654321@s.whatsapp.net"
                    assert (await client.post("/webhook/evolution", headers=KEY, json=event)).status_code == 200
                with Session(app.state.engine) as db:
                    reply = db.get(Receipt, "video").response_text
                    assert "case=MB-CN-C01&whatsapp=51987654321" in reply

@pytest.mark.asyncio
async def test_provider_failure_keeps_pending_reply_and_replayed_event_does_not_advance_twice(tmp_path):
    from training_demo.app import create_app
    from training_demo.receipt import Receipt
    from training_demo.session_record import SessionRecord

    unavailable = True

    def provider_response(request):
        return httpx.Response(503 if unavailable else 201, json={})

    async with httpx.AsyncClient(transport=httpx.MockTransport(provider_response)) as provider:
        app = create_app(settings(tmp_path), provider)
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://demo") as client:
                assert (await client.post("/webhook/evolution", headers=KEY, json=payload())).status_code == 503
                with Session(app.state.engine) as db:
                    assert db.get(Receipt, "msg-1").delivered is False
                    assert db.get(SessionRecord, "5491112345678").state["phase"] == "welcome"
                unavailable = False
                assert (await client.post("/webhook/evolution", headers=KEY, json=payload())).status_code == 200
                with Session(app.state.engine) as db:
                    assert db.get(Receipt, "msg-1").delivered is True
                    assert db.get(SessionRecord, "5491112345678").state["phase"] == "welcome"
