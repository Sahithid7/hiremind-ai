from app.database.base import Base
from app.database.session import SessionLocal, engine

# Import models so SQLAlchemy registers all table metadata before create_all.
from app import models  # noqa: F401
from app.auth.security import get_password_hash
from app.core.config import get_settings
from app.models.user import User
from app.services.user_service import get_user_by_email


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    seed_demo_user()


def seed_demo_user() -> None:
    settings = get_settings()
    if not settings.seed_demo_user or settings.environment == "production":
        return

    db = SessionLocal()
    try:
        existing_user = get_user_by_email(db, settings.demo_user_email)
        if existing_user:
            return

        demo_user = User(
            email=settings.demo_user_email.lower(),
            full_name="Demo Career Builder",
            hashed_password=get_password_hash(settings.demo_user_password),
            target_role="Backend Engineer",
            location="Chicago, IL",
        )
        db.add(demo_user)
        db.commit()
    finally:
        db.close()
