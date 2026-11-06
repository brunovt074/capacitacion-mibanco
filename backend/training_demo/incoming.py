from dataclasses import dataclass


@dataclass(frozen=True)
class Incoming:
    sender: str
    message_id: str
    text: str
    business_number: str | None = None


def parse_incoming(payload: dict, instance: str) -> Incoming | None:
    if payload.get("instance") != instance:
        return None
    if str(payload.get("event", "")).lower().replace("_", ".") != "messages.upsert":
        return None
    data = payload.get("data")
    if not isinstance(data, dict):
        return None
    key = data.get("key") or {}
    if key.get("fromMe") or not key.get("id"):
        return None
    jid = key.get("remoteJid") or ""
    if jid.endswith("@lid"):
        jid = key.get("remoteJidAlt") or ""
    if not jid.endswith("@s.whatsapp.net"):
        return None
    sender = jid.removesuffix("@s.whatsapp.net")
    if not sender.isdigit() or not 8 <= len(sender) <= 15:
        return None
    message = data.get("message") or {}
    text = message.get("conversation") or (message.get("extendedTextMessage") or {}).get("text")
    if not isinstance(text, str) or not text.strip():
        return None
    business_jid = payload.get("sender") or ""
    business_number = business_jid.removesuffix("@s.whatsapp.net") if isinstance(business_jid, str) and business_jid.endswith("@s.whatsapp.net") else ""
    if not business_number.isdigit() or not 8 <= len(business_number) <= 15:
        business_number = None
    return Incoming(sender=sender, message_id=str(key["id"]), text=text.strip(), business_number=business_number)
