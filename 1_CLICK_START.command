#!/bin/bash

# ==============================================================================
# 🚀 1-CLICK START: SMART GOVREPORT HUB 2.5 (STANDALONE PROJECT)
# Frontend: http://localhost:8085 | Backend: http://127.0.0.1:8086
# ==============================================================================

FRONTEND_PORT=8085
BACKEND_PORT=8086
PROJECT_DIR="/Users/Shared/my_ai_project/01_ACTIVE_PROJECTS/ojt-smartgov-report-v2.5"
BACKEND_DIR="${PROJECT_DIR}/backend"
VENV_PYTHON="/Users/Shared/my_ai_project/venv/bin/python"

echo "=========================================================================="
echo "🏛️  Starting Smart GovReport Hub 2.5 (Standalone Edition)..."
echo "📂  Directory: ${PROJECT_DIR}"
echo "🌐  Frontend : http://localhost:${FRONTEND_PORT}/"
echo "⚙️  Backend  : http://localhost:${BACKEND_PORT}/"
echo "=========================================================================="

# 1. จัดการ Port เดิมหากรันค้างอยู่
for PORT in ${FRONTEND_PORT} ${BACKEND_PORT}; do
    EXISTING_PID=$(lsof -ti tcp:${PORT})
    if [ -n "$EXISTING_PID" ]; then
        echo "⚠️  ปิด Process เดิมที่รันค้างที่ Port ${PORT} (PID: ${EXISTING_PID})..."
        kill -9 $EXISTING_PID 2>/dev/null
        sleep 1
    fi
done

# 2. เริ่มต้น FastAPI Backend Server (Port 8086)
echo "⚡ กำลังสตาร์ท FastAPI Backend (Port ${BACKEND_PORT})..."
cd "${BACKEND_DIR}" || exit 1
"${VENV_PYTHON}" -m uvicorn main:app --host 127.0.0.1 --port ${BACKEND_PORT} > /dev/null 2>&1 &
BACKEND_PID=$!

sleep 1

# 3. เริ่มต้น Web Frontend Server (Port 8085)
echo "🎨 กำลังสตาร์ท Frontend Web Server (Port ${FRONTEND_PORT})..."
cd "${PROJECT_DIR}" || exit 1
python3 -m http.server ${FRONTEND_PORT} > /dev/null 2>&1 &
FRONTEND_PID=$!

sleep 1

# 4. ตรวจสอบสถานะการรัน
if ps -p $FRONTEND_PID > /dev/null && ps -p $BACKEND_PID > /dev/null; then
    echo "✅ ระบบ Smart GovReport Hub 2.5 รันสำเร็จ 100%!"
    osascript -e 'display notification "Smart GovReport Hub 2.5 พร้อมใช้งานแล้วที่ Port 8085" with title "Smart GovReport Hub 2.5 Ready" sound name "Glass"' 2>/dev/null
    open "http://localhost:${FRONTEND_PORT}/"
    echo "💡 สั่งปิดระบบได้ง่ายๆ ผ่านคำสั่ง: kill -9 ${FRONTEND_PID} ${BACKEND_PID}"
else
    echo "❌ เกิดข้อผิดพลาดในการเริ่มต้น Server กรุณาตรวจสอบพอร์ต ${FRONTEND_PORT} หรือ ${BACKEND_PORT}"
fi
