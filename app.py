import os
import json
import base64
import hashlib
import hmac
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

import csv
import io
from fastapi import FastAPI, Request, HTTPException, Depends, Header, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from ojt_system.database import OJTDatabase
from ojt_system.models import OJTActivityRecord, OfficialMemoRecord, SupervisorFeedbackRecord
from ojt_system.pdpa_sanitizer import PDPASanitizer
from ojt_system.ai_client import OJTAIClient

# Logging Configuration
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/app.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("smartgov_hub")

app = FastAPI(
    title="Smart GovReport Hub - OJT 90 Hours & Official Memo System",
    description="ระบบบริหารจัดการและจัดทำรายงานราชการอัจฉริยะ (OJT 90 ชม.) สอดคล้องตามมาตรฐานงานสารบรรณ และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)",
    version="3.0.0"
)

# Configuration & Initialization
DB_PATH = os.getenv("SMARTGOV_DB_PATH", "ojt_logbook.db")
AUDIT_LOG_PATH = os.getenv("SMARTGOV_AUDIT_LOG_PATH", "logs/pdpa_audit.jsonl")
SECRET_KEY = os.getenv("SMARTGOV_SECRET_KEY", "smartgov_ojt_secret_key_2026_m1")

db = OJTDatabase(DB_PATH, AUDIT_LOG_PATH)

try:
    ai_client = OJTAIClient()
except Exception as e:
    logger.warning(f"OJTAIClient init warning (will use fallback): {e}")
    ai_client = None

