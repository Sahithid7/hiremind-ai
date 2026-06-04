from fastapi import APIRouter

from app.api.routes import analysis, applications, auth, export, health, interview, resume

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(resume.router)
api_router.include_router(analysis.router)
api_router.include_router(interview.router)
api_router.include_router(applications.router)
api_router.include_router(export.router)
