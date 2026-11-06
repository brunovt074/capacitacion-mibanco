import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    evolution_base_url: str
    evolution_api_key: str
    evolution_instance: str
    webhook_token: str
    database_url: str
    video_base_url: str

    @classmethod
    def from_env(cls):
        return cls(
            evolution_base_url=os.environ["EVOLUTION_BASE_URL"],
            evolution_api_key=os.environ["EVOLUTION_API_KEY"],
            evolution_instance=os.environ["EVOLUTION_INSTANCE"],
            webhook_token=os.environ["DEMO_WEBHOOK_TOKEN"],
            database_url=os.getenv("DATABASE_URL", "sqlite:////data/training.db"),
            video_base_url=os.environ["VIDEO_BASE_URL"],
        )
