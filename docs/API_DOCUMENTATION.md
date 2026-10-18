# CreatorPulse AI — REST API Documentation

Base URL: `/api/v1`  
Interactive OpenAPI UI: `http://localhost:8000/api/v1/docs`  
ReDoc Reference: `http://localhost:8000/api/v1/redoc`

---

## 1. System & Health

### `GET /health`
Returns service health status.
- **Response:** `{"status": "healthy", "service": "CreatorPulse AI", "version": "1.0.0"}`

### `GET /ready`
Verifies relational database connectivity.
- **Response:** `{"status": "ready", "database": "connected"}`

---

## 2. Authentication (`/api/v1/auth`)

### `POST /auth/register`
Creates user and auto-provisions tenant workspace.
- **Body:** `{"name": "string", "email": "user@domain.com", "password": "password123"}`
- **Response:** `{"access_token": "jwt...", "token_type": "bearer", "user": {...}}`

### `POST /auth/login`
Authenticates credentials and sets HttpOnly cookie.
- **Body:** `{"email": "admin@creatorpulse.ai", "password": "Admin@123456"}`
- **Response:** `{"access_token": "jwt...", "token_type": "bearer", "user": {...}}`

### `GET /auth/me`
Fetches current authenticated profile and active organization.

---

## 3. Executive Dashboard (`/api/v1/dashboard`)

### `GET /dashboard/summary`
Returns aggregated portfolio KPIs (Spend, Revenue, ROAS, Conversions, CPA, CVR, Engagement Rate, Contribution).
- **Query Params:** `campaign_id`, `platform`, `start_date`, `end_date`

### `GET /dashboard/trends`
Returns daily timeseries of spend, attributed revenue, ROAS, and conversions.

### `GET /dashboard/top-campaigns` & `GET /dashboard/top-influencers`
Returns top ranked campaigns and creators.

---

## 4. Campaigns (`/api/v1/campaigns`)

- `GET /campaigns`: List all campaigns with real-time spend, revenue, and ROAS.
- `POST /campaigns`: Create campaign with allocated budget and date bounds.
- `GET /campaigns/{id}`: Detailed campaign breakdown including assigned creators.
- `PATCH /campaigns/{id}`: Update campaign settings.
- `DELETE /campaigns/{id}`: Soft or hard delete campaign.

---

## 5. Influencer Intelligence (`/api/v1/influencers`)

- `GET /influencers`: List creator roster with audience authenticity ratings.
- `POST /influencers`: Register new creator.
- `GET /influencers/{id}`: Detailed profile with calibrated response curve $R(b)$ and marginal returns.
- `GET /influencers/{id}/performance`: Timeseries performance records.

---

## 6. Budget Optimization (`/api/v1/optimization`)

### `POST /optimization/validate`
Pre-checks feasibility of budget bounds and platform caps without writing to database.

### `POST /optimization/run`
Executes SciPy SLSQP constrained optimization over non-linear response curves.
- **Body:**
```json
{
  "total_budget": 3500000,
  "objective": "MAX_REVENUE",
  "gross_margin_pct": 40.0,
  "platform_caps": {"INSTAGRAM": 1800000},
  "influencer_constraints": [
    {"influencer_id": 1, "min_budget": 20000, "max_budget": 600000, "is_eligible": true}
  ]
}
```
- **Response:** Contains solver status, baseline vs optimized comparison, revenue gain, ROAS comparison, and per-creator recommended allocations.

---

## 7. What-If Scenarios (`/api/v1/scenarios`)

- `POST /scenarios/simulate`: On-the-fly simulation without saving.
- `POST /scenarios`: Persists named scenario to database.
- `GET /scenarios`: Lists saved scenarios.
- `POST /scenarios/compare`: Returns side-by-side comparison matrix for multiple scenario IDs.

---

## 8. Data Ingestion & ETL (`/api/v1/imports`)

- `POST /imports/validate`: Validates CSV/Excel files and returns row-by-row preview and errors.
- `POST /imports/upload`: Commits validated records into the database with transaction protection.
- `GET /imports/template/download`: Downloads standard CSV template.
- `GET /imports/{id}/errors`: Retrieves downloadable row error logs.
