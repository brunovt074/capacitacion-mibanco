from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from training_demo.base import Base


class Receipt(Base):
    __tablename__ = "message_receipts"

    message_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    sender: Mapped[str] = mapped_column(String(15), index=True)
    command: Mapped[str] = mapped_column(Text)
    response_text: Mapped[str] = mapped_column(Text)
    delivered: Mapped[bool] = mapped_column(Boolean, default=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
