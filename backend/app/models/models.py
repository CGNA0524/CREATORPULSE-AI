from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, ForeignKey, 
    Text, Boolean, Enum as SQLEnum, Index, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    memberships = relationship("OrganizationMembership", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    currency = Column(String(10), default="INR")
    gross_margin_pct = Column(Float, default=40.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("OrganizationMembership", back_populates="organization", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="organization", cascade="all, delete-orphan")
    influencers = relationship("Influencer", back_populates="organization", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="organization", cascade="all, delete-orphan")
    imports = relationship("ImportJob", back_populates="organization", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")


class OrganizationMembership(Base):
    __tablename__ = "organization_memberships"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="admin")  # owner, admin, analyst, viewer

    organization = relationship("Organization", back_populates="memberships")
    user = relationship("User", back_populates="memberships")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    objective = Column(String(100), default="CONVERSIONS")  # CONVERSIONS, AWARENESS, TRAFFIC, REVENUE
    platform = Column(String(50), default="MULTI")  # INSTAGRAM, YOUTUBE, TIKTOK, MULTI
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    allocated_budget = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="ACTIVE")  # ACTIVE, PAUSED, COMPLETED, ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="campaigns")
    campaign_influencers = relationship("CampaignInfluencer", back_populates="campaign", cascade="all, delete-orphan")
    performance_records = relationship("CampaignPerformance", back_populates="campaign", cascade="all, delete-orphan")
    attribution_records = relationship("AttributionRecord", back_populates="campaign", cascade="all, delete-orphan")
    optimization_runs = relationship("OptimizationRun", back_populates="campaign", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="campaign", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="campaign", cascade="all, delete-orphan")


class Influencer(Base):
    __tablename__ = "influencers"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    handle = Column(String(100), nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)  # INSTAGRAM, YOUTUBE, TIKTOK
    niche = Column(String(100), nullable=False, index=True)  # Tech, Fashion, Fitness, Beauty, Finance
    follower_count = Column(Integer, default=0)
    audience_quality_score = Column(Float, default=85.0)  # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="influencers")
    campaign_influencers = relationship("CampaignInfluencer", back_populates="influencer", cascade="all, delete-orphan")
    performance_records = relationship("CampaignPerformance", back_populates="influencer", cascade="all, delete-orphan")
    attribution_records = relationship("AttributionRecord", back_populates="influencer", cascade="all, delete-orphan")
    optimization_allocations = relationship("OptimizationAllocation", back_populates="influencer")


class CampaignInfluencer(Base):
    __tablename__ = "campaign_influencers"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    influencer_id = Column(Integer, ForeignKey("influencers.id", ondelete="CASCADE"), nullable=False, index=True)
    contracted_fee = Column(Float, default=0.0)
    content_cost = Column(Float, default=0.0)
    other_cost = Column(Float, default=0.0)
    planned_budget = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="campaign_influencers")
    influencer = relationship("Influencer", back_populates="campaign_influencers")


class CampaignPerformance(Base):
    __tablename__ = "campaign_performance"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    influencer_id = Column(Integer, ForeignKey("influencers.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    engagements = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    attributed_revenue = Column(Float, default=0.0)
    spend = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="performance_records")
    influencer = relationship("Influencer", back_populates="performance_records")

    __table_args__ = (
        Index("idx_perf_camp_inf_date", "campaign_id", "influencer_id", "date"),
    )


class AttributionRecord(Base):
    __tablename__ = "attribution_records"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    influencer_id = Column(Integer, ForeignKey("influencers.id", ondelete="CASCADE"), nullable=False, index=True)
    conversion_id = Column(String(100), nullable=False, index=True)
    attributed_revenue = Column(Float, nullable=False)
    attribution_method = Column(String(50), default="LAST_CLICK")  # LAST_CLICK, FIRST_CLICK, LINEAR, POSITION_BASED
    attribution_window = Column(String(50), default="30_DAYS")
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)

    campaign = relationship("Campaign", back_populates="attribution_records")
    influencer = relationship("Influencer", back_populates="attribution_records")


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    total_budget = Column(Float, nullable=False)
    objective = Column(String(50), default="MAX_REVENUE")  # MAX_REVENUE, MAX_CONTRIBUTION
    constraints_json = Column(JSON, default=dict)
    baseline_expected_revenue = Column(Float, default=0.0)
    optimized_expected_revenue = Column(Float, default=0.0)
    baseline_expected_contribution = Column(Float, default=0.0)
    optimized_expected_contribution = Column(Float, default=0.0)
    solver_status = Column(String(50), default="SUCCESS")  # SUCCESS, INFEASIBLE, FAILED
    solver_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="optimization_runs")
    allocations = relationship("OptimizationAllocation", back_populates="optimization_run", cascade="all, delete-orphan")


class OptimizationAllocation(Base):
    __tablename__ = "optimization_allocations"

    id = Column(Integer, primary_key=True, index=True)
    optimization_run_id = Column(Integer, ForeignKey("optimization_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    influencer_id = Column(Integer, ForeignKey("influencers.id", ondelete="CASCADE"), nullable=False, index=True)
    baseline_budget = Column(Float, default=0.0)
    recommended_budget = Column(Float, default=0.0)
    expected_revenue = Column(Float, default=0.0)
    expected_contribution = Column(Float, default=0.0)
    marginal_return = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    optimization_run = relationship("OptimizationRun", back_populates="allocations")
    influencer = relationship("Influencer", back_populates="optimization_allocations")


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    assumptions_json = Column(JSON, default=dict)
    baseline_results_json = Column(JSON, default=dict)
    scenario_results_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="scenarios")
    campaign = relationship("Campaign", back_populates="scenarios")


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), default="CSV")  # CSV, XLSX
    status = Column(String(50), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    total_rows = Column(Integer, default=0)
    successful_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    summary_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="imports")
    error_logs = relationship("ImportErrorLog", back_populates="import_job", cascade="all, delete-orphan")


class ImportErrorLog(Base):
    __tablename__ = "import_error_logs"

    id = Column(Integer, primary_key=True, index=True)
    import_job_id = Column(Integer, ForeignKey("import_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    field_name = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=False)
    raw_data_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    import_job = relationship("ImportJob", back_populates="error_logs")


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True, index=True)
    category = Column(String(50), default="PERFORMANCE")  # PERFORMANCE, BUDGET, RISK, OPPORTUNITY
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    evidence_json = Column(JSON, default=dict)
    recommended_action = Column(Text, nullable=True)
    quality_score = Column(Float, default=1.0)  # 0.0 to 1.0 confidence/quality
    status = Column(String(50), default="ACTIVE")  # ACTIVE, REVIEWED, DISMISSED
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="insights")
    campaign = relationship("Campaign", back_populates="insights")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # CREATE_CAMPAIGN, RUN_OPTIMIZATION, IMPORT_DATA, etc.
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")
