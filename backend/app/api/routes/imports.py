import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization, get_current_user
from backend.app.models.models import ImportJob, ImportErrorLog, Organization, User, AuditLog
from backend.app.schemas.all_schemas import ImportJobResponse, ImportValidationSummary
from backend.app.services.etl_importer import validate_and_preview_file, execute_import, REQUIRED_COLUMNS

router = APIRouter(prefix="/imports", tags=["Data Import"])


@router.post("/validate", response_model=ImportValidationSummary)
async def validate_import_file(
    file: UploadFile = File(...),
    org: Organization = Depends(get_current_organization),
):
    contents = await file.read()
    result = validate_and_preview_file(contents, file.filename or "data.csv")
    return result


@router.post("/upload", response_model=ImportJobResponse)
async def upload_and_process_file(
    file: UploadFile = File(...),
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    job, errors = execute_import(db, org.id, contents, file.filename or "upload.csv")

    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="IMPORT_DATA",
        entity_type="IMPORT_JOB",
        entity_id=str(job.id),
        details_json={
            "filename": job.filename,
            "total_rows": job.total_rows,
            "successful_rows": job.successful_rows,
            "failed_rows": job.failed_rows,
        }
    ))
    db.commit()

    return job


@router.get("", response_model=List[ImportJobResponse])
def list_import_jobs(
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    jobs = (
        db.query(ImportJob)
        .filter(ImportJob.organization_id == org.id)
        .order_by(ImportJob.created_at.desc())
        .all()
    )
    return jobs


@router.get("/{import_id}", response_model=ImportJobResponse)
def get_import_job(
    import_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    job = db.query(ImportJob).filter(ImportJob.id == import_id, ImportJob.organization_id == org.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return job


@router.get("/{import_id}/errors")
def get_import_errors(
    import_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    job = db.query(ImportJob).filter(ImportJob.id == import_id, ImportJob.organization_id == org.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    errors = db.query(ImportErrorLog).filter(ImportErrorLog.import_job_id == job.id).all()
    return [
        {
            "row_number": e.row_number,
            "field_name": e.field_name,
            "error_message": e.error_message,
            "raw_data": e.raw_data_json,
            "created_at": e.created_at,
        }
        for e in errors
    ]


@router.get("/template/download")
def download_csv_template():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(REQUIRED_COLUMNS)
    writer.writerow([
        "Festive Sale 2026",
        "creator_handle",
        "INSTAGRAM",
        "2026-10-01",
        "15000",
        "50000",
        "42000",
        "2100",
        "950",
        "42",
        "58000"
    ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=creatorpulse_import_template.csv"}
    )
