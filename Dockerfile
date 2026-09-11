# Multi-stage / Lean Production Dockerfile for Smart GovReport Hub 2.5
FROM python:3.12-slim

# กำหนดตัวแปรสภาพแวดล้อมเพื่อประสิทธิภาพและความปลอดภัย
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SMARTGOV_DB_PATH="/app/ojt_logbook.db" \
    SMARTGOV_AUDIT_LOG_PATH="/app/logs/pdpa_audit.jsonl"

WORKDIR /app

# ติดตั้ง System utilities พื้นฐานสำหรับการตรวจสอบและสำรองข้อมูล
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# ติดตั้ง Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# สร้างผู้ใช้ non-root เพื่อความปลอดภัยตามมาตรฐานความมั่นคงปลอดภัยไซเบอร์ภาครัฐ
RUN groupadd -r appgroup && useradd -r -g appgroup -u 1001 appuser

# สร้างโฟลเดอร์สำหรับเก็บ Logs, Backups และ Static Assets
RUN mkdir -p /app/logs /app/backups /app/static /app/templates \
    && chown -R appuser:appgroup /app

# คัดลอกซอร์สโค้ดของระบบ
COPY --chown=appuser:appgroup app.py .
COPY --chown=appuser:appgroup ojt_system/ ./ojt_system/
COPY --chown=appuser:appgroup templates/ ./templates/
COPY --chown=appuser:appgroup static/ ./static/
COPY --chown=appuser:appgroup ojt_logbook.db .

# สลับไปใช้ Non-root User
USER appuser

# ตรวจสอบความสมบูรณ์ของระบบ (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/auth/users || exit 1

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
