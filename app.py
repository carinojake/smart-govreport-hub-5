"""
Smart GovReport Hub 5 - FastAPI Application Gateway
Title: Smart GovReport Hub 5
Version: 5.0.0
Standards: สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (ศทส.)
Target: Docker PostgreSQL 16 (Port 5432) | Modular Architecture
"""

from backend.main import app

__title__ = "Smart GovReport Hub 5"
__version__ = "5.0.0"

if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("🚀 สตาร์ตระบบ Smart GovReport Hub 5 (PostgreSQL 5432 + Modular)")
    print("   เวอร์ชัน: 5.0.0 | FastAPI + AsyncPG")
    print("   URL ใช้งาน: http://127.0.0.1:8086")
    print("   API Docs:   http://127.0.0.1:8086/docs")
    print("=" * 70)
    uvicorn.run("app:app", host="0.0.0.0", port=8086, reload=True)
