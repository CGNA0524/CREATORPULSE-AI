from typing import Optional, Dict, Any, List


def calculate_roas(revenue: float, spend: float) -> Optional[float]:
    """
    Return ROAS = Attributed Revenue / Spend.
    Returns None if spend <= 0 to avoid division by zero or nonsensical infinite ROAS.
    """
    if spend <= 0:
        return None
    return round(revenue / spend, 4)


def calculate_cpa(spend: float, conversions: int) -> Optional[float]:
    """
    Return CPA = Total Spend / Conversions.
    Returns None if conversions <= 0.
    """
    if conversions <= 0:
        return None
    return round(spend / conversions, 2)


def calculate_conversion_rate(conversions: int, clicks: int) -> Optional[float]:
    """
    Return Conversion Rate % = (Conversions / Clicks) * 100.
    Returns None if clicks <= 0.
    """
    if clicks <= 0:
        return None
    return round((conversions / clicks) * 100.0, 2)


def calculate_engagement_rate(engagements: int, impressions: int) -> Optional[float]:
    """
    Explicitly labeled impressions-based formula:
    Engagement Rate % = (Engagements / Impressions) * 100.
    Returns None if impressions <= 0.
    """
    if impressions <= 0:
        return None
    return round((engagements / impressions) * 100.0, 2)


def calculate_cpc(spend: float, clicks: int) -> Optional[float]:
    """
    Cost Per Click = Spend / Clicks.
    Returns None if clicks <= 0.
    """
    if clicks <= 0:
        return None
    return round(spend / clicks, 2)


def calculate_cpm(spend: float, impressions: int) -> Optional[float]:
    """
    Cost Per Thousand Impressions = (Spend / Impressions) * 1000.
    Returns None if impressions <= 0.
    """
    if impressions <= 0:
        return None
    return round((spend / impressions) * 1000.0, 2)


def calculate_aov(revenue: float, conversions: int) -> Optional[float]:
    """
    Average Order Value = Attributed Revenue / Conversions (Orders).
    Returns None if conversions <= 0.
    """
    if conversions <= 0:
        return None
    return round(revenue / conversions, 2)


def calculate_net_contribution(revenue: float, spend: float) -> float:
    """
    Net Contribution After Marketing Spend = Revenue - Spend.
    Excludes unmodeled COGS or overheads.
    """
    return round(revenue - spend, 2)


def calculate_contribution_margin(revenue: float, spend: float) -> Optional[float]:
    """
    Contribution Margin % = ((Revenue - Spend) / Revenue) * 100.
    Returns None if revenue <= 0.
    """
    if revenue <= 0:
        return None
    return round(((revenue - spend) / revenue) * 100.0, 2)


def calculate_iroas(incremental_revenue: float, incremental_spend: float) -> Optional[float]:
    """
    Incremental ROAS = Incremental Revenue / Incremental Spend.
    Returns None if incremental_spend <= 0.
    """
    if incremental_spend <= 0:
        return None
    return round(incremental_revenue / incremental_spend, 4)


def aggregate_kpis(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate metrics strictly using totals divided by totals.
    NEVER average individual ratios.
    """
    total_spend = sum(float(r.get("spend") or 0.0) for r in records)
    total_revenue = sum(float(r.get("attributed_revenue") or 0.0) for r in records)
    total_impressions = sum(int(r.get("impressions") or 0) for r in records)
    total_reach = sum(int(r.get("reach") or 0) for r in records)
    total_engagements = sum(int(r.get("engagements") or 0) for r in records)
    total_clicks = sum(int(r.get("clicks") or 0) for r in records)
    total_conversions = sum(int(r.get("conversions") or 0) for r in records)

    roas = calculate_roas(total_revenue, total_spend)
    cpa = calculate_cpa(total_spend, total_conversions)
    conv_rate = calculate_conversion_rate(total_conversions, total_clicks)
    eng_rate = calculate_engagement_rate(total_engagements, total_impressions)
    cpc = calculate_cpc(total_spend, total_clicks)
    cpm = calculate_cpm(total_spend, total_impressions)
    aov = calculate_aov(total_revenue, total_conversions)
    contribution = calculate_net_contribution(total_revenue, total_spend)
    margin = calculate_contribution_margin(total_revenue, total_spend)

    return {
        "total_spend": round(total_spend, 2),
        "attributed_revenue": round(total_revenue, 2),
        "roas": roas if roas is not None else 0.0,
        "conversions": total_conversions,
        "cpa": cpa,
        "conversion_rate": conv_rate,
        "engagement_rate": eng_rate,
        "cpc": cpc,
        "cpm": cpm,
        "aov": aov,
        "contribution": contribution,
        "contribution_margin_pct": margin,
        "total_impressions": total_impressions,
        "total_reach": total_reach,
        "total_engagements": total_engagements,
        "total_clicks": total_clicks,
    }
