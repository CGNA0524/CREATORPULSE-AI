# CreatorPulse AI — Data Dictionary

This document details the normalized relational database schema powering CreatorPulse AI.

---

## 1. Core Entity Tables

### 1.1 `users`
Stores user identities, active status, and password credentials.
- `id` (INTEGER, PK): Unique user identifier.
- `name` (VARCHAR(120), NOT NULL): User display name.
- `email` (VARCHAR(255), UNIQUE, INDEX): Login email address.
- `password_hash` (VARCHAR(255), NOT NULL): Bcrypt hashed password.
- `is_active` (BOOLEAN, DEFAULT True): Account status.
- `created_at` / `updated_at` (DATETIME): Timestamps.

### 1.2 `organizations`
Represents an isolated multi-tenant brand or agency workspace.
- `id` (INTEGER, PK): Workspace ID.
- `name` (VARCHAR(150), NOT NULL): Organization name.
- `currency` (VARCHAR(10), DEFAULT 'INR'): Reporting currency (e.g. INR, USD).
- `gross_margin_pct` (FLOAT, DEFAULT 40.0): Default product margin percentage.
- `created_at` (DATETIME): Creation timestamp.

### 1.3 `organization_memberships`
Junction table linking users to organizations with access roles.
- `id` (INTEGER, PK): Record ID.
- `organization_id` (INTEGER, FK -> organizations.id, ON DELETE CASCADE).
- `user_id` (INTEGER, FK -> users.id, ON DELETE CASCADE).
- `role` (VARCHAR(50), DEFAULT 'admin'): User role ('owner', 'admin', 'analyst', 'viewer').

---

## 2. Marketing & Creator Entities

### 2.1 `campaigns`
Marketing campaign initiatives.
- `id` (INTEGER, PK): Campaign ID.
- `organization_id` (INTEGER, FK -> organizations.id, ON DELETE CASCADE).
- `name` (VARCHAR(200), INDEX): Campaign title.
- `objective` (VARCHAR(100)): 'CONVERSIONS', 'REVENUE', 'AWARENESS', 'TRAFFIC'.
- `platform` (VARCHAR(50)): 'MULTI', 'INSTAGRAM', 'YOUTUBE', 'TIKTOK'.
- `start_date` (DATE, NOT NULL): Launch date.
- `end_date` (DATE, NULLABLE): Conclusion date.
- `allocated_budget` (FLOAT, DEFAULT 0.0): Total allocated budget.
- `currency` (VARCHAR(10), DEFAULT 'INR'): Campaign currency.
- `status` (VARCHAR(50), DEFAULT 'ACTIVE'): 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'.

### 2.2 `influencers`
Creator profiles and audience authenticity ratings.
- `id` (INTEGER, PK): Creator ID.
- `organization_id` (INTEGER, FK -> organizations.id, ON DELETE CASCADE).
- `name` (VARCHAR(150), NOT NULL): Full creator name.
- `handle` (VARCHAR(100), INDEX): Social platform handle (without @).
- `platform` (VARCHAR(50), INDEX): 'INSTAGRAM', 'YOUTUBE', 'TIKTOK'.
- `niche` (VARCHAR(100), INDEX): 'Tech', 'Fashion', 'Fitness', 'Beauty', 'Finance', etc.
- `follower_count` (INTEGER): Audience size.
- `audience_quality_score` (FLOAT): Authenticity rating from 0.0 to 100.0.

### 2.3 `campaign_influencers`
Contracted engagements between campaigns and creators.
- `id` (INTEGER, PK): Engagement ID.
- `campaign_id` (INTEGER, FK -> campaigns.id, ON DELETE CASCADE).
- `influencer_id` (INTEGER, FK -> influencers.id, ON DELETE CASCADE).
- `contracted_fee` (FLOAT): Negotiated creator fee.
- `planned_budget` (FLOAT): Allocated spend.

---

