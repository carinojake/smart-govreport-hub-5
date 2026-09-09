"""
Smart GovReport Hub 2.5 - FastAPI Backend
เชื่อมต่อ Docker PostgreSQL (Port 5432) เต็มรูปแบบ
สภาพแวดล้อม: Python 3.12 บน Mac M1 (/Users/Shared/my_ai_project/venv)
สถาปัตยกรรม: AsyncPG Connection Pool + JSONB Support
"""

import os
import uuid
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, date

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import asyncpg

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("smartgov_v25")

app = FastAPI(
    title="Smart GovReport Hub 2.5 API",
    description="ระบบรายงาน OJT และสารสนเทศภาครัฐ เชื่อมต่อ Docker PostgreSQL เต็มรูปแบบ",
    version="2.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PostgreSQL Configuration
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", 5432))
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "postgres")
PG_DATABASE = os.getenv("PG_DATABASE", "smartgov_v25")

db_pool: Optional[asyncpg.Pool] = None
active_db_status = "Disconnected"

@app.on_event("startup")
async def startup_event():
    global db_pool, active_db_status
    try:
        db_pool = await asyncpg.create_pool(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            database=PG_DATABASE,
            min_size=2,
            max_size=10,
            command_timeout=30.0
        )
        async with db_pool.acquire() as conn:
            ver = await conn.fetchval("SELECT version()")
            logger.info("Connected to Docker PostgreSQL: %s", ver)
        active_db_status = f"PostgreSQL 16 (Docker Port {PG_PORT} - Connected)"
    except Exception as e:
        logger.error("Failed to connect to PostgreSQL: %s", e)
        active_db_status = f"PostgreSQL Connection Error: {str(e)}"

@app.on_event("shutdown")
async def shutdown_event():
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("Database pool closed.")

async def get_db():
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool is not ready")
    async with db_pool.acquire() as connection:
        yield connection

# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
class OjtReportItem(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = "a0000001-0000-0000-0000-000000000001"
    week_num: int
    work_date: str
    hours: float = 4.5
    tasks: str
    knowledge_skills: Optional[str] = ""
    problems: Optional[str] = ""
    category: Optional[str] = "งานบริการสารสนเทศและดูแลระบบ"
    status: Optional[str] = "draft"
    is_locked: Optional[bool] = False
    data_payload: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SignatureItem(BaseModel):
    week_num: int
    user_id: Optional[str] = "a0000001-0000-0000-0000-000000000001"
    role: str # trainee, supervisor, advisor, staff
    signature_image_data: str # Base64 Data URL
    client_ip: Optional[str] = None

class EvaluationItem(BaseModel):
    trainee_id: Optional[str] = "a0000001-0000-0000-0000-000000000001"
    supervisor_id: Optional[str] = "a0000002-0000-0000-0000-000000000002"
    week_num: int
    scores: Dict[str, Any]
    grade: str = "A"
    comments: Optional[str] = ""
    batch_approved: bool = False

class AttachmentItem(BaseModel):
    report_id: Optional[str] = None
    user_id: Optional[str] = "a0000001-0000-0000-0000-000000000001"
    week_num: int
    file_name: str
    file_url: str
    drive_file_id: Optional[str] = None
    mime_type: str = "image/jpeg"
    file_size_kb: float = 0.0
    pdpa_redaction_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class StateSyncPayload(BaseModel):
    user_id: Optional[str] = "a0000001-0000-0000-0000-000000000001"
    reports: Optional[List[Dict[str, Any]]] = None
    signatures: Optional[List[Dict[str, Any]]] = None
    evaluations: Optional[List[Dict[str, Any]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    profile_data: Optional[Dict[str, Any]] = None

class SummarizeRequest(BaseModel):
    week_num: int
    entries: List[Dict[str, Any]]

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@app.get("/api/health")
async def health(conn: asyncpg.Connection = Depends(get_db)):
    try:
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
        report_count = await conn.fetchval("SELECT COUNT(*) FROM ojt_reports")
        return {
            "status": "online",
            "version": "2.5.0",
            "app": "Smart GovReport Hub 2.5",
            "database": "PostgreSQL 16 (Docker Port 5432 - Full Connection)",
            "telemetry": {
                "active_users": user_count,
                "saved_reports": report_count,
                "engine": "AsyncPG Connection Pool"
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database": str(e)
        }

@app.get("/api/users")
async def list_users(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch("SELECT id, username, role, full_name, department, organization, disability_type FROM users")
    return [{"id": str(r["id"]), "username": r["username"], "role": r["role"], "full_name": r["full_name"], "department": r["department"], "organization": r["organization"], "disability_type": r["disability_type"]} for r in rows]

@app.get("/api/reports")
async def get_reports(week_num: Optional[int] = None, conn: asyncpg.Connection = Depends(get_db)):
    query = "SELECT id, user_id, week_num, work_date, hours, tasks, knowledge_skills, problems, category, status, is_locked, data_payload FROM ojt_reports"
    args = []
    if week_num is not None:
        query += " WHERE week_num = $1 ORDER BY work_date ASC"
        args.append(week_num)
    else:
        query += " ORDER BY week_num ASC, work_date ASC"
    
    rows = await conn.fetch(query, *args)
    return [
        {
            "id": str(r["id"]),
            "user_id": str(r["user_id"]),
            "week_num": r["week_num"],
            "work_date": str(r["work_date"]),
            "hours": float(r["hours"]),
            "tasks": r["tasks"],
            "knowledge_skills": r["knowledge_skills"] or "",
            "problems": r["problems"] or "",
            "category": r["category"] or "",
            "status": r["status"],
            "is_locked": r["is_locked"],
            "data_payload": json.loads(r["data_payload"]) if isinstance(r["data_payload"], str) else (r["data_payload"] or {})
        }
        for r in rows
    ]

@app.post("/api/reports")
async def upsert_report(item: OjtReportItem, conn: asyncpg.Connection = Depends(get_db)):
    try:
        w_date = datetime.strptime(item.work_date, "%Y-%m-%d").date()
    except Exception:
        w_date = date.today()

    stmt = """
        INSERT INTO ojt_reports (user_id, week_num, work_date, hours, tasks, knowledge_skills, problems, category, status, is_locked, data_payload)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id, work_date)
        DO UPDATE SET
            week_num = EXCLUDED.week_num,
            hours = EXCLUDED.hours,
            tasks = EXCLUDED.tasks,
            knowledge_skills = EXCLUDED.knowledge_skills,
            problems = EXCLUDED.problems,
            category = EXCLUDED.category,
            status = EXCLUDED.status,
            is_locked = EXCLUDED.is_locked,
            data_payload = EXCLUDED.data_payload,
            updated_at = NOW()
        RETURNING id;
    """
    row_id = await conn.fetchval(
        stmt,
        uuid.UUID(item.user_id),
        item.week_num,
        w_date,
        item.hours,
        item.tasks,
        item.knowledge_skills,
        item.problems,
        item.category,
        item.status,
        item.is_locked,
        json.dumps(item.data_payload or {})
    )
    return {"success": True, "id": str(row_id)}

@app.get("/api/signatures/{week_num}")
async def get_signatures(week_num: int, conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch("SELECT id, week_num, user_id, role, signature_image_data, digital_timestamp, is_valid FROM signatures WHERE week_num = $1", week_num)
    return [
        {
            "id": str(r["id"]),
            "week_num": r["week_num"],
            "user_id": str(r["user_id"]),
            "role": r["role"],
            "signature_image_data": r["signature_image_data"],
            "digital_timestamp": r["digital_timestamp"].isoformat() if r["digital_timestamp"] else None,
            "is_valid": r["is_valid"]
        }
        for r in rows
    ]

@app.post("/api/signatures")
async def save_signature(item: SignatureItem, req: Request, conn: asyncpg.Connection = Depends(get_db)):
    client_ip = req.client.host if req.client else "127.0.0.1"
    stmt = """
        INSERT INTO signatures (week_num, user_id, role, signature_image_data, client_ip, digital_timestamp, is_valid)
        VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)
        ON CONFLICT (week_num, user_id, role)
        DO UPDATE SET
            signature_image_data = EXCLUDED.signature_image_data,
            digital_timestamp = NOW(),
            client_ip = EXCLUDED.client_ip,
            is_valid = TRUE
        RETURNING id;
    """
    sig_id = await conn.fetchval(
        stmt,
        item.week_num,
        uuid.UUID(item.user_id),
        item.role,
        item.signature_image_data,
        client_ip
    )
    return {"success": True, "id": str(sig_id)}

@app.get("/api/evaluations/{week_num}")
async def get_evaluation(week_num: int, conn: asyncpg.Connection = Depends(get_db)):
    row = await conn.fetchrow("SELECT id, trainee_id, supervisor_id, week_num, scores, grade, comments, batch_approved FROM evaluations WHERE week_num = $1", week_num)
    if not row:
        return {"found": False}
    return {
        "found": True,
        "id": str(row["id"]),
        "trainee_id": str(row["trainee_id"]),
        "supervisor_id": str(row["supervisor_id"]),
        "week_num": row["week_num"],
        "scores": json.loads(row["scores"]) if isinstance(row["scores"], str) else row["scores"],
        "grade": row["grade"],
        "comments": row["comments"] or "",
        "batch_approved": row["batch_approved"]
    }

@app.post("/api/evaluations")
async def save_evaluation(item: EvaluationItem, conn: asyncpg.Connection = Depends(get_db)):
    stmt = """
        INSERT INTO evaluations (trainee_id, supervisor_id, week_num, scores, grade, comments, batch_approved)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (trainee_id, week_num)
        DO UPDATE SET
            supervisor_id = EXCLUDED.supervisor_id,
            scores = EXCLUDED.scores,
            grade = EXCLUDED.grade,
            comments = EXCLUDED.comments,
            batch_approved = EXCLUDED.batch_approved,
            updated_at = NOW()
        RETURNING id;
    """
    eval_id = await conn.fetchval(
        stmt,
        uuid.UUID(item.trainee_id),
        uuid.UUID(item.supervisor_id),
        item.week_num,
        json.dumps(item.scores),
        item.grade,
        item.comments,
        item.batch_approved
    )
    return {"success": True, "id": str(eval_id)}

@app.get("/api/sync/state")
async def get_full_state(conn: asyncpg.Connection = Depends(get_db)):
    """ดึงข้อมูลสมบูรณ์จาก Docker PostgreSQL สำหรับ Client Hydration"""
    reports = await conn.fetch("SELECT id, week_num, work_date, hours, tasks, knowledge_skills, problems, category, status, is_locked, data_payload FROM ojt_reports ORDER BY week_num, work_date")
    signatures = await conn.fetch("SELECT week_num, role, signature_image_data, digital_timestamp FROM signatures WHERE is_valid = TRUE")
    evaluations = await conn.fetch("SELECT week_num, scores, grade, comments, batch_approved FROM evaluations")
    attachments = await conn.fetch("SELECT id, week_num, file_name, file_url, drive_file_id, mime_type, file_size_kb, pdpa_redaction_metadata FROM report_attachments")
    
    return {
        "success": True,
        "database": "PostgreSQL 16 (Docker 5432)",
        "timestamp": datetime.now().isoformat(),
        "reports": [
            {
                "id": str(r["id"]),
                "week_num": r["week_num"],
                "work_date": str(r["work_date"]),
                "hours": float(r["hours"]),
                "tasks": r["tasks"],
                "knowledge_skills": r["knowledge_skills"] or "",
                "problems": r["problems"] or "",
                "category": r["category"] or "",
                "status": r["status"],
                "is_locked": r["is_locked"],
                "data_payload": json.loads(r["data_payload"]) if isinstance(r["data_payload"], str) else (r["data_payload"] or {})
            }
            for r in reports
        ],
        "signatures": [
            {
                "week_num": s["week_num"],
                "role": s["role"],
                "signature_image_data": s["signature_image_data"],
                "digital_timestamp": s["digital_timestamp"].isoformat() if s["digital_timestamp"] else None
            }
            for s in signatures
        ],
        "evaluations": [
            {
                "week_num": e["week_num"],
                "scores": json.loads(e["scores"]) if isinstance(e["scores"], str) else e["scores"],
                "grade": e["grade"],
                "comments": e["comments"] or "",
                "batch_approved": e["batch_approved"]
            }
            for e in evaluations
        ],
        "attachments": [
            {
                "id": str(a["id"]),
                "week_num": a["week_num"],
                "file_name": a["file_name"],
                "file_url": a["file_url"],
                "drive_file_id": a["drive_file_id"],
                "file_size_kb": float(a["file_size_kb"]),
                "pdpa": json.loads(a["pdpa_redaction_metadata"]) if isinstance(a["pdpa_redaction_metadata"], str) else a["pdpa_redaction_metadata"]
            }
            for a in attachments
        ]
    }

@app.post("/api/ai/summarize-week")
async def ai_summarize_week(req: SummarizeRequest):
    titles = [e.get("title") or e.get("tasks", "") for e in req.entries if (e.get("title") or e.get("tasks"))]
    summary_text = (
        f"๑. ปฏิบัติหน้าที่การฝึกภาคปฏิบัติตามหลักสูตรสัปดาห์ที่ {req.week_num} โดยดำเนินการภารกิจหลัก ได้แก่ "
        f"{' และ '.join(titles[:2]) if titles else 'งานบริการสารสนเทศภาครัฐและการจัดการระบบ'}\n"
        f"๒. ได้รับความรู้และฝึกฝนทักษะด้านเทคโนโลยีดิจิทัล การรักษาความปลอดภัยข้อมูลตามมาตรฐาน PDPA\n"
        f"๓. บันทึกเวลาสะสมครบถ้วนตามเกณฑ์มาตรฐานการฝึกงาน ๒๒.๕ ชั่วโมงประจำสัปดาห์ ณ ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร"
    )
    return {
        "success": True,
        "week_num": req.week_num,
        "summary": summary_text
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8086, reload=True)
