#!/bin/bash
# ==============================================================================
# 🚀 1_CLICK_START: Smart GovReport Hub & OJT Report System
# ระบบบริหารจัดการและรายงานผลการปฏิบัติงานอัจฉริยะ (มาตรฐานราชการ)
# พัฒนาสำหรับ macOS (Apple Silicon M1/M2/M3) - ดับเบิลคลิกเพื่อรันได้ทันที
# ==============================================================================

# 1. ย้ายไปยังโฟลเดอร์ที่ตั้งของโปรเจกต์เสมอ
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR" || exit 1

# 2. ตั้งค่าสีสำหรับการแสดงผลบน Terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 3. แสดงแบนเนอร์ระบบ
clear
echo -e "${CYAN}${BOLD}"
echo "=============================================================================="
echo "    🏛️  SMART GOVREPORT HUB & OJT REPORT SYSTEM (1-CLICK LAUNCHER)          "
echo "    ระบบบริหารจัดการและรายงานผลการปฏิบัติงานอัจฉริยะ (มาตรฐานราชการ)          "
echo "=============================================================================="
echo -e "${NC}"
echo -e "${BLUE}📍 ตำแหน่งโปรเจกต์:${NC} $PROJECT_DIR"
echo -e "${BLUE}⏰ เวลาเริ่มต้น:${NC} $(date '+%Y-%m-%d %H:%M:%S')"

# 4. ค้นหาและเลือกใช้ Python Virtual Environment (อิงตามค่ามาตรฐานของเครื่องพี่แจ็ค)
VENV_PYTHON="/Users/Shared/my_ai_project/venv/bin/python"

if [ -f "$VENV_PYTHON" ]; then
    PYTHON_CMD="$VENV_PYTHON"
    echo -e "${GREEN}✓ ตรวจพบ Virtual Environment หลัก:${NC} $VENV_PYTHON"
elif [ -f "$PROJECT_DIR/venv/bin/python" ]; then
    PYTHON_CMD="$PROJECT_DIR/venv/bin/python"
    echo -e "${GREEN}✓ ตรวจพบ Virtual Environment ในโฟลเดอร์:${NC} $PYTHON_CMD"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="$(command -v python3)"
    echo -e "${YELLOW}⚠️  ไม่พบ Virtual Environment หลัก กำลังใช้ System Python:${NC} $PYTHON_CMD"
else
    echo -e "${RED}❌ ไม่พบ Python 3 ในระบบ กรุณาตรวจสอบการติดตั้ง${NC}"
    read -p "กด Enter เพื่อออกจากโปรแกรม..."
    exit 1
fi

# 5. ตรวจสอบและเคลียร์พอร์ต 8000 กรณีมีโปรเซสเดิมค้างอยู่
PORT=8000
OCCUPIED_PID=$(lsof -ti :$PORT 2>/dev/null)

if [ -n "$OCCUPIED_PID" ]; then
    echo -e "${YELLOW}⚠️  พอร์ต $PORT กำลังถูกใช้งานโดย PID $OCCUPIED_PID กำลังเคลียร์โปรเซสเดิม...${NC}"
    kill -9 $OCCUPIED_PID 2>/dev/null
    sleep 1
    echo -e "${GREEN}✓ เคลียร์พอร์ต $PORT เรียบร้อยแล้ว${NC}"
else
    echo -e "${GREEN}✓ พอร์ต $PORT พร้อมใช้งาน${NC}"
fi

# 6. ตรวจสอบความพร้อมของฐานข้อมูลและไฟล์คอนฟิก
if [ -f "$PROJECT_DIR/ojt_logbook.db" ]; then
    echo -e "${GREEN}✓ ตรวจพบฐานข้อมูล SQLite:${NC} ojt_logbook.db"
else
    echo -e "${YELLOW}⚠️  ไม่พบไฟล์ ojt_logbook.db ระบบจะทำการสร้างฐานข้อมูลอัตโนมัติเมื่อสตาร์ต${NC}"
fi

# 7. สั่งเปิดเว็บเบราว์เซอร์อัตโนมัติ (หน่วงเวลา 1.5 วินาทีเพื่อให้เซิร์ฟเวอร์เปิดทัน)
(sleep 1.5 && open "http://127.0.0.1:8000") &

# 8. แสดงข้อมูลสรุปการเข้าใช้งาน
echo -e "${CYAN}------------------------------------------------------------------------------${NC}"
echo -e "${BOLD}🌐 ระบบพร้อมให้บริการที่:${NC} ${GREEN}${BOLD}http://127.0.0.1:8000${NC}"
echo -e "${BOLD}📖 เอกสารคู่มือ API (Swagger):${NC} ${CYAN}http://127.0.0.1:8000/docs${NC}"
echo -e "${BOLD}📄 โฟลเดอร์เอกสารส่งมอบ 4 เล่ม:${NC} docs/deliverables/"
echo -e "${YELLOW}💡 เคล็ดลับ:${NC} หากต้องการหยุดการทำงานของเซิร์ฟเวอร์ ให้กด ${BOLD}Ctrl + C${NC}"
echo -e "${CYAN}------------------------------------------------------------------------------${NC}"
echo ""

# 9. เริ่มต้นรันเซิร์ฟเวอร์ด้วย FastAPI / Uvicorn ผ่าน run_server.py
"$PYTHON_CMD" run_server.py