os.makedirs("templates", exist_ok=True)
os.makedirs("static", exist_ok=True)
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Helper Functions for Authentication Tokens (HMAC-SHA256)
def create_token(user_id: str, role: str) -> str:
    payload = json.dumps({"uid": user_id, "role": role, "ts": datetime.now().isoformat()})
    b64_payload = base64.urlsafe_b64encode(payload.encode()).decode()
    signature = hmac.new(SECRET_KEY.encode(), b64_payload.encode(), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{signature}"

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        b64_payload, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), b64_payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            logger.warning("Token verification failed: HMAC signature mismatch")
            return None
        payload_str = base64.urlsafe_b64decode(b64_payload.encode()).decode()
        payload = json.loads(payload_str)
        # Check token expiration (valid 24 hours = 86,400s)
        if "ts" in payload:
            token_time = datetime.fromisoformat(payload["ts"])
            if (datetime.now() - token_time).total_seconds() > 86400:
                logger.info(f"Token expired for uid: {payload.get('uid')}")
                return None
        return payload
    except Exception as e:
        logger.error(f"Error parsing auth token: {e}")
        return None

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """ดึงข้อมูลผู้ใช้งานที่ผ่านการยืนยันตัวตนด้วย Bearer Token"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        data = verify_token(token)
        if data and "uid" in data:
            user = db.get_user_by_id(data["uid"])
            if user:
                return user

    raise HTTPException(status_code=401, detail="กรุณาเข้าสู่ระบบด้วย Bearer Token ที่ถูกต้อง")

def record_audit(
    request: Optional[Request] = None,
    event_category: str = "SYSTEM",
    event_name: str = "OPERATION",
    severity: str = "INFO",
    target_resource: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    user: Optional[Dict[str, Any]] = None
):
    """บันทึกประวัติการทำงานเข้าสู่ระบบคู่ขนาน (Dual Engine: DB + JSONL)"""
    ip = "127.0.0.1"
    ua = "Internal/Direct"
    if request:
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0].strip() if forwarded else client_ip
        ua = request.headers.get("user-agent", "Unknown")

    user_id = user.get("user_id") if user else None
    username = user.get("username") or user.get("nickname") if user else None
    user_role = user.get("role") if user else None

    db.log_audit_event(
        event_category=event_category,
        event_name=event_name,
        severity=severity,
        user_id=user_id,
        username=username,
        user_role=user_role,
        target_resource=target_resource,
        ip_address=ip,
        user_agent=ua,
        details=details
    )

def get_supervisor_or_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """สิทธิ์สำหรับผู้ควบคุมงานและแอดมินเท่านั้น (Supervisor & Admin RBAC)"""
    if current_user.get("role") not in ["supervisor", "admin", "advisor", "staff"]:
        raise HTTPException(
            status_code=403,
            detail="สงวนสิทธิ์การเข้าถึงข้อมูล Audit Log Console สำหรับผู้ควบคุมงานและผู้ดูแลระบบเท่านั้น (Admin & Supervisor Only)"
        )
    return current_user

def get_target_trainee_id(
    request: Request,
    trainee_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> str:
    """
    ตรวจสิทธิ์การเข้าถึงข้อมูลระดับวัตถุ (BOLA / IDOR Prevention):
    - ผู้ฝึกงาน (Trainee) เข้าถึงได้เฉพาะ ID ของตนเองเท่านั้น
    - ผู้ควบคุมงาน (Supervisor) หรือแอดมิน (Admin) สามารถระบุ trainee_id ของผู้ฝึกงานได้
    """
    target = trainee_id or current_user["user_id"]
    if current_user["role"] == "trainee" and target != current_user["user_id"]:
        logger.warning(f"BOLA attempt blocked: user {current_user['user_id']} tried to access trainee {target}")
        record_audit(
            request=request,
            event_category="SECURITY",
            event_name="BOLA_BLOCKED",
            severity="ALERT",
            target_resource=f"trainee_{target}",
            details={
                "violation": "BOLA / IDOR Attempt Blocked",
                "attempted_target": target,
                "reason": "ผู้ฝึกงานพยายามเข้าถึงหรือแก้ไขข้อมูลของผู้ฝึกงานท่านอื่นข้ามสิทธิ์"
            },
            user=current_user
        )
        raise HTTPException(status_code=403, detail="ท่านไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของผู้ฝึกงานท่านอื่น")
    return target

# Pydantic Request Schemas
class PinLoginRequest(BaseModel):
    pin: str

class ActivityCreateRequest(BaseModel):
    activity_date: str
    day_name: str
    week_number: int = 1
    activity_title: str
    hours: float = 6.0
    competency_code: str = "DIG-01"
    sop_procedure: str
    tools_used: str
    problems_and_solutions: str = "ไม่พบปัญหาอุปสรรค การปฏิบัติงานดำเนินไปด้วยความเรียบร้อย"
    raw_input: Optional[str] = ""

class ActivityUpdateRequest(BaseModel):
    activity_date: str
    day_name: str
    activity_title: str
    hours: float
    competency_code: str
    sop_procedure: str
    tools_used: str
    problems_and_solutions: str

class AiPolishRequest(BaseModel):
    raw_text: str
    mode: str = "formal" # brief or formal

class SignatureRequest(BaseModel):
    week_number: int = 1
    trainee_id: str
    signature_image: str # Base64
    pin: str
    role: str = "supervisor"

class EvaluationRequest(BaseModel):
    trainee_id: str
    week_number: int = 1
    supervisor_comment: str
    suggested_score: int
    development_advice: str

class PDPAConsentRequest(BaseModel):
    policy_version: str = "v1.2-2026"
    consent_status: bool = True
    agreed_purposes: List[str] = ["daily_log", "photos"]
    signature_hash: str = ""

# --- Routes ---

@app.get("/", response_class=HTMLResponse)
@app.get("/v3", response_class=HTMLResponse)
async def serve_dashboard_v3():
    """หน้าจอหลัก Smart GovReport Hub V3 (Modular Front + IndexedDB + Drive Attachment)"""
    if os.path.exists("templates/index_v3.html"):
        return FileResponse("templates/index_v3.html")
    return FileResponse("templates/index.html")

@app.get("/v2", response_class=HTMLResponse)
async def serve_dashboard_v2():
    """หน้าจอ Smart GovReport Hub V2 (Current Production Monolith)"""
    if os.path.exists("templates/index_v2.html"):
        return FileResponse("templates/index_v2.html")
    return FileResponse("templates/index.html")

@app.get("/v1", response_class=HTMLResponse)
async def serve_dashboard_v1():
    """หน้าจอ Smart GovReport Hub V1 (Legacy Monolith Reference)"""
    if os.path.exists("templates/index_v1.html"):
        return FileResponse("templates/index_v1.html")
    return FileResponse("reference_template.html")

# 1. Auth & Profiles
@app.get("/api/v1/auth/users")
def get_users_list():
    users = db.list_all_users()
    return {"status": "success", "users": users}


class RegisterUserRequest(BaseModel):
    full_name: str
    pin_code: str
    role: str = "trainee" # trainee or supervisor
    department: str = "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร"
    position_title: Optional[str] = "ผู้ฝึกปฏิบัติงาน"

@app.post("/api/v1/auth/register")
def register_new_user(req: RegisterUserRequest):
    if not req.full_name.strip() or len(req.pin_code.strip()) < 4:
        raise HTTPException(status_code=400, detail="กรุณากรอกชื่อ-นามสกุล และตั้งรหัส PIN อย่างน้อย 4-6 หลัก")

    # Check if PIN already used
    existing = db.get_user_by_pin(req.pin_code.strip())
    if existing:
        raise HTTPException(status_code=400, detail=f"รหัส PIN {req.pin_code} มีผู้อื่นใช้งานแล้ว กรุณาเลือกรหัส PIN อื่น")

    user = db.create_user(
        full_name=req.full_name,
        pin_code=req.pin_code.strip(),
        role=req.role,
        department=req.department,
        position_title=req.position_title or ("ผู้ฝึกปฏิบัติงาน" if req.role == "trainee" else "ผู้ควบคุมงาน")
    )

    token = create_token(user["user_id"], user["role"])
    return {
        "status": "success",
        "message": f"ลงทะเบียนผู้ใช้งานใหม่สำเร็จ: {user['full_name']} (PIN: {user['pin_code']})",
        "user": user,
        "token": token
    }


@app.post("/api/v1/auth/pin-login")
def login_by_pin(req: PinLoginRequest, request: Request):
    user = db.get_user_by_pin(req.pin)
    if not user:
        record_audit(
            request=request,
            event_category="AUTH",
            event_name="LOGIN_FAILED",
            severity="WARN",
            target_resource="session_auth",
            details={"auth_method": "PIN", "pin_attempt": "******", "reason": "รหัส PIN ไม่ถูกต้อง"}
        )
        raise HTTPException(status_code=401, detail="รหัส PIN ไม่ถูกต้อง")
    token = create_token(user["user_id"], user["role"])
    record_audit(
        request=request,
        event_category="AUTH",
        event_name="LOGIN_SUCCESS",
        severity="SUCCESS",
        target_resource="session_auth",
        details={"auth_method": "PIN", "pin_masked": "******", "message": f"เข้าสู่ระบบสำเร็จในบทบาท {user['role']}"},
        user=user
    )
    return {
        "status": "success",
        "token": token,
        "user": user
    }

@app.get("/api/v1/auth/me")
def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"status": "success", "user": current_user}

@app.get("/api/v1/supervisors/trainees")
def get_assigned_trainees(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] not in ["supervisor", "admin"]:
        trainees = [current_user]
    else:
        trainees = db.list_trainees_for_supervisor(current_user["user_id"])
        if not trainees and current_user["role"] == "admin":
            all_u = db.list_all_users()
            trainees = [u for u in all_u if u["role"] == "trainee"]
    return {"status": "success", "trainees": trainees}

# 2. OJT Activities (Isolated by Trainee)
@app.get("/api/v1/activities")
def get_activities(target_id: str = Depends(get_target_trainee_id)):
    activities = db.get_all_activities(target_id)
    progress = db.get_progress_summary(target_id)
    return {
        "status": "success",
        "trainee_id": target_id,
        "progress": progress,
        "activities": activities
    }


class QuickLogEntryRequest(BaseModel):
    raw_input: str
    hours: float = 6.0
    week_number: int = 1
    activity_date: Optional[str] = None
    day_name: Optional[str] = None

@app.post("/api/v1/activities/quick-log")
def quick_log_activity(req: QuickLogEntryRequest, request: Request, target_id: str = Depends(get_target_trainee_id), current_user: Dict[str, Any] = Depends(get_current_user)):
    if not req.raw_input.strip():
        raise HTTPException(status_code=400, detail="กรุณากรอกข้อความกิจกรรมที่ปฏิบัติ")

    # กำหนดวันที่อัตโนมัติ (ภาษาไทย)
    thai_months = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
    thai_days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]
    now = datetime.now()
    d_name = req.day_name or thai_days[now.weekday()]
    d_date = req.activity_date or f"{now.day} {thai_months[now.month]} {now.year + 543}"

    # เรียกใช้ AI Client สกัดเป็น SOP และข้อมูลราชการอัตโนมัติ
    record = None
    if ai_client:
        try:
            rec, findings = ai_client.generate_activity_log(req.raw_input, default_hours=req.hours)
            record = rec
        except Exception as e:
            logger.warning(f"Quick Log AI generation fallback: {e}")

    if not record:
        sanitized_sop, sop_findings = PDPASanitizer.sanitize(req.raw_input)
        record = OJTActivityRecord(
            activity_title=f"ปฏิบัติงาน{sanitized_sop[:80]} และพัฒนานวัตกรรมระบบสารสนเทศ",
            hours=req.hours,
            competency_code="DIG-01",
            sop_procedure=f"1. รับมอบหมายภารกิจและเตรียมความพร้อม\n2. ดำเนินการ {sanitized_sop}\n3. ตรวจสอบความถูกต้องและบันทึกรายงานผลการปฏิบัติงาน",
            tools_used="ระบบคอมพิวเตอร์, ซอฟต์แวร์ประยุกต์ภาครัฐ",
            problems_and_solutions="ไม่พบปัญหาอุปสรรค การปฏิบัติงานดำเนินไปด้วยความเรียบร้อย",
            pdpa_redaction_notes="ผ่านการตรวจความปลอดภัย PDPA (Double-Shield)"
        )

    act_id = db.insert_activity_for_trainee(
        trainee_id=target_id,
        activity=record,
        activity_date=d_date,
        day_name=d_name,
        week_number=req.week_number,
        raw_input=req.raw_input
    )

    record_audit(
        request=request,
        event_category="DATA_MUTATION",
        event_name="ACTIVITY_QUICK_LOG",
        severity="INFO",
        target_resource=f"act_{act_id}",
        details={"title": record.activity_title[:80], "hours": req.hours, "target_trainee": target_id, "week": req.week_number},
        user=current_user
    )

    activities = db.get_all_activities(target_id)
    progress = db.get_progress_summary(target_id)
    return {
        "status": "success",
        "activity_id": act_id,
        "record": record.model_dump() if hasattr(record, "model_dump") else record.dict(),
        "activity_date": d_date,
        "day_name": d_name,
        "progress": progress,
        "activities": activities
    }


@app.post("/api/v1/activities")
def create_activity(req: ActivityCreateRequest, request: Request, target_id: str = Depends(get_target_trainee_id), current_user: Dict[str, Any] = Depends(get_current_user)):
    # Double Shield PDPA Masking
    sanitized_sop, sop_findings = PDPASanitizer.sanitize(req.sop_procedure)
    sanitized_prob, prob_findings = PDPASanitizer.sanitize(req.problems_and_solutions)
    all_findings = sop_findings + prob_findings
    redaction_notes = f"ตรวจพบและเซ็นเซอร์: {', '.join(all_findings)}" if all_findings else "ผ่านการตรวจความปลอดภัย PDPA (ไม่พบข้อมูลอ่อนไหว)"

    record = OJTActivityRecord(
        activity_title=req.activity_title,
        hours=req.hours,
        competency_code=req.competency_code,
        sop_procedure=sanitized_sop,
        tools_used=req.tools_used,
        problems_and_solutions=sanitized_prob,
        pdpa_redaction_notes=redaction_notes
    )

    act_id = db.insert_activity_for_trainee(
        trainee_id=target_id,
        activity=record,
        activity_date=req.activity_date,
        day_name=req.day_name,
        week_number=req.week_number,
        raw_input=req.raw_input or ""
    )

    record_audit(
        request=request,
        event_category="DATA_MUTATION",
        event_name="ACTIVITY_CREATE",
        severity="INFO",
        target_resource=f"act_{act_id}",
        details={"title": req.activity_title, "hours": req.hours, "target_trainee": target_id, "week": req.week_number},
        user=current_user
    )

    return {"status": "success", "activity_id": act_id, "progress": db.get_progress_summary(target_id)}

@app.put("/api/v1/activities/{act_id}")
def update_activity_endpoint(act_id: int, req: ActivityUpdateRequest, request: Request, target_id: str = Depends(get_target_trainee_id), current_user: Dict[str, Any] = Depends(get_current_user)):
    sanitized_sop, _ = PDPASanitizer.sanitize(req.sop_procedure)
    sanitized_prob, _ = PDPASanitizer.sanitize(req.problems_and_solutions)

    success = db.update_activity(
        activity_id=act_id,
        trainee_id=target_id,
        activity_date=req.activity_date,
        day_name=req.day_name,
        activity_title=req.activity_title,
        hours=req.hours,
        competency_code=req.competency_code,
        sop_procedure=sanitized_sop,
        tools_used=req.tools_used,
        problems_and_solutions=sanitized_prob
    )
    if success:
        record_audit(
            request=request,
            event_category="DATA_MUTATION",
            event_name="ACTIVITY_UPDATE",
            severity="INFO",
            target_resource=f"act_{act_id}",
            details={"title": req.activity_title, "hours": req.hours, "target_trainee": target_id},
            user=current_user
        )
    return {"status": "success" if success else "error"}

@app.delete("/api/v1/activities/{act_id}")
def delete_activity_endpoint(act_id: int, request: Request, target_id: str = Depends(get_target_trainee_id), current_user: Dict[str, Any] = Depends(get_current_user)):
    success = db.delete_activity(act_id, target_id)
    if success:
        record_audit(
            request=request,
            event_category="DATA_MUTATION",
            event_name="ACTIVITY_DELETE",
            severity="WARN",
            target_resource=f"act_{act_id}",
            details={"deleted_act_id": act_id, "target_trainee": target_id},
            user=current_user
        )
    return {"status": "success" if success else "error", "progress": db.get_progress_summary(target_id)}

# 3. AI Polish & OCR
@app.post("/api/v1/ai/polish")
def ai_polish_endpoint(
    req: AiPolishRequest,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    if not req.raw_text:
        raise HTTPException(status_code=400, detail="กรุณากรอกข้อความ")

    current_user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        data = verify_token(token)
        if data and "uid" in data:
            current_user = db.get_user_by_id(data["uid"])

    record_audit(
        request=request,
        event_category="DATA_MUTATION",
        event_name="AI_POLISH_REQUEST",
        severity="INFO",
        target_resource="ai_polisher",
        details={"mode": req.mode, "char_count": len(req.raw_text)},
        user=current_user
    )

    if ai_client:
        try:
            polished = ai_client.polish_text(req.raw_text, req.mode)
            return {"status": "success", "result": polished, "mode": req.mode, "engine": ai_client.model_name}
        except Exception as e:
            logger.error(f"AI Polish error: {e}")

    # Rule-based fallback
    clean_text, _ = PDPASanitizer.sanitize(req.raw_text)
    if req.mode == "brief":
        res = f"ปฏิบัติงาน{clean_text[:90]} ตามมาตรฐานกำหนดตำแหน่งและระเบียบปฏิบัติราชการ"
    else:
        res = f"๑. วัตถุประสงค์: ดำเนินการตามภารกิจ{clean_text}\n๒. ขั้นตอนการปฏิบัติงาน: ปฏิบัติงานตามมาตรฐาน SOP โดยใช้เครื่องมือและระบบสารสนเทศภาครัฐ\n๓. ผลการดำเนินงาน: งานสำเร็จลุล่วงด้วยความเรียบร้อย ถูกต้องตามระเบียบงานสารบรรณ"
    return {"status": "success", "result": res, "mode": req.mode, "engine": "rule-based-fallback"}

# 4. Official Memo & Evaluations
@app.get("/api/v1/memos/{week_number}")
def get_memo(week_number: int, target_id: str = Depends(get_target_trainee_id)):
    memo = db.get_memo_by_week(target_id, week_number)
    return {"status": "success", "memo": memo}

@app.post("/api/v1/memos/{week_number}")
def save_memo(week_number: int, memo_data: Dict[str, Any], request: Request, target_id: str = Depends(get_target_trainee_id), current_user: Dict[str, Any] = Depends(get_current_user)):
    rec = OfficialMemoRecord(
        department=memo_data.get("department", "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร"),
        doc_number=memo_data.get("doc_number", "ยธ ๐๒๐๔/ว-พิเศษ"),
        date_str=memo_data.get("memo_date", "๔ กันยายน ๒๕๖๙"),
        subject=memo_data.get("subject", "ขออนุมัติและรายงานผล OJT"),
        origin_section=memo_data.get("origin_section", ""),
        facts_section=memo_data.get("facts_section", ""),
        consideration_section=memo_data.get("consideration_section", ""),
        signatory_title=memo_data.get("signatory_title", current_user["full_name"])
    )
    memo_id = db.upsert_memo(target_id, week_number, rec)
    record_audit(
        request=request,
        event_category="DATA_MUTATION",
        event_name="MEMO_UPSERT",
        severity="INFO",
        target_resource=f"memo_w{week_number}_{target_id}",
        details={"subject": rec.subject, "week": week_number, "target_trainee": target_id},
        user=current_user
    )
    return {"status": "success", "memo_id": memo_id}

@app.get("/api/v1/evaluations/{week_number}")
def get_evaluation(week_number: int, target_id: str = Depends(get_target_trainee_id)):
    eval_rec = db.get_evaluation_by_week(target_id, week_number)
    return {"status": "success", "evaluation": eval_rec}

@app.post("/api/v1/evaluations/{week_number}")
def save_evaluation_endpoint(week_number: int, req: EvaluationRequest, request: Request, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] not in ["supervisor", "admin"]:
        raise HTTPException(status_code=403, detail="เฉพาะผู้ควบคุมงาน (Supervisor) หรือ Admin เท่านั้นที่สามารถประเมินผลได้")

    rec = SupervisorFeedbackRecord(
        supervisor_comment=req.supervisor_comment,
        suggested_score=req.suggested_score,
        development_advice=req.development_advice
    )
    eval_id = db.save_evaluation(
        trainee_id=req.trainee_id,
        week_number=week_number,
        supervisor_id=current_user["user_id"],
        supervisor_name=current_user["full_name"],
        eval_rec=rec
    )
    record_audit(
        request=request,
        event_category="DATA_MUTATION",
        event_name="SUPERVISOR_EVALUATION",
        severity="SUCCESS",
        target_resource=f"eval_w{week_number}_{req.trainee_id}",
        details={"score": req.suggested_score, "week": week_number, "trainee_id": req.trainee_id},
        user=current_user
    )
    return {"status": "success", "evaluation_id": eval_id}

# 5. Digital Signatures & Canvas
@app.post("/api/v1/signatures")
def record_signature(req: SignatureRequest, request: Request, current_user: Dict[str, Any] = Depends(get_current_user)):
    # Verify PIN
    signer = db.get_user_by_pin(req.pin)
    if not signer or signer["user_id"] != current_user["user_id"]:
        record_audit(
            request=request,
            event_category="SECURITY",
            event_name="SIGNATURE_PIN_MISMATCH",
            severity="ALERT",
            target_resource=f"signature_w{req.week_number}_{req.trainee_id}",
            details={"reason": "PIN สำหรับลงนามไม่ถูกต้องหรือไม่ตรงกับผู้ใช้งานปัจจุบัน", "target_trainee": req.trainee_id},
            user=current_user
        )
        raise HTTPException(status_code=401, detail="รหัส PIN สำหรับลงนามไม่ถูกต้องหรือไม่ตรงกับผู้ใช้งานปัจจุบัน")

    sig_id = db.save_signature(
        trainee_id=req.trainee_id,
        week_number=req.week_number,
        signer_id=signer["user_id"],
        signer_name=signer["full_name"],
        role=signer["role"],
        image_base64=req.signature_image,
        pin=req.pin
    )
    record_audit(
        request=request,
        event_category="SIGNATURE",
        event_name="DUAL_SIGNATURE_STAMP",
        severity="SUCCESS",
        target_resource=f"signature_w{req.week_number}_{req.trainee_id}",
        details={"week": req.week_number, "role": signer["role"], "trainee_id": req.trainee_id},
        user=current_user
    )
    return {"status": "success", "signature_id": sig_id, "signer_name": signer["full_name"]}

@app.get("/api/v1/signatures/{week_number}")
def get_signatures(week_number: int, target_id: str = Depends(get_target_trainee_id)):
    signatures = db.get_signatures_by_week(target_id, week_number)
    return {"status": "success", "signatures": signatures}

# 6. PDPA Consent & Audit Logging
@app.post("/api/v1/pdpa/consent")
def submit_pdpa_consent(req: PDPAConsentRequest, request: Request, current_user: Dict[str, Any] = Depends(get_current_user)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "unknown")
    sig_hash = req.signature_hash or hashlib.sha256(f"{current_user['user_id']}_{datetime.now()}".encode()).hexdigest()

    cid = db.record_pdpa_consent(
        user_id=current_user["user_id"],
        policy_version=req.policy_version,
        consent_status=req.consent_status,
        agreed_purposes=req.agreed_purposes,
        signature_hash=sig_hash,
        ip=client_ip,
        user_agent=user_agent
    )
    record_audit(
        request=request,
        event_category="COMPLIANCE",
        event_name="PDPA_CONSENT_RECORDED",
        severity="SUCCESS",
        target_resource=f"pdpa_consent_{cid}",
        details={"policy_version": req.policy_version, "purposes_count": len(req.agreed_purposes), "consent_status": req.consent_status},
        user=current_user
    )
    return {"status": "success", "consent_id": cid, "hash": sig_hash}

# 7. Project Canvas & Portfolio
@app.get("/api/v1/project-canvas")
def get_canvas_data(target_id: str = Depends(get_target_trainee_id)):
    canvas = db.get_project_canvas(target_id)
    return {"status": "success", "canvas": canvas}

@app.get("/api/v1/portfolio")
def get_portfolio_data(target_id: str = Depends(get_target_trainee_id)):
    portfolio = db.get_portfolio(target_id)
    return {"status": "success", "portfolio": portfolio}

# 8. Sync Hub & Full Export
@app.get("/api/v1/export/sync-payload")
def get_export_payload(request: Request, target_id: str = Depends(get_target_trainee_id), current_user: Dict[str, Any] = Depends(get_current_user)):
    payload = db.export_all_data_for_sync(target_id)
    record_audit(
        request=request,
        event_category="EXPORT",
        event_name="JSON_BACKUP_DOWNLOAD",
        severity="INFO",
        target_resource=f"sync_payload_{target_id}",
        details={"exported_trainee_id": target_id, "activities_count": payload.get("activities_count", 0)},
        user=current_user
    )
    return payload

# 9. Audit Log Console Endpoints (Smart GovReport Hub 2.5)
@app.get("/api/v1/audit-logs")
def api_get_audit_logs(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: Dict[str, Any] = Depends(get_supervisor_or_admin)
):
    """สืบค้นและดึงรายการ Audit Log สำหรับหน้า Console (Supervisor & Admin Only)"""
    logs = db.get_audit_logs(
        limit=limit,
        offset=offset,
        category=category,
        severity=severity,
        user_id=user_id,
        search=search
    )
    return {
        "status": "success",
        "count": len(logs),
        "limit": limit,
        "offset": offset,
        "data": logs
    }

@app.get("/api/v1/audit-logs/stats")
def api_get_audit_stats(current_user: Dict[str, Any] = Depends(get_supervisor_or_admin)):
    """ดึงข้อมูลสถิติภาพรวมสำหรับ KPI Summary Cards ใน Audit Log Console"""
    stats = db.get_audit_stats()
    return {
        "status": "success",
        "data": stats
    }

@app.get("/api/v1/audit-logs/export")
def api_export_audit_logs(
    format: str = "json",
    category: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    request: Request = None,
    current_user: Dict[str, Any] = Depends(get_supervisor_or_admin)
):
    """ส่งออกบันทึกการตรวจสอบระบบ (Audit Trail) เป็นไฟล์ CSV หรือ JSON"""
    logs = db.get_audit_logs(limit=1000, offset=0, category=category, severity=severity, search=search)
    
    record_audit(
        request=request,
        event_category="EXPORT",
        event_name="AUDIT_LOG_EXPORT",
        severity="INFO",
        target_resource="audit_log_console",
        details={"format": format, "exported_count": len(logs)},
        user=current_user
    )

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "User ID", "Username", "Role", "Category", "Event Name", "Severity", "Target Resource", "IP Address", "User Agent", "Details"])
        for l in logs:
            writer.writerow([
                l.get("id"),
                l.get("timestamp"),
                l.get("user_id"),
                l.get("username"),
                l.get("user_role"),
                l.get("event_category"),
                l.get("event_name"),
                l.get("severity"),
                l.get("target_resource"),
                l.get("ip_address"),
                l.get("user_agent"),
                json.dumps(l.get("details", {}), ensure_ascii=False)
            ])
        output.seek(0)
        filename = f"smartgov_audit_trail_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        filename = f"smartgov_audit_trail_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        return Response(
            content=json.dumps(logs, ensure_ascii=False, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
