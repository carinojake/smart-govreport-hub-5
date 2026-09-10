import os
import sys
import uvicorn

def main():
    print("=" * 70)
    print("🚀 สตาร์ตระบบ Smart GovReport Hub & OJT Logbook (Master Replica)")
    print("   ขับเคลื่อนโดย: FastAPI + Gemini Flash + SQLite WAL + Modern Gov UI")
    print("   URL ใช้งาน: http://127.0.0.1:8000")
    print("   API Docs:   http://127.0.0.1:8000/docs")
    print("=" * 70)
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False, log_level="info")

if __name__ == "__main__":
    main()
