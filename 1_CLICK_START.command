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

# 1.5 ตรวจสอบและสตาร์ท Docker PostgreSQL 5432 หากยังไม่ได้รัน
echo "🐘 ตรวจสอบ Docker PostgreSQL (Port 5432)..."
if command -v docker >/dev/null 2>&1; then
    if ! docker ps --filter "name=smartgov_postgres" --format '{{.Names}}' | grep -q "smartgov_postgres"; then
        echo "⚡ กำลังสตาร์ท Docker PostgreSQL container..."
        docker start smartgov_postgres 2>/dev/null || docker run -d --name smartgov_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=smartgov_v25 -p 5432:5432 -v smartgov_pgdata:/var/lib/postgresql/data postgres:16-alpine
        sleep 2
    else
        echo "✅ Docker PostgreSQL พร้อมทำงานอยู่แล้ว"
    fi
fi

# 2. เริ่มต้น FastAPI Backend Server (Port 8086)
echo "⚡ กำลังสตาร์ท FastAPI Backend (Port ${BACKEND_PORT})..."
cd "${BACKEND_DIR}" || exit 1
"${VENV_PYTHON}" -m uvicorn main:app --host 127.0.0.1 --port ${BACKEND_PORT} > /dev/null 2>&1 &
BACKEND_PID=$!

sleep 1

# 3. เริ่มต้น Web Frontend Server ด้วย Secure Dev Server (Port ${FRONTEND_PORT})
echo "🎨 กำลังสตาร์ท Frontend Web Server (Secure Dev Server Port ${FRONTEND_PORT})..."
cd "${PROJECT_DIR}" || exit 1
python3 secure_dev_server.py > /dev/null 2>&1 &
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
