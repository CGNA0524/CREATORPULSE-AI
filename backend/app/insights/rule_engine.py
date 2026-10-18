from typing import List, Dict, Any


def generate_deterministic_insights(
    kpi_summary: Dict[str, Any],
    influencers: List[Dict[str, Any]],
    campaigns: List[Dict[str, Any]],
    optimization_result: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    """
    Generate evidence-grounded insights strictly from verified empirical calculations.
    """
    insights = []

    # 1. Platform Concentration Risk
    platform_spend: Dict[str, float] = {}
    total_spend = kpi_summary.get("total_spend", 0.0)
    for inf in influencers:
        p = inf.get("platform", "Unknown")
        platform_spend[p] = platform_spend.get(p, 0.0) + float(inf.get("spend") or 0.0)

    if total_spend > 0:
        for p, s in platform_spend.items():
            pct = (s / total_spend) * 100.0
            if pct > 65.0:
                insights.append({
                    "category": "RISK",
                    "title": f"High Platform Concentration on {p} ({pct:.1f}%)",
                    "explanation": (
                        f"{pct:.1f}% of total influencer marketing spend (₹{s:,.2f} of ₹{total_spend:,.2f}) "
                        f"is concentrated solely on {p}. This exposes the brand to platform algorithm shifts and ad saturation."
                    ),
                    "evidence_json": {
                        "platform": p,
                        "platform_spend": round(s, 2),
                        "total_spend": round(total_spend, 2),
                        "concentration_pct": round(pct, 1),
                        "benchmark_threshold_pct": 65.0,
                    },
                    "recommended_action": f"Diversify budget allocation by testing creators on secondary platforms such as YouTube or Instagram.",
                    "quality_score": 0.95,
                    "status": "ACTIVE",
                })

    # 2. Top Performing Creators (High ROAS)
    high_roas_creators = [
        inf for inf in influencers 
        if float(inf.get("spend") or 0.0) >= 10000.0 and float(inf.get("roas") or 0.0) >= 3.5
    ]
    if high_roas_creators:
        top_inf = max(high_roas_creators, key=lambda x: float(x.get("roas") or 0.0))
        top_roas = float(top_inf.get("roas") or 0.0)
        top_spend = float(top_inf.get("spend") or 0.0)
        top_rev = float(top_inf.get("attributed_revenue") or 0.0)
        avg_roas = kpi_summary.get("roas", 0.0)

        insights.append({
            "category": "PERFORMANCE",
            "title": f"Star Performer: @{top_inf['handle']} delivering {top_roas:.2f}x ROAS",
            "explanation": (
                f"Influencer @{top_inf['handle']} ({top_inf.get('niche', 'Creator')}) generated ₹{top_rev:,.2f} "
                f"in attributed revenue from ₹{top_spend:,.2f} spend, outperforming portfolio average ROAS ({avg_roas:.2f}x) "
                f"by {((top_roas - avg_roas) / max(0.1, avg_roas) * 100):.1f}%."
            ),
            "evidence_json": {
                "influencer_id": top_inf["id"],
                "handle": top_inf["handle"],
                "spend": top_spend,
                "revenue": top_rev,
                "creator_roas": round(top_roas, 2),
                "portfolio_roas": round(avg_roas, 2),
            },
            "recommended_action": "Prioritize @{top_inf['handle']} for higher budget ceiling or recurring partnership commitments.",
            "quality_score": 0.98,
            "status": "ACTIVE",
        })

    # 3. CPA Inefficiencies (High CPA relative to average)
    avg_cpa = kpi_summary.get("cpa")
    if avg_cpa and avg_cpa > 0:
        high_cpa_creators = [
            inf for inf in influencers
            if float(inf.get("spend") or 0.0) >= 15000.0 
            and inf.get("cpa") is not None 
            and float(inf["cpa"]) > avg_cpa * 1.6
        ]
        if high_cpa_creators:
            worst = max(high_cpa_creators, key=lambda x: float(x["cpa"]))
            w_cpa = float(worst["cpa"])
            insights.append({
                "category": "PERFORMANCE",
                "title": f"Elevated Customer Acquisition Cost for @{worst['handle']} (₹{w_cpa:,.2f})",
                "explanation": (
                    f"@{worst['handle']} has a CPA of ₹{w_cpa:,.2f}, which is {((w_cpa - avg_cpa) / avg_cpa * 100):.1f}% "
                    f"higher than the portfolio benchmark of ₹{avg_cpa:,.2f}. Conversions are relatively low given the spend."
                ),
                "evidence_json": {
                    "influencer_id": worst["id"],
                    "handle": worst["handle"],
                    "creator_cpa": round(w_cpa, 2),
                    "portfolio_cpa": round(avg_cpa, 2),
                    "spend": float(worst.get("spend") or 0.0),
                    "conversions": int(worst.get("conversions") or 0),
                },
                "recommended_action": "Review creative briefing or renegotiate deliverables to improve conversion efficiency.",
                "quality_score": 0.92,
                "status": "ACTIVE",
            })

    # 4. Optimization Expansion Opportunity
    if optimization_result and optimization_result.get("solver_status") == "SUCCESS":
        rev_change_pct = optimization_result.get("revenue_change_pct", 0.0)
        rev_change = optimization_result.get("revenue_change", 0.0)
        if rev_change_pct > 3.0:
            insights.append({
                "category": "OPPORTUNITY",
                "title": f"Budget Reallocation Opportunity (+{rev_change_pct:.1f}% Modeled Revenue)",
                "explanation": (
                    f"Constrained SciPy SLSQP optimization projects an additional ₹{rev_change:,.2f} in attributed revenue "
                    f"(+{rev_change_pct:.1f}%) without increasing total budget, by shifting capital from saturated creators "
                    f"to high marginal return influencers."
                ),
                "evidence_json": {
                    "current_revenue": optimization_result.get("baseline_expected_revenue"),
                    "optimized_revenue": optimization_result.get("optimized_expected_revenue"),
                    "revenue_gain": round(rev_change, 2),
                    "revenue_gain_pct": round(rev_change_pct, 1),
                    "total_budget": optimization_result.get("total_budget"),
                },
                "recommended_action": "Navigate to Budget Optimization or Simulator to inspect recommended shifts and apply allocations.",
                "quality_score": 0.96,
                "status": "ACTIVE",
            })

    # 5. Diminishing Return / Saturation Warning
    if optimization_result:
        for alloc in optimization_result.get("allocations", []):
            if alloc.get("saturation_pct", 0.0) >= 88.0 and alloc.get("marginal_return", 0.0) < 0.6:
                insights.append({
                    "category": "BUDGET",
                    "title": f"Diminishing Returns Detected on @{alloc['handle']}",
                    "explanation": (
                        f"Influencer @{alloc['handle']} has reached {alloc['saturation_pct']:.1f}% of theoretical revenue saturation. "
                        f"Expected marginal return has dropped to ₹{alloc['marginal_return']:.2f} per additional ₹1 spent."
                    ),
                    "evidence_json": {
                        "handle": alloc["handle"],
                        "saturation_pct": alloc["saturation_pct"],
                        "marginal_return": alloc["marginal_return"],
                        "recommended_budget": alloc["recommended_budget"],
                    },
                    "recommended_action": f"Cap budget for @{alloc['handle']} to prevent capital waste and deploy incremental funds to under-saturated creators.",
                    "quality_score": 0.94,
                    "status": "ACTIVE",
                })
                break

    return insights
