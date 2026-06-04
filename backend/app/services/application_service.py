from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import ApplicationStatus, JobApplication
from app.models.user import User
from app.schemas.application import JobApplicationCreate, JobApplicationUpdate


def list_applications(db: Session, user: User) -> list[JobApplication]:
    statement = (
        select(JobApplication)
        .where(JobApplication.user_id == user.id)
        .order_by(JobApplication.created_at.desc())
    )
    return list(db.scalars(statement))


def get_application(db: Session, user: User, application_id: int) -> JobApplication:
    application = db.get(JobApplication, application_id)
    if application is None or application.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return application


def create_application(db: Session, user: User, payload: JobApplicationCreate) -> JobApplication:
    application = JobApplication(user_id=user.id, **payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def update_application(
    db: Session,
    user: User,
    application_id: int,
    payload: JobApplicationUpdate,
) -> JobApplication:
    application = get_application(db, user, application_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(application, field, value)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def delete_application(db: Session, user: User, application_id: int) -> None:
    application = get_application(db, user, application_id)
    db.delete(application)
    db.commit()


def get_application_analytics(db: Session, user: User) -> dict:
    applications = list_applications(db, user)
    by_status = {status.value: 0 for status in ApplicationStatus}
    for application in applications:
        by_status[application.status.value] += 1

    return {
        "total": len(applications),
        "by_status": by_status,
        "active": sum(
            by_status[status]
            for status in [
                ApplicationStatus.applied.value,
                ApplicationStatus.online_assessment.value,
                ApplicationStatus.interview.value,
            ]
        ),
        "interviews": by_status[ApplicationStatus.interview.value],
        "offers": by_status[ApplicationStatus.offer.value],
    }
