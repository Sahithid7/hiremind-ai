from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.application import (
    ApplicationAnalytics,
    JobApplicationCreate,
    JobApplicationRead,
    JobApplicationUpdate,
)
from app.services.activity_service import record_activity
from app.services.application_service import (
    create_application,
    delete_application,
    get_application_analytics,
    list_applications,
    update_application,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("", response_model=list[JobApplicationRead])
def read_applications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[JobApplicationRead]:
    return [JobApplicationRead.model_validate(application) for application in list_applications(db, current_user)]


@router.get("/analytics", response_model=ApplicationAnalytics)
def read_application_analytics(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ApplicationAnalytics:
    return ApplicationAnalytics(**get_application_analytics(db, current_user))


@router.post("", response_model=JobApplicationRead, status_code=status.HTTP_201_CREATED)
def create_job_application(
    payload: JobApplicationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobApplicationRead:
    application = create_application(db, current_user, payload)
    record_activity(
        db,
        user_id=current_user.id,
        action="application.created",
        metadata={"application_id": application.id, "company": application.company},
    )
    return JobApplicationRead.model_validate(application)


@router.put("/{application_id}", response_model=JobApplicationRead)
def update_job_application(
    application_id: int,
    payload: JobApplicationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobApplicationRead:
    application = update_application(db, current_user, application_id, payload)
    record_activity(
        db,
        user_id=current_user.id,
        action="application.updated",
        metadata={"application_id": application.id, "status": application.status.value},
    )
    return JobApplicationRead.model_validate(application)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_application(
    application_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    delete_application(db, current_user, application_id)
    record_activity(
        db,
        user_id=current_user.id,
        action="application.deleted",
        metadata={"application_id": application_id},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
