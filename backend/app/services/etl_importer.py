import io
import csv
from datetime import datetime, date
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
from sqlalchemy.orm import Session
from backend.app.models.models import (
    Campaign, Influencer, CampaignPerformance, ImportJob, ImportErrorLog
)


REQUIRED_COLUMNS = [
    "campaign_name",
    "influencer_handle",
    "platform",
    "date",
    "spend",
    "impressions",
    "reach",
    "engagements",
    "clicks",
    "conversions",
    "attributed_revenue"
]


def parse_date_safely(val: Any) -> Optional[date]:
    if pd.isna(val) or val is None or val == "":
        return None
    if isinstance(val, (datetime, date)):
        return val.date() if isinstance(val, datetime) else val
    val_str = str(val).strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return None


def validate_and_preview_file(file_content: bytes, filename: str) -> Dict[str, Any]:
    """
    Parse uploaded file (CSV or XLSX) and validate headers and initial rows.
    """
    try:
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            # Assume CSV
            df = pd.read_csv(io.BytesIO(file_content))
    except Exception as e:
        return {
            "valid": False,
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "errors": [{"row": 0, "field": "file", "error": f"Failed to read file: {str(e)}"}],
            "preview": []
        }

    # Normalize column names
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        return {
            "valid": False,
            "total_rows": len(df),
            "valid_rows": 0,
            "invalid_rows": len(df),
            "errors": [{"row": 0, "field": "columns", "error": f"Missing required columns: {', '.join(missing_cols)}"}],
            "preview": df.head(5).to_dict(orient="records")
        }

    errors = []
    valid_count = 0
    preview_rows = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # Excel 1-based indexing with header
        row_errors = []

        # Validate campaign and influencer
        camp_name = str(row.get("campaign_name", "")).strip()
        inf_handle = str(row.get("influencer_handle", "")).strip()
        platform = str(row.get("platform", "")).strip().upper()

        if not camp_name or camp_name == "nan":
            row_errors.append("campaign_name cannot be empty")
        if not inf_handle or inf_handle == "nan":
            row_errors.append("influencer_handle cannot be empty")
        if not platform or platform == "nan":
            row_errors.append("platform cannot be empty")

        # Validate date
        parsed_dt = parse_date_safely(row.get("date"))
        if not parsed_dt:
            row_errors.append("date must be a valid date format (e.g. YYYY-MM-DD)")

        # Validate numerics
        try:
            spend = float(row.get("spend", 0.0))
            if spend < 0:
                row_errors.append("spend cannot be negative")
        except (ValueError, TypeError):
            row_errors.append("spend must be a valid number")

        try:
            impr = int(row.get("impressions", 0))
            reach = int(row.get("reach", 0))
            eng = int(row.get("engagements", 0))
            clicks = int(row.get("clicks", 0))
            conv = int(row.get("conversions", 0))

            if impr < 0 or reach < 0 or eng < 0 or clicks < 0 or conv < 0:
                row_errors.append("metric counts cannot be negative")
            if conv > clicks and clicks > 0:
                row_errors.append("conversions cannot exceed clicks")
        except (ValueError, TypeError):
            row_errors.append("metrics must be valid integers")

        try:
            rev = float(row.get("attributed_revenue", 0.0))
            if rev < 0:
                row_errors.append("attributed_revenue cannot be negative")
        except (ValueError, TypeError):
            row_errors.append("attributed_revenue must be a valid number")

        if row_errors:
            errors.append({
                "row": row_num,
                "field": "validation",
                "error": "; ".join(row_errors),
                "data": {k: (str(v) if not pd.isna(v) else "") for k, v in row.items()}
            })
        else:
            valid_count += 1

        if len(preview_rows) < 10:
            preview_rows.append({k: (str(v) if not pd.isna(v) else "") for k, v in row.items()})

    return {
        "valid": len(errors) == 0,
        "total_rows": len(df),
        "valid_rows": valid_count,
        "invalid_rows": len(errors),
        "errors": errors[:50],  # cap preview errors to 50
        "preview": preview_rows
    }


