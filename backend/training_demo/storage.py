from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from training_demo.incoming import Incoming
from training_demo.receipt import Receipt
from training_demo.session_record import SessionRecord
from training_demo.training import advance


def record_message(engine: Engine, message: Incoming, video_base_url: str) -> None:
    with Session(engine) as db, db.begin():
        if db.get(Receipt, message.message_id) is not None:
            return
        participant = db.get(SessionRecord, message.sender)
        state, reply = advance(participant.state if participant else None, message.text, video_base_url, message.business_number)
        if reply is None:
            return
        if participant is None:
            db.add(SessionRecord(sender=message.sender, state=state))
        else:
            participant.state = state
        db.add(Receipt(
            message_id=message.message_id, sender=message.sender,
            command=message.text, response_text=reply, delivered=False,
        ))


def pending_replies(engine: Engine, sender: str) -> list[tuple[str, str]]:
    with Session(engine) as db:
        return [(row.message_id, row.response_text) for row in db.execute(
            select(Receipt.message_id, Receipt.response_text)
            .where(Receipt.sender == sender, Receipt.delivered.is_(False))
            .order_by(Receipt.received_at, Receipt.message_id)
        )]


def mark_delivered(engine: Engine, message_id: str) -> None:
    with Session(engine) as db, db.begin():
        db.get(Receipt, message_id).delivered = True
