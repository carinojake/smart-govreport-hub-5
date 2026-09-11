#!/usr/bin/env bash
# ==============================================================================
# 🐘 Smart GovReport Hub 2.5 - Automated PostgreSQL 5432 Backup Script
# สถาปัตยกรรม: Docker PostgreSQL 16 (Port 5432) -> Compressed Tarball (.tar.gz)
# พัฒนาโดย: เซียน SA (5.2) & โค้ดเดอร์หลังบ้าน (5.5) สำหรับ พี่แจ็ค (Jake)
# ==============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
TARGET_DIR="${BACKUP_DIR}/backup_${TIMESTAMP}"
CONTAINER_NAME="smartgov_postgres"
DB_NAME="smartgov_v25"
RETENTION_DAYS=30

echo "[$(date)] 🚀 เริ่มต้นกระบวนการสำรองฐานข้อมูล Docker PostgreSQL 5432..."

# 1. ตรวจสอบสถานะของ Docker Container
if ! docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
    echo "❌ ข้อผิดพลาด: ไม่พบคอนเทนเนอร์ ${CONTAINER_NAME} กำลังทำงานอยู่!"
    exit 1
fi

mkdir -p "${TARGET_DIR}"

# 2. ทำการ Dump ข้อมูลจาก Docker PostgreSQL ด้วยคำสั่ง pg_dump
DUMP_FILE="${TARGET_DIR}/${DB_NAME}.sql"
echo "📦 กำลังดัมพ์ฐานข้อมูล ${DB_NAME} จากคอนเทนเนอร์ ${CONTAINER_NAME}..."
docker exec "${CONTAINER_NAME}" pg_dump -U postgres "${DB_NAME}" > "${DUMP_FILE}"

# 3. สำรองไฟล์คอนฟิกสภาพแวดล้อม และ Log ล่าสุด (ถ้ามี)
if [ -f "${PROJECT_DIR}/backend/.env" ]; then
    cp "${PROJECT_DIR}/backend/.env" "${TARGET_DIR}/env_backup.env"
fi
if [ -f "${PROJECT_DIR}/backend/logs/uvicorn.log" ]; then
    cp "${PROJECT_DIR}/backend/logs/uvicorn.log" "${TARGET_DIR}/uvicorn.log"
fi

# 4. บีบอัดไฟล์เป็น .tar.gz เพื่อประหยัดพื้นที่ดิสก์บน Mac M1
ARCHIVE_NAME="${BACKUP_DIR}/smartgov_pg_backup_${TIMESTAMP}.tar.gz"
echo "🗜️ กำลังบีบอัดไฟล์สำรอง: ${ARCHIVE_NAME}..."
tar -czf "${ARCHIVE_NAME}" -C "${BACKUP_DIR}" "backup_${TIMESTAMP}"
rm -rf "${TARGET_DIR}"

# 5. ลบไฟล์สำรองเก่าที่เกิน 30 วันตามนโยบาย Retention
echo "🧹 ตรวจสอบและล้างไฟล์สำรองเก่าที่เกิน ${RETENTION_DAYS} วัน..."
find "${BACKUP_DIR}" -name "smartgov_pg_backup_*.tar.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +

BACKUP_SIZE="$(du -h "${ARCHIVE_NAME}" | cut -f1)"
echo "[$(date)] ✅ สำรองฐานข้อมูลสำเร็จสมบูรณ์! ไฟล์: ${ARCHIVE_NAME} (ขนาด: ${BACKUP_SIZE})"
