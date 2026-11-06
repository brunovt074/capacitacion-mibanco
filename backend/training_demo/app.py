import asyncio
import logging
from contextlib import asynccontextmanager
from hmac import compare_digest
from pathlib import Path
from urllib.parse import quote

import httpx
from fastapi import FastAPI, HTTPException, Request
from sqlalchemy import create_engine, literal, select
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from training_demo.base import Base
from training_demo.incoming import parse_incoming
from training_demo.settings import Settings
from training_demo.storage import mark_delivered, pending_replies, record_message


logger = logging.getLogger(__name__)


def create_app(config: Settings | None = None, provider: httpx.AsyncClient | None = None) -> FastAPI:
    config = config or Settings.from_env()
    if not config.webhook_token or not config.evolution_api_key or not config.evolution_instance:
        raise ValueError("Webhook token, Evolution API key and instance must be set")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        database = make_url(config.database_url)
        if database.get_backend_name() != "sqlite" or not database.database or database.database == ":memory:":
            raise ValueError("A persistent SQLite database is required")
        Path(database.database).parent.mkdir(parents=True, exist_ok=True)
        engine = create_engine(config.database_url)
        Base.metadata.create_all(engine)
        app.state.engine = engine
        app.state.lock = asyncio.Lock()
        client = provider if provider is not None else httpx.AsyncClient(timeout=15)
        app.state.provider = client
        try:
            yield
        finally:
            if provider is None:
                await client.aclose()
            engine.dispose()

    app = FastAPI(title="MiBanco · Demo WhatsApp", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    @app.get("/health")
    async def health():
        with Session(app.state.engine) as db:
            db.execute(select(literal(1)))
        return {"status": "ok"}

    @app.post("/webhook/evolution")
    async def webhook(request: Request):
        supplied = request.headers.get("x-demo-webhook-token", "")
        if not compare_digest(supplied.encode(), config.webhook_token.encode()):
            raise HTTPException(status_code=403, detail="Forbidden")
        payload = await request.json()
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Expected JSON object")
        message = parse_incoming(payload, config.evolution_instance)
        if message is None:
            return {"status": "ignored"}
        async with app.state.lock:
            record_message(app.state.engine, message, config.video_base_url)
            for message_id, text in pending_replies(app.state.engine, message.sender):
                try:
                    response = await app.state.provider.post(
                        f"{config.evolution_base_url.rstrip('/')}/message/sendText/{quote(config.evolution_instance, safe='')}",
                        headers={"apikey": config.evolution_api_key},
                        json={"number": message.sender, "text": text, "linkPreview": False},
                    )
                    response.raise_for_status()
                except httpx.HTTPError:
                    logger.warning("Evolution delivery failed; reply retained")
                    raise HTTPException(status_code=503, detail="Message delivery pending") from None
                mark_delivered(app.state.engine, message_id)
        return {"status": "processed"}

    return app
