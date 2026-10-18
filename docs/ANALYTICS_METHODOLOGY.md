# CreatorPulse AI — Marketing Analytics Methodology

This document outlines the mathematical formulas, aggregation rules, and numerical safeguards implemented in `backend/app/analytics/kpi.py`.

---

## 1. Core Metric Formulations

### 1.1 Return on Ad Spend (ROAS)
$$\text{ROAS} = \frac{\text{Attributed Revenue}}{\text{Spend}}$$
- **Display Format:** Multiplier with 2 decimal places (e.g. `3.42x`).
- **Safeguard:** If $\text{Spend} \le 0$, ROAS is evaluated as `null` / explicit unavailable state rather than infinite.

### 1.2 Cost Per Acquisition (CPA)
$$\text{CPA} = \frac{\text{Total Spend}}{\text{Conversions}}$$
- **Definition:** The marketing capital required to generate one acquisition or purchase.
- **Safeguard:** Returns `null` if conversions are zero.

### 1.3 Conversion Rate (CVR %)
$$\text{CVR} = \left(\frac{\text{Conversions}}{\text{Clicks}}\right) \times 100$$
- **Safeguard:** Requires $\text{Clicks} > 0$. Guarded against funnels where conversions exceed clicks.

### 1.4 Engagement Rate %
$$\text{Engagement Rate} = \left(\frac{\text{Engagements}}{\text{Impressions}}\right) \times 100$$
- **Methodology Note:** Explicitly labeled as an **impressions-based** engagement formula to ensure cross-platform comparability.

### 1.5 Cost Per Click (CPC) & Cost Per Thousand (CPM)
$$\text{CPC} = \frac{\text{Spend}}{\text{Clicks}}, \quad \text{CPM} = \left(\frac{\text{Spend}}{\text{Impressions}}\right) \times 1000$$

### 1.6 Net Commercial Contribution & Margin %
$$\text{Contribution} = \text{Attributed Revenue} - \text{Spend}$$
$$\text{Contribution Margin \%} = \left(\frac{\text{Attributed Revenue} - \text{Spend}}{\text{Attributed Revenue}}\right) \times 100$$
- **Accounting Clarification:** Represents commercial contribution after direct marketing expenditure before cost of goods sold (COGS) and unmodeled fixed overheads.

---

## 2. Mandatory Aggregation Rules

### Rule 1: Totals Divided by Totals
Aggregate portfolio metrics must **always** be calculated by summing numerators and denominators across the entire scope before dividing:
$$\text{Aggregate ROAS} = \frac{\sum_{j} \text{Revenue}_j}{\sum_{j} \text{Spend}_j}$$

$$\text{Aggregate CPA} = \frac{\sum_{j} \text{Spend}_j}{\sum_{j} \text{Conversions}_j}$$

### Rule 2: Never Average Ratios
Taking the arithmetic mean of individual influencer ROAS values produces false results by giving equal weight to small experimental spends and large anchor campaigns. 
- *Example:* Campaign A spends ₹100 for ₹400 revenue (ROAS 4.0x). Campaign B spends ₹1,000 for ₹1,500 revenue (ROAS 1.5x).
- Average of ratios: $(4.0 + 1.5) / 2 = 2.75x$ ❌ (Incorrect)
- Correct weighted aggregate: $(400 + 1500) / (100 + 1000) = 1900 / 1100 = 1.73x$ ✅ (Correct)
This rule is unit-tested and verified in `backend/tests/test_kpi.py`.
