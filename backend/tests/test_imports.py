import pytest
from backend.app.services.etl_importer import validate_and_preview_file


def test_validate_and_preview_valid_csv():
    csv_content = b"""campaign_name,influencer_handle,platform,date,spend,impressions,reach,engagements,clicks,conversions,attributed_revenue
Festive 2026,priya_style,INSTAGRAM,2026-09-01,10000,40000,35000,1800,800,35,42000
Festive 2026,aarav_tech,YOUTUBE,2026-09-01,15000,50000,45000,2200,1100,50,65000
"""
    result = validate_and_preview_file(csv_content, "test.csv")
    assert result["valid"] is True
    assert result["total_rows"] == 2
    assert result["valid_rows"] == 2
    assert result["invalid_rows"] == 0
    assert len(result["errors"]) == 0


def test_validate_and_preview_missing_columns():
    csv_content = b"""campaign_name,spend,conversions
Festive 2026,10000,35
"""
    result = validate_and_preview_file(csv_content, "test.csv")
    assert result["valid"] is False
    assert any("Missing required columns" in err["error"] for err in result["errors"])


def test_validate_and_preview_conversions_exceeding_clicks():
    csv_content = b"""campaign_name,influencer_handle,platform,date,spend,impressions,reach,engagements,clicks,conversions,attributed_revenue
Festive 2026,priya_style,INSTAGRAM,2026-09-01,10000,40000,35000,1800,50,80,42000
"""
    result = validate_and_preview_file(csv_content, "test.csv")
    assert result["valid"] is False
    assert result["invalid_rows"] == 1
    assert any("conversions cannot exceed clicks" in err["error"] for err in result["errors"])


def test_validate_and_preview_negative_spend():
    csv_content = b"""campaign_name,influencer_handle,platform,date,spend,impressions,reach,engagements,clicks,conversions,attributed_revenue
Festive 2026,priya_style,INSTAGRAM,2026-09-01,-5000,40000,35000,1800,500,20,42000
"""
    result = validate_and_preview_file(csv_content, "test.csv")
    assert result["valid"] is False
    assert result["invalid_rows"] == 1
    assert any("spend cannot be negative" in err["error"] for err in result["errors"])
