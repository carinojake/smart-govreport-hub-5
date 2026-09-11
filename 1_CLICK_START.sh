#!/bin/bash

# ==============================================================================
# 🚀 1-CLICK START: SMART GOVREPORT HUB 2.5
# มาตรฐาน: สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (ศทส.)
# Frontend: http://localhost:8085 | Backend: http://127.0.0.1:8086
# ==============================================================================

FRONTEND_PORT=8085
BACKEND_PORT=8086
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${PROJECT_DIR}/backend"
VENV_PYTHON="/Users/Shared/my_ai_project/venv/bin/python"

# Fallback Python detection
if [ -f "$VENV_PYTHON" ]; then
    PYTHON_CMD="$VENV_PYTHON"
elif [ -f "${PROJECT_DIR}/venv/bin/python" ]; then
    PYTHON_CMD="${PROJECT_DIR}/venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="$(command -v python3)"
else
    echo "❌ ไม่พบ Python 3 ในระบบ กรุณาตรวจสอบการติดตั้ง"
    exit 1
fi

echo "=========================================================================="
echo "🏛️  Starting Smart GovReport Hub 2.5..."
echo "📂  Directory: ${PROJECT_DIR}"
echo "🐍  Python   : ${PYTHON_CMD}"
echo "🌐  Frontend : http://localhost:${FRONTEND_PORT}/"
echo "⚙️  Backend  : http://localhost:${BACKEND_PORT}/"
echo "=========================================================================="

# 1. จัดการ Port เดิมหากรันค้างอยู่
for PORT in ${FRONTEND_PORT} ${BACKEND_PORT}; do
    EXISTING_PID=$(lsof -ti tcp:${PORT} 2>/dev/null)
    if [ -n "$EXISTING_PID" ]; then
        echo "⚠️  ปิด Process เดิมที่รันค้างที่ Port ${PORT} (PID: ${EXISTING_PID})..."
        kill -9 $EXISTING_PID 2>/dev/null
        sleep 1
    fi
done

# 2. ตรวจสอบและสตาร์ท Docker PostgreSQL 5432
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

# 3. เริ่มต้น FastAPI Backend Server (Port 8086)
echo "⚡ กำลังสตาร์ท FastAPI Backend (Port ${BACKEND_PORT})..."
cd "${BACKEND_DIR}" || exit 1
"${PYTHON_CMD}" -m uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT} > /dev/null 2>&1 &
BACKEND_PID=$!

sleep 1.5

# 4. เริ่มต้น Web Frontend Server ด้วย Secure Dev Server (Port ${FRONTEND_PORT})
echo "🎨 กำลังสตาร์ท Frontend Web Server (Port ${FRONTEND_PORT})..."
cd "${PROJECT_DIR}" || exit 1
"${PYTHON_CMD}" secure_dev_server.py > /dev/null 2>&1 &
FRONTEND_PID=$!

sleep 1.5

# 5. ตรวจสอบ Cloudflare Tunnel
TUNNEL_URL=$(strings "${PROJECT_DIR}/logs/tunnel.log" 2>/dev/null | grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' | tail -n 1)

# 6. ตรวจสอบสถานะการรัน
if ps -p $FRONTEND_PID > /dev/null && ps -p $BACKEND_PID > /dev/null; then
    echo "=========================================================================="
    echo "✅ ระบบ Smart GovReport Hub 2.5 รันสำเร็จ 100%!"
    echo "🌐 Local URL   : http://localhost:${FRONTEND_PORT}/"
    echo "⚙️ Backend API : http://localhost:${BACKEND_PORT}/"
    echo "📖 API Docs    : http://localhost:${BACKEND_PORT}/docs"
    if [ -n "$TUNNEL_URL" ]; then
        echo "🌍 Public URL  : ${TUNNEL_URL}"
    fi
    echo "💡 ปิดระบบผ่านคำสั่ง: kill -9 ${FRONTEND_PID} ${BACKEND_PID}"
    echo "=========================================================================="
    
    osascript -e 'display notification "Smart GovReport Hub 2.5 พร้อมใช้งานแล้วที่ Port 8085" with title "Smart GovReport Hub 2.5 Ready" sound name "Glass"' 2>/dev/null
    open "http://localhost:${FRONTEND_PORT}/"
else
    echo "❌ เกิดข้อผิดพลาดในการเริ่มต้น Server กรุณาตรวจสอบพอร์ต ${FRONTEND_PORT} หรือ ${BACKEND_PORT}"
fi