## 3. Performance & Attribution

### 3.1 `campaign_performance`
Granular daily performance observations.
- `id` (INTEGER, PK): Record ID.
- `campaign_id` (INTEGER, FK -> campaigns.id, ON DELETE CASCADE).
- `influencer_id` (INTEGER, FK -> influencers.id, ON DELETE CASCADE).
- `date` (DATE, INDEX): Observation date.
- `spend` (FLOAT, DEFAULT 0.0): Daily marketing spend in INR.
- `impressions` (INTEGER, DEFAULT 0): Total impressions.
- `reach` (INTEGER, DEFAULT 0): Unique audience reached.
- `engagements` (INTEGER, DEFAULT 0): Likes, comments, shares, saves.
- `clicks` (INTEGER, DEFAULT 0): Link or sticker clicks.
- `conversions` (INTEGER, DEFAULT 0): Completed orders or acquisitions.
- `attributed_revenue` (FLOAT, DEFAULT 0.0): Attributed sales revenue in INR.
- Composite Index: `idx_perf_camp_inf_date` (`campaign_id`, `influencer_id`, `date`).

---

## 4. Optimization, Scenarios & Insights

### 4.1 `optimization_runs`
Records executed SLSQP solver sessions.
- `id` (INTEGER, PK): Run identifier.
- `campaign_id` (INTEGER, FK -> campaigns.id, ON DELETE CASCADE, NULLABLE).
- `organization_id` (INTEGER, FK -> organizations.id, ON DELETE CASCADE).
- `total_budget` (FLOAT): Budget solved for.
- `objective` (VARCHAR(50)): 'MAX_REVENUE' or 'MAX_CONTRIBUTION'.
- `baseline_expected_revenue` (FLOAT): Pre-optimization projected revenue.
- `optimized_expected_revenue` (FLOAT): Post-optimization projected revenue.
- `solver_status` (VARCHAR(50)): 'SUCCESS', 'INFEASIBLE', 'FAILED'.
- `solver_message` (TEXT): Detailed convergence feedback.

### 4.2 `optimization_allocations`
Creator-level output allocations from an optimization run.
- `id` (INTEGER, PK): Allocation ID.
- `optimization_run_id` (INTEGER, FK -> optimization_runs.id, ON DELETE CASCADE).
- `influencer_id` (INTEGER, FK -> influencers.id, ON DELETE CASCADE).
- `baseline_budget` (FLOAT): Current / baseline budget.
- `recommended_budget` (FLOAT): Optimal recommended allocation.
- `expected_revenue` (FLOAT): Modeled revenue from recommended budget.
- `marginal_return` (FLOAT): First derivative $dR/db$ at recommended budget.

### 4.3 `scenarios`
Saved What-If simulation records.
- `id` (INTEGER, PK): Scenario ID.
- `organization_id` (INTEGER, FK -> organizations.id, ON DELETE CASCADE).
- `name` (VARCHAR(150), NOT NULL): Scenario label.
- `assumptions_json` (JSON): Simulated parameters (total budget, caps, margin).
- `scenario_results_json` (JSON): Modeled revenue, gain, ROAS.

### 4.4 `insights`
Verified AI decision intelligence items.
- `id` (INTEGER, PK): Insight ID.
- `organization_id` (INTEGER, FK -> organizations.id, ON DELETE CASCADE).
- `category` (VARCHAR(50)): 'PERFORMANCE', 'BUDGET', 'RISK', 'OPPORTUNITY'.
- `title` (VARCHAR(255)): Insight headline.
- `explanation` (TEXT): Thorough evidence-backed explanation.
- `evidence_json` (JSON): Exact empirical metrics, benchmark values, and diffs.
- `status` (VARCHAR(50)): 'ACTIVE', 'REVIEWED', 'DISMISSED'.

### 4.5 `import_jobs` & `import_error_logs`
ETL tracking and row-by-row error auditing.