def execute_import(
    db: Session,
    org_id: int,
    file_content: bytes,
    filename: str
) -> Tuple[ImportJob, List[ImportErrorLog]]:
    """
    Execute full transactional import and create or update Campaign and Influencer records.
    """
    file_type = "XLSX" if (filename.endswith(".xlsx") or filename.endswith(".xls")) else "CSV"
    job = ImportJob(
        organization_id=org_id,
        filename=filename,
        file_type=file_type,
        status="PROCESSING",
        total_rows=0,
        successful_rows=0,
        failed_rows=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        if file_type == "XLSX":
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            df = pd.read_csv(io.BytesIO(file_content))
    except Exception as e:
        job.status = "FAILED"
        job.summary_message = f"Error reading file: {str(e)}"
        db.commit()
        return job, []

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    job.total_rows = len(df)

    campaign_cache: Dict[str, Campaign] = {}
    influencer_cache: Dict[str, Influencer] = {}

    # Pre-populate cache
    existing_camps = db.query(Campaign).filter(Campaign.organization_id == org_id).all()
    for c in existing_camps:
        campaign_cache[c.name.lower()] = c

    existing_infs = db.query(Influencer).filter(Influencer.organization_id == org_id).all()
    for inf in existing_infs:
        influencer_cache[f"{inf.handle.lower()}_{inf.platform.lower()}"] = inf

    error_logs = []
    success_count = 0

    for idx, row in df.iterrows():
        row_num = idx + 2
        camp_name = str(row.get("campaign_name", "")).strip()
        inf_handle = str(row.get("influencer_handle", "")).strip().lstrip("@")
        platform = str(row.get("platform", "INSTAGRAM")).strip().upper()
        parsed_dt = parse_date_safely(row.get("date"))

        # Basic validations
        if not camp_name or not inf_handle or not parsed_dt:
            err = ImportErrorLog(
                import_job_id=job.id,
                row_number=row_num,
                field_name="required_fields",
                error_message="Missing campaign_name, influencer_handle, or valid date",
                raw_data_json={k: (str(v) if not pd.isna(v) else "") for k, v in row.items()}
            )
            error_logs.append(err)
            continue

        try:
            spend = float(row.get("spend", 0.0))
            impr = int(row.get("impressions", 0))
            reach = int(row.get("reach", 0))
            eng = int(row.get("engagements", 0))
            clicks = int(row.get("clicks", 0))
            conv = int(row.get("conversions", 0))
            rev = float(row.get("attributed_revenue", 0.0))

            if spend < 0 or rev < 0 or impr < 0 or conv < 0:
                raise ValueError("Negative values detected")
            if conv > clicks and clicks > 0:
                raise ValueError("Conversions exceed clicks")
        except Exception as e:
            err = ImportErrorLog(
                import_job_id=job.id,
                row_number=row_num,
                field_name="metrics",
                error_message=f"Metric validation failed: {str(e)}",
                raw_data_json={k: (str(v) if not pd.isna(v) else "") for k, v in row.items()}
            )
            error_logs.append(err)
            continue

        # Get or create campaign
        camp_key = camp_name.lower()
        if camp_key not in campaign_cache:
            new_camp = Campaign(
                organization_id=org_id,
                name=camp_name,
                platform=platform,
                start_date=parsed_dt,
                allocated_budget=spend * 5.0,
                status="ACTIVE"
            )
            db.add(new_camp)
            db.flush()
            campaign_cache[camp_key] = new_camp

        campaign_obj = campaign_cache[camp_key]

        # Get or create influencer
        inf_key = f"{inf_handle.lower()}_{platform.lower()}"
        if inf_key not in influencer_cache:
            new_inf = Influencer(
                organization_id=org_id,
                name=inf_handle.replace("_", " ").title(),
                handle=inf_handle,
                platform=platform,
                niche="General",
                follower_count=50000,
                audience_quality_score=85.0
            )
            db.add(new_inf)
            db.flush()
            influencer_cache[inf_key] = new_inf

        influencer_obj = influencer_cache[inf_key]

        # Add CampaignPerformance record
        perf = CampaignPerformance(
            campaign_id=campaign_obj.id,
            influencer_id=influencer_obj.id,
            date=parsed_dt,
            spend=spend,
            impressions=impr,
            reach=reach,
            engagements=eng,
            clicks=clicks,
            conversions=conv,
            attributed_revenue=rev
        )
        db.add(perf)
        success_count += 1

    if error_logs:
        db.add_all(error_logs)

    job.successful_rows = success_count
    job.failed_rows = len(error_logs)
    job.status = "COMPLETED" if len(error_logs) == 0 else ("PARTIAL_SUCCESS" if success_count > 0 else "FAILED")
    job.summary_message = f"Processed {job.total_rows} rows: {success_count} succeeded, {len(error_logs)} failed."

    db.commit()
    db.refresh(job)
    return job, error_logs
