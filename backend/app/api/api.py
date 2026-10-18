from fastapi import APIRouter
from backend.app.api.routes import (
    auth, dashboard, campaigns, influencers, analytics,
    optimization, scenarios, insights, imports, reports, predictive
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(campaigns.router)
api_router.include_router(influencers.router)
api_router.include_router(analytics.router)
api_router.include_router(optimization.router)
api_router.include_router(scenarios.router)
api_router.include_router(insights.router)
api_router.include_router(imports.router)
api_router.include_router(reports.router)
api_router.include_router(predictive.router)
