# CreatorPulse AI — Testing & Quality Assurance Protocol

CreatorPulse AI implements automated testing covering marketing KPI formulas, mathematical budget optimization, file ingestion integrity, authentication, and frontend type compilation.

---

## 1. Test Execution Commands

### 1.1 Backend Test Suite (Pytest)
From the `backend/` directory:
```powershell
.\.venv\Scripts\pytest.exe -v
```
Expected output: 17 passed tests in ~5 seconds.

### 1.2 Frontend Production Build Verification
From the `frontend/` directory:
```powershell
npm run build
```
Verifies TypeScript strict compilation, route resolution, and standalone bundle creation.

---

## 2. Test Coverage Inventory

### 2.1 Analytics KPI Tests (`backend/tests/test_kpi.py`)
- `test_calculate_roas`: Validates normal multiplier outputs and zero/negative spend safeguards.
- `test_calculate_cpa`: Verifies cost per acquisition and zero-conversion edge cases.
- `test_calculate_conversion_rate`: Validates click-to-conversion percentages.
- `test_calculate_engagement_rate`: Validates impression-based engagement calculations.
- `test_calculate_net_contribution_and_margin`: Validates commercial contribution ($R - S$).
- `test_aggregate_kpis_no_average_of_ratios`: Critical test ensuring portfolio ratios use totals divided by totals and never take the arithmetic mean of ratios.

### 2.2 Optimization Engine Tests (`backend/tests/test_optimization.py`)
- `test_exponential_response_curve`: Validates monotonic increase, asymptotic ceiling ($R < A$), and diminishing marginal returns ($d^2R/db^2 < 0$).
- `test_optimization_budget_conservation`: Confirms the SLSQP solver distributes budget such that $\sum b_i = B$ within numerical tolerance ($10^{-4}$).
- `test_optimization_infeasible_detection`: Verifies the engine halts cleanly with an informative message when lower bounds exceed available budget ($\sum L_i > B$).
- `test_optimization_platform_caps`: Ensures platform inequality constraints ($\sum b_p \le C_p$) are strictly honored.

### 2.3 Data Ingestion Tests (`backend/tests/test_imports.py`)
- `test_validate_and_preview_valid_csv`: Verifies valid 11-column CSV parsing.
- `test_validate_and_preview_missing_columns`: Detects missing required headers.
- `test_validate_and_preview_conversions_exceeding_clicks`: Traps illogical funnels.
- `test_validate_and_preview_negative_spend`: Rejects negative monetary values.

### 2.4 Authentication & API Tests (`backend/tests/test_auth_api.py`)
- `test_password_hashing`: Tests bcrypt hash generation and verification.
- `test_health_and_ready`: Verifies `/health` and `/ready` probes.
- `test_register_and_login_flow`: End-to-end integration test validating user creation, token issuance, and protected endpoint access.
