# 🏛️ Smart GovReport Hub 2.5 - Antigravity Agent Rules & Workspace Memory

## 1. Project Context & Objectives
- **Project Name:** Smart GovReport Hub 2.5 (OJT Report System 2.0)
- **Lead Executive:** พี่แจ็ค (Jake) - เจ้าของสวนยางพารา และผู้บริหารระบบ AI Automation
- **Target Organization:** สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (ศทส.)
- **Core Architecture:**
  - **Frontend:** Modular JavaScript (ES6 Modules) + Tailwind CSS + Font Sarabun/Prompt (Port: 8085)
  - **Backend API:** FastAPI 0.110+ & AsyncPG Connection Pool (Port: 8086)
  - **Database:** Docker PostgreSQL 16 (Port: 5432) / SQLite WAL backup
  - **Cloud Sync:** Google Apps Script / Google Sheets 0 บาท

---

## 2. Terminal Permissions & Runtime Environment (MacBook Air M1)
- **Python Runtime:** บังคับใช้ Python 3.12 ใน Virtual Environment:
  `/Users/Shared/my_ai_project/venv/bin/python`
- **Port Allocations:**
  - `8085`: Secure Dev HTTP Server (Frontend UI)
  - `8086`: FastAPI Uvicorn REST API (Dynamic RBAC Matrix & OJT Data)
  - `5432`: Docker PostgreSQL 16
- **Performance & Cost Optimization (Mac M1):**
  - หลีกเลี่ยงการรัน Process หนักหน่วงที่ทำให้ CPU Throttle หรือเปลือง RAM
  - โค้ดสะอาด (Clean Architecture) ไร้ Bloatware และประหยัด Token สูงสุด

---

## 3. Data Protection & Security Guardrails
- **Accidental Data Loss Prevention:**
  - ห้ามรันคำสั่ง `DROP TABLE`, `TRUNCATE`, หรือ `rm -rf` ต่อไฟล์ฐานข้อมูลหรือโฟลเดอร์สำคัญโดยเด็ดขาด
  - ก่อนแก้ไข Schema ฐานข้อมูล ต้องรันสคริปต์สำรองข้อมูลก่อนเสมอ (`scripts/backup_db.sh` หรือ `scripts/backup_postgres.sh`)
- **PDPA Compliance (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล):**
  - ตรวจจับและ Masking ข้อมูลส่วนบุคคล (เลขบัตรประชาชน ๑๓ หลัก, หมายเลขโทรศัพท์)
- **Secrets Management:**
  - ห้าม Push ไฟล์ `.env`, คีย์รหัสผ่าน หรือ Token ขึ้น GitHub เด็ดขาด (ใช้ `.env.example` เท่านั้น)

---

## 4. Agent Personas & Operational Roles (ทีม 13 ตำแหน่ง)
1. **น้องฟ้า เลขาหน้าห้อง (5.11):** ประสานงาน, สรุปผลการทำงาน, จัดเตรียมรายงานราชการ
2. **พี่ใหญ่ PM (5.1):** วางแผนงาน, ควบคุมเวลาและงบประมาณ, พิจารณาความคุ้มค่า
3. **เซียน SA (5.2):** วิเคราะห์ระบบ, ออกแบบ Data Model, วางโครงสร้าง Dynamic RBAC
4. **โค้ดเดอร์หลังบ้าน (5.5):** พัฒนา Backend, เขียน FastAPI, ตรวจสอบ SQL Queries และ API

---
