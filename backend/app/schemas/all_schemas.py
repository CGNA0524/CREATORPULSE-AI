from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------------- AUTH SCHEMAS ----------------
class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    organization_id: Optional[int] = None
    organization_name: Optional[str] = None
    role: Optional[str] = "admin"

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


# ---------------- CAMPAIGN SCHEMAS ----------------
class CampaignBase(BaseModel):
    name: str
    objective: str = "CONVERSIONS"
    platform: str = "MULTI"
    start_date: date
    end_date: Optional[date] = None
    allocated_budget: float = Field(default=0.0, ge=0.0)
    currency: str = "INR"
    status: str = "ACTIVE"


class CampaignCreate(CampaignBase):
    influencer_ids: Optional[List[int]] = []


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    objective: Optional[str] = None
    platform: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    allocated_budget: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None


class CampaignResponse(CampaignBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    total_spend: Optional[float] = 0.0
    attributed_revenue: Optional[float] = 0.0
    roas: Optional[float] = 0.0
    conversions: Optional[int] = 0
    cpa: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


# ---------------- INFLUENCER SCHEMAS ----------------
class InfluencerBase(BaseModel):
    name: str
    handle: str
    platform: str = "INSTAGRAM"
    niche: str = "Tech"
    follower_count: int = Field(default=0, ge=0)
    audience_quality_score: float = Field(default=85.0, ge=0.0, le=100.0)


class InfluencerCreate(InfluencerBase):
    pass


class InfluencerUpdate(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    platform: Optional[str] = None
    niche: Optional[str] = None
    follower_count: Optional[int] = None
    audience_quality_score: Optional[float] = None


class InfluencerResponse(InfluencerBase):
    id: int
    organization_id: int
    created_at: datetime
    total_spend: Optional[float] = 0.0
    attributed_revenue: Optional[float] = 0.0
    roas: Optional[float] = 0.0
    conversions: Optional[int] = 0
    cpa: Optional[float] = 0.0
    conversion_rate: Optional[float] = 0.0
    engagement_rate: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


# ---------------- PERFORMANCE SCHEMAS ----------------
class PerformanceRecordCreate(BaseModel):
    campaign_name: str
    influencer_handle: str
    platform: str
    date: date
    spend: float = Field(..., ge=0.0)
    impressions: int = Field(default=0, ge=0)
    reach: int = Field(default=0, ge=0)
    engagements: int = Field(default=0, ge=0)
    clicks: int = Field(default=0, ge=0)
    conversions: int = Field(default=0, ge=0)
    attributed_revenue: float = Field(default=0.0, ge=0.0)


# ---------------- ANALYTICS SCHEMAS ----------------
class KPIOverview(BaseModel):
    total_spend: float
    attributed_revenue: float
    roas: float
    conversions: int
    cpa: Optional[float]
    conversion_rate: Optional[float]
    engagement_rate: Optional[float]
    cpc: Optional[float]
    cpm: Optional[float]
    aov: Optional[float]
    contribution: float
    contribution_margin_pct: Optional[float]
    total_impressions: int
    total_clicks: int
    currency: str = "INR"


class TrendPoint(BaseModel):
    date: str
    spend: float
    revenue: float
    roas: float
    conversions: int
    clicks: int
    impressions: int


class PlatformComparisonItem(BaseModel):
    platform: str
    spend: float
    revenue: float
    roas: float
    conversions: int
    cpa: Optional[float]
    influencer_count: int


class FunnelMetrics(BaseModel):
    impressions: int
    reach: int
    engagements: int
    clicks: int
    conversions: int
    ctr_pct: Optional[float]
    engagement_rate_pct: Optional[float]
    click_to_conv_pct: Optional[float]


# ---------------- OPTIMIZATION & SIMULATOR SCHEMAS ----------------
class InfluencerConstraint(BaseModel):
    influencer_id: int
    min_budget: float = 0.0
    max_budget: Optional[float] = None
    is_eligible: bool = True
    fixed_budget: Optional[float] = None


class OptimizationRequest(BaseModel):
    campaign_id: Optional[int] = None
    total_budget: float = Field(..., gt=0.0)
    objective: str = "MAX_REVENUE"  # MAX_REVENUE, MAX_CONTRIBUTION
    gross_margin_pct: Optional[float] = 40.0
    influencer_constraints: Optional[List[InfluencerConstraint]] = None
    platform_caps: Optional[Dict[str, float]] = None  # e.g. {"INSTAGRAM": 500000}
    custom_parameters: Optional[Dict[str, Dict[str, float]]] = None  # optional custom A_i, k_i per influencer


class AllocationRecommendation(BaseModel):
    influencer_id: int
    influencer_name: str
    handle: str
    platform: str
    niche: str
    baseline_budget: float
    recommended_budget: float
    budget_change: float
    budget_change_pct: float
    expected_revenue: float
    expected_contribution: float
    expected_roas: float
    marginal_return: float
    saturation_pct: float
    is_binding_constraint: bool
    constraint_note: Optional[str] = None


class OptimizationResponse(BaseModel):
    run_id: Optional[int] = None
    total_budget: float
    objective: str
    solver_status: str  # SUCCESS, INFEASIBLE, FAILED
    solver_message: str
    baseline_expected_revenue: float
    optimized_expected_revenue: float
    revenue_change: float
    revenue_change_pct: float
    baseline_expected_contribution: float
    optimized_expected_contribution: float
    contribution_change: float
    baseline_roas: float
    optimized_roas: float
    budget_utilization_pct: float
    allocations: List[AllocationRecommendation]
    assumptions_note: str


# ---------------- SCENARIO SCHEMAS ----------------
class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    campaign_id: Optional[int] = None
    assumptions: Dict[str, Any]
    baseline_results: Dict[str, Any]
    scenario_results: Dict[str, Any]


class ScenarioResponse(BaseModel):
    id: int
    organization_id: int
    campaign_id: Optional[int]
    name: str
    description: Optional[str]
    assumptions_json: Dict[str, Any]
    baseline_results_json: Dict[str, Any]
    scenario_results_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScenarioCompareRequest(BaseModel):
    scenario_ids: List[int]


# ---------------- IMPORT SCHEMAS ----------------
class ImportValidationSummary(BaseModel):
    valid: bool
    total_rows: int
    valid_rows: int
    invalid_rows: int
    errors: List[Dict[str, Any]]
    preview: List[Dict[str, Any]]


class ImportJobResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    status: str
    total_rows: int
    successful_rows: int
    failed_rows: int
    summary_message: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- INSIGHT SCHEMAS ----------------
class InsightResponse(BaseModel):
    id: int
    category: str
    title: str
    explanation: str
    evidence_json: Dict[str, Any]
    recommended_action: Optional[str]
    quality_score: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- PREDICTIVE SCHEMAS ----------------
class PredictiveBenchmark(BaseModel):
    target: str
    baseline_model: str
    baseline_mae: float
    baseline_rmse: float
    best_model_name: str
    model_mae: float
    model_rmse: float
    model_r2: float
    features_used: List[str]
    data_points: int
    note: str
