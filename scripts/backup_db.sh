#!/usr/bin/env bash
# ==============================================================================
# Smart GovReport Hub 2.5 - Automated Backup Script
# ทำการสำรองฐานข้อมูล SQLite (WAL Safe) และ PDPA Audit Trail พร้อมบีบอัดไฟล์
# ==============================================================================

set -euo pipefail

# ไดเรกทอรีและตัวแปรการสำรองข้อมูล
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
TARGET_DIR="${BACKUP_DIR}/backup_${TIMESTAMP}"
DB_FILE="${PROJECT_DIR}/ojt_logbook.db"
AUDIT_LOG="${PROJECT_DIR}/logs/pdpa_audit.jsonl"
RETENTION_DAYS=30

echo "[$(date)] 🚀 เริ่มต้นกระบวนการสำรองข้อมูล Smart GovReport Hub..."

# สร้างโฟลเดอร์สำรองข้อมูล
mkdir -p "${TARGET_DIR}"

# 1. สำรอง SQLite Database อย่างปลอดภัยโดยใช้คำสั่ง .backup ของ sqlite3 (WAL Safe)
if [ -f "${DB_FILE}" ]; then
    echo "📦 กำลังสำรองฐานข้อมูล SQLite: ${DB_FILE}..."
    sqlite3 "${DB_FILE}" ".backup '${TARGET_DIR}/ojt_logbook.db'"
else
    echo "⚠️ ไม่พบไฟล์ฐานข้อมูล ${DB_FILE}"
fi

# 2. สำรองประวัติการตรวจสอบ PDPA Audit Log (JSONL)
if [ -f "${AUDIT_LOG}" ]; then
    echo "📋 กำลังสำรองบันทึก PDPA Audit Trail: ${AUDIT_LOG}..."
    cp "${AUDIT_LOG}" "${TARGET_DIR}/pdpa_audit.jsonl"
fi

# 3. บีบอัดโฟลเดอร์สำรองข้อมูลเป็น tar.gz เพื่อประหยัดพื้นที่ดิสก์
ARCHIVE_NAME="${BACKUP_DIR}/smartgov_backup_${TIMESTAMP}.tar.gz"
echo "🗜️ กำลังบีบอัดไฟล์สำรอง: ${ARCHIVE_NAME}..."
tar -czf "${ARCHIVE_NAME}" -C "${BACKUP_DIR}" "backup_${TIMESTAMP}"
rm -rf "${TARGET_DIR}"

# 4. ลบไฟล์สำรองข้อมูลที่เก่ากว่า 30 วันตามนโยบายจัดเก็บข้อมูล
echo "🧹 ตรวจสอบและล้างไฟล์สำรองเก่าที่เกิน ${RETENTION_DAYS} วัน..."
find "${BACKUP_DIR}" -name "smartgov_backup_*.tar.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +

BACKUP_SIZE="$(du -h "${ARCHIVE_NAME}" | cut -f1)"
echo "[$(date)] ✅ สำรองข้อมูลสำเร็จสมบูรณ์! ไฟล์: ${ARCHIVE_NAME} (ขนาด: ${BACKUP_SIZE})"
