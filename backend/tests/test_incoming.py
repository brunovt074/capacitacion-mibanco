import pytest


def event(text="HOLA", **key):
    return {
        "event": "messages.upsert",
        "instance": "demo",
        "data": {
            "key": {"id": "message-1", "remoteJid": "5491112345678@s.whatsapp.net", "fromMe": False, **key},
            "messageType": "conversation",
            "message": {"conversation": text},
        },
    }


def test_lid_resolves_to_phone_number_without_altering_argentine_recipient():
    from training_demo.incoming import parse_incoming

    message = parse_incoming(event(remoteJid="987654321@lid", remoteJidAlt="5491112345678@s.whatsapp.net"), "demo")
    assert message.sender == "5491112345678"
    assert message.message_id == "message-1"
    assert message.text == "HOLA"


@pytest.mark.parametrize("key", [{"fromMe": True}, {"remoteJid": "123@g.us"}, {"remoteJid": "status@broadcast"}, {"remoteJid": "123@newsletter"}, {"remoteJid": "123@lid"}, {"id": ""}])
def test_outgoing_nonprivate_and_unidentifiable_messages_are_ignored(key):
    from training_demo.incoming import parse_incoming

    assert parse_incoming(event(**key), "demo") is None


def test_foreign_instances_status_events_and_nontext_cannot_trigger_demo():
    from training_demo.incoming import parse_incoming

    payload = event()
    assert parse_incoming(payload, "therapy-other") is None
    payload["event"] = "messages.update"
    assert parse_incoming(payload, "demo") is None
    payload = event()
    payload["data"]["message"] = {"audioMessage": {"url": "https://media.example/audio"}}
    assert parse_incoming(payload, "demo") is None
    payload = event()
    payload["data"]["message"] = {"extendedTextMessage": {"text": "CONTINUAR"}}
    assert parse_incoming(payload, "demo").text == "CONTINUAR"
