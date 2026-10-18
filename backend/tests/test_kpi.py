import pytest
from backend.app.analytics.kpi import (
    calculate_roas,
    calculate_cpa,
    calculate_conversion_rate,
    calculate_engagement_rate,
    calculate_cpc,
    calculate_cpm,
    calculate_aov,
    calculate_net_contribution,
    calculate_contribution_margin,
    calculate_iroas,
    aggregate_kpis,
)


def test_calculate_roas():
    # Normal case: 300000 revenue on 100000 spend => 3.0x
    assert calculate_roas(300000.0, 100000.0) == 3.0
    # Zero spend: returns None (avoid zero division)
    assert calculate_roas(300000.0, 0.0) is None
    # Negative spend: returns None
    assert calculate_roas(300000.0, -500.0) is None


def test_calculate_cpa():
    # 50000 spend for 100 conversions => 500
    assert calculate_cpa(50000.0, 100) == 500.0
    # Zero conversions: returns None
    assert calculate_cpa(50000.0, 0) is None


def test_calculate_conversion_rate():
    # 50 conversions from 1000 clicks => 5.0%
    assert calculate_conversion_rate(50, 1000) == 5.0
    # Zero clicks: returns None
    assert calculate_conversion_rate(0, 0) is None


def test_calculate_engagement_rate():
    # 2500 engagements from 50000 impressions => 5.0%
    assert calculate_engagement_rate(2500, 50000) == 5.0
    # Zero impressions: returns None
    assert calculate_engagement_rate(100, 0) is None


def test_calculate_net_contribution_and_margin():
    rev = 500000.0
    sp = 200000.0
    contrib = calculate_net_contribution(rev, sp)
    assert contrib == 300000.0
    margin = calculate_contribution_margin(rev, sp)
    assert margin == 60.0


def test_aggregate_kpis_no_average_of_ratios():
    # Two campaigns:
    # Camp A: Spend 100, Revenue 400 (ROAS 4.0)
    # Camp B: Spend 1000, Revenue 1500 (ROAS 1.5)
    # Average of ratios = (4.0 + 1.5)/2 = 2.75 (INCORRECT)
    # Correct aggregate ROAS = (400 + 1500) / (100 + 1000) = 1900 / 1100 = 1.727x
    records = [
        {"spend": 100.0, "attributed_revenue": 400.0, "conversions": 10, "clicks": 200, "impressions": 5000},
        {"spend": 1000.0, "attributed_revenue": 1500.0, "conversions": 20, "clicks": 800, "impressions": 20000},
    ]
    res = aggregate_kpis(records)
    assert res["total_spend"] == 1100.0
    assert res["attributed_revenue"] == 1900.0
    assert abs(res["roas"] - 1.7273) < 0.001
    assert res["conversions"] == 30
    assert res["cpa"] == round(1100.0 / 30, 2)
