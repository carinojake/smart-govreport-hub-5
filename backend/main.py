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

# CORS Whitelist for Smart GovReport Hub 2.5
ALLOWED_ORIGINS = [
    "http://localhost:8085",
    "http://127.0.0.1:8085",
    "http://localhost:8086",
    "http://127.0.0.1:8086",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

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
            await seed_audit_demo_data(conn)
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

# -----------------------------------------------------------------------------
# AUDIT LOGGING & CONSOLE ENDPOINTS (Smart GovReport Hub 2.5)
# -----------------------------------------------------------------------------
async def record_pg_audit(
    action: str,
    target_table: str,
    user_id: Optional[str] = None,
    record_id: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1",
    changed_fields: Optional[Dict[str, Any]] = None
):
    """บันทึกประวัติการทำงานเข้าสู่ PostgreSQL audit_logs + Append-only JSONL"""
    ts = datetime.now().isoformat()
    fields_json = json.dumps(changed_fields or {}, ensure_ascii=False)
    
    # 1. บันทึกลง PostgreSQL
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                uid_val = uuid.UUID(user_id) if user_id and len(user_id) == 36 else None
                await conn.execute(
                    """
                    INSERT INTO audit_logs (user_id, action, target_table, record_id, ip_address, changed_fields, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
                    """,
                    uid_val, action, target_table, str(record_id) if record_id else None, ip_address, fields_json
                )
        except Exception as e:
            logger.error(f"Audit log write to PostgreSQL error: {e}")

    # 2. บันทึก Append-only JSONL File
    try:
        os.makedirs("logs", exist_ok=True)
        audit_entry = {
            "timestamp": ts,
            "action": action,
            "target_table": target_table,
            "user_id": user_id,
            "record_id": record_id,
            "ip_address": ip_address,
            "details": changed_fields or {}
        }
        with open("logs/backend_audit.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(audit_entry, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.error(f"Audit log append file error: {e}")

async def seed_audit_demo_data(conn: asyncpg.Connection):
    try:
        cnt = await conn.fetchval("SELECT COUNT(*) FROM audit_logs")
        if cnt == 0:
            demo_logs = [
                ("a0000001-0000-0000-0000-000000000001", "LOGIN_SUCCESS", "users", "session_auth", "192.168.1.45", {"auth_method": "PIN", "pin_masked": "******", "message": "เข้าสู่ระบบสำเร็จในบทบาท trainee"}),
                ("a0000001-0000-0000-0000-000000000001", "CREATE", "ojt_reports", "w1_entry", "192.168.1.45", {"week_num": 1, "hours": 4.5, "tasks": "วิเคราะห์ชุดข้อมูลสารสนเทศโครงการ ด้วย PivotTable", "category": "งานบริการสารสนเทศและดูแลระบบ"}),
                ("a0000001-0000-0000-0000-000000000001", "MASK_PDPA", "report_attachments", "att_001", "192.168.1.45", {"masked": True, "redacted_fields": ["id_card", "phone"], "rectangles": 2}),
                ("a0000002-0000-0000-0000-000000000002", "SIGN", "signatures", "sig_w1", "192.168.1.12", {"week_num": 1, "role": "supervisor", "status": "APPROVED", "timestamp": datetime.now().isoformat()}),
                ("a0000002-0000-0000-0000-000000000002", "EVALUATE", "evaluations", "eval_w1", "192.168.1.12", {"week_num": 1, "grade": "A", "total_score": 25, "comments": "ผลงานดีเยี่ยม มีวินัยในการปฏิบัติราชการ"}),
                ("a0000001-0000-0000-0000-000000000001", "BOLA_BLOCKED", "ojt_reports", "cross_tenant", "192.168.1.88", {"violation": "BOLA / IDOR Violation Attempt", "target_user": "a0000002", "severity": "ALERT"}),
                (None, "LOGIN_FAILED", "users", "session_auth", "203.0.113.42", {"reason": "PIN ไม่ถูกต้อง 3 ครั้ง", "severity": "WARN"}),
                ("a0000001-0000-0000-0000-000000000001", "EXPORT_PDF", "ojt_reports", "a4_report", "192.168.1.45", {"week_num": 1, "format": "A4_PDF", "status": "SUCCESS"}),
                ("a0000001-0000-0000-0000-000000000001", "PDPA_CONSENT", "users", "consent_v25", "192.168.1.45", {"policy_version": "2.5-2569", "consent_status": True})
            ]
            for uid, act, tbl, rid, ip, fields in demo_logs:
                uid_val = uuid.UUID(uid) if uid else None
                await conn.execute(
                    """
                    INSERT INTO audit_logs (user_id, action, target_table, record_id, ip_address, changed_fields, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
                    """,
                    uid_val, act, tbl, rid, ip, json.dumps(fields, ensure_ascii=False)
                )
            logger.info("Seeded initial demo audit logs into PostgreSQL")
    except Exception as e:
        logger.error(f"Failed to seed demo audit logs: {e}")

@app.get("/api/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action: Optional[str] = None,
    search: Optional[str] = None,
    conn: asyncpg.Connection = Depends(get_db)
):
    query = """
        SELECT a.id, a.user_id, u.username, u.full_name, u.role as user_role,
               a.action, a.target_table, a.record_id, a.ip_address, a.changed_fields, a.created_at
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
    """
    params = []
    if action and action.upper() != "ALL":
        params.append(action.upper())
        query += f" AND a.action = ${len(params)}"
    if search:
        params.append(f"%{search.strip()}%")
        p_idx = len(params)
        query += f" AND (a.action ILIKE ${p_idx} OR a.target_table ILIKE ${p_idx} OR u.username ILIKE ${p_idx} OR u.full_name ILIKE ${p_idx} OR a.record_id ILIKE ${p_idx})"

    query += " ORDER BY a.created_at DESC"
    params.append(limit)
    query += f" LIMIT ${len(params)}"
    params.append(offset)
    query += f" OFFSET ${len(params)}"

    rows = await conn.fetch(query, *params)
    results = []
    for r in rows:
        action_name = r["action"]
        cat = "AUTH" if "LOGIN" in action_name or "AUTH" in action_name else ("DATA_MUTATION" if action_name in ["CREATE", "UPDATE", "DELETE", "INSERT"] else ("SIGNATURE" if "SIGN" in action_name else ("SECURITY" if "BOLA" in action_name or "ALERT" in action_name else ("COMPLIANCE" if "PDPA" in action_name else "EXPORT"))))
        sev = "ALERT" if "BLOCKED" in action_name or "ALERT" in action_name else ("WARN" if "FAILED" in action_name or "DELETE" in action_name else ("SUCCESS" if "SIGN" in action_name or "APPROVE" in action_name or "SUCCESS" in action_name else "INFO"))
        
        results.append({
            "id": r["id"],
            "timestamp": r["created_at"].isoformat() if r["created_at"] else "",
            "user_id": str(r["user_id"]) if r["user_id"] else None,
            "username": r["username"] or "ระบบอัตโนมัติ",
            "full_name": r["full_name"] or "ระบบส่วนกลาง",
            "user_role": r["user_role"] or "system",
            "action": action_name,
            "event_name": action_name,
            "event_category": cat,
            "severity": sev,
            "target_resource": f"{r['target_table']}:{r['record_id'] or ''}",
            "ip_address": r["ip_address"] or "127.0.0.1",
            "details": json.loads(r["changed_fields"]) if isinstance(r["changed_fields"], str) else (r["changed_fields"] or {})
        })

    return {
        "status": "success",
        "count": len(results),
        "data": results
    }

@app.get("/api/audit-logs/stats")
async def get_audit_stats(conn: asyncpg.Connection = Depends(get_db)):
    total = await conn.fetchval("SELECT COUNT(*) FROM audit_logs")
    alerts = await conn.fetchval("SELECT COUNT(*) FROM audit_logs WHERE action ILIKE '%BLOCKED%' OR action ILIKE '%ALERT%' OR action ILIKE '%WARN%'")
    mutations = await conn.fetchval("SELECT COUNT(*) FROM audit_logs WHERE action IN ('CREATE', 'UPDATE', 'DELETE', 'INSERT', 'SAVE')")
    auth_cnt = await conn.fetchval("SELECT COUNT(*) FROM audit_logs WHERE action ILIKE '%AUTH%' OR action ILIKE '%LOGIN%'")
    users_cnt = await conn.fetchval("SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE user_id IS NOT NULL")
    
    return {
        "status": "success",
        "data": {
            "total_logs": total or 0,
            "security_alerts": alerts or 0,
            "data_mutations": mutations or 0,
            "auth_events": auth_cnt or 0,
            "unique_users": users_cnt or 0
        }
    }

@app.get("/api/audit-logs/export")
async def export_audit_logs(
    format: str = "json",
    action: Optional[str] = None,
    conn: asyncpg.Connection = Depends(get_db)
):
    from fastapi.responses import Response
    import csv
    import io

    query = """
        SELECT a.id, a.created_at, a.user_id, u.username, u.full_name, u.role,
               a.action, a.target_table, a.record_id, a.ip_address, a.changed_fields
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC LIMIT 1000
    """
    rows = await conn.fetch(query)
    
    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "User ID", "Username", "Full Name", "Role", "Action", "Target Table", "Record ID", "IP Address", "Details"])
        for r in rows:
            writer.writerow([
                r["id"],
                r["created_at"].isoformat() if r["created_at"] else "",
                str(r["user_id"]) if r["user_id"] else "",
                r["username"] or "",
                r["full_name"] or "",
                r["role"] or "",
                r["action"],
                r["target_table"],
                r["record_id"] or "",
                r["ip_address"] or "",
                json.dumps(r["changed_fields"], ensure_ascii=False) if r["changed_fields"] else "{}"
            ])
        output.seek(0)
        filename = f"smartgov_audit_pg_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        items = [
            {
                "id": r["id"],
                "timestamp": r["created_at"].isoformat() if r["created_at"] else "",
                "user_id": str(r["user_id"]) if r["user_id"] else None,
                "username": r["username"],
                "full_name": r["full_name"],
                "action": r["action"],
                "target_table": r["target_table"],
                "record_id": r["record_id"],
                "ip_address": r["ip_address"],
                "details": r["changed_fields"]
            }
            for r in rows
        ]
        filename = f"smartgov_audit_pg_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        return Response(
            content=json.dumps(items, ensure_ascii=False, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8086, reload=True)
