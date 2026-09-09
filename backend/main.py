import os
import hashlib
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

app = FastAPI(title="Smart GovReport Hub 2.5 API", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
SQLITE_PATH = os.path.join(BASE_DIR, "smartgov_v25.db")

# Smart Dual-Driver Fallback: Try PostgreSQL Docker (5432) first, then SQLite
PG_URL = os.getenv("PG_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/smartgov_v25")
SQLITE_URL = f"sqlite+aiosqlite:///{SQLITE_PATH}"

current_engine = None
active_db_name = "SQLite (Local Fallback)"

@app.on_event("startup")
async def startup_db():
    global current_engine, active_db_name
    try:
        test_engine = create_async_engine(PG_URL, echo=False)
        async with test_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        current_engine = test_engine
        active_db_name = "PostgreSQL (Docker Port 5432)"
        print("✅ [DB] Connected to PostgreSQL Docker successfully!")
    except Exception as e:
        print(f"⚠️ [DB] PostgreSQL not reachable ({e}). Falling back to SQLite...")
        current_engine = create_async_engine(SQLITE_URL, echo=False, connect_args={"check_same_thread": False})
        active_db_name = "SQLite (Local File)"

@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "version": "2.5.0",
        "app": "Smart GovReport Hub 2.5",
        "database": active_db_name
    }

class SummarizeRequest(BaseModel):
    week_num: int
    entries: List[Dict[str, Any]]

@app.post("/api/ai/summarize-week")
async def ai_summarize_week(req: SummarizeRequest):
    titles = [e.get("title", "") for e in req.entries if e.get("title")]
    summary_text = (
        f"๑. ปฏิบัติหน้าที่การฝึกภาคปฏิบัติตามหลักสูตรสัปดาห์ที่ {req.week_num} โดยดำเนินการภารกิจหลัก ได้แก่ "
        f"{' และ '.join(titles[:2]) if titles else 'งานบริการสารสนเทศภาครัฐ'}\n"
        f"๒. ได้รับความรู้และฝึกฝนทักษะด้านเทคโนโลยีดิจิทัลและการรักษาความปลอดภัยข้อมูลตามมาตรฐาน PDPA\n"
        f"๓. บันทึกเวลาสะสมครบถ้วนตามเกณฑ์มาตรฐานการฝึกงาน ๒๒.๕ ชั่วโมงประจำสัปดาห์"
    )
    return {
        "success": True,
        "week_num": req.week_num,
        "summary": summary_text
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8086, reload=True)
