# 🏛️ Smart GovReport Hub 5 (PostgreSQL 5432 + Modular Architecture)
### ระบบบริหารจัดการและรายงานผลการปฏิบัติงานอัจฉริยะ 5 (รุ่นที่ 1 - OJT Report System 5)
#### โครงการส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ 90 ชั่วโมง

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20AsyncPG-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](https://www.postgresql.org/)
[![JavaScript](https://img.shields.io/badge/Frontend-ES6%20Modular-F7DF1E.svg)](#)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success.svg)](#)
[![PDPA Ready](https://img.shields.io/badge/Security-Dual--Layer%20PDPA-red.svg)](#)

---

## 📖 ภาพรวมระบบ (System Overview)

**Smart GovReport Hub 5 (Modular Standalone Edition)** คือระบบบริหารจัดการและรายงานผลการปฏิบัติงานอัจฉริยะสำหรับงานสารบรรณภาครัฐและการฝึกงาน (OJT 90 ชั่วโมง - โครงการส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ 90 ชั่วโมง) ขับเคลื่อนด้วยสถาปัตยกรรมแบบแยกส่วน (Modular JavaScript ES6 Modules) เชื่อมต่อฐานข้อมูลหลัก **Docker PostgreSQL 16 (Port: 5432)** และรองรับ **FastAPI AsyncPG REST API (Port: 8086)** พร้อมเสิร์ฟหน้าบ้านแบบ Secure HTTP Server **(Port: 8085)**

---

## 🌟 ฟีเจอร์เด่นในรุ่น 2.5 (Key Features)

1. **Dynamic RBAC Permission Matrix (PostgreSQL-backed):**
   - จัดการสิทธิ์การเข้าถึงเมนูและโมดูลงาน (View / Edit) ได้แบบ Real-time ราย 4 บทบาทหลัก:
     - `staff` (ผู้ดูแลระบบ / เจ้าหน้าที่)
     - `supervisor` (ผู้ควบคุมงาน / พี่เลี้ยง)
     - `advisor` (อาจารย์นิเทศก์ / ที่ปรึกษา)
     - `trainee` (ผู้ฝึกปฏิบัติงาน)
   - บันทึกการเปลี่ยนแปลงลงฐานข้อมูล PostgreSQL ทันที พร้อมระบบ Audit Trail บันทึกประวัติการแก้ไขสิทธิ์

2. **Official A4 Print Engine (Portrait & Landscape Auto-Fitting):**
   - รองรับการจัดพิมพ์สมุดบันทึก OJT ทั้งแนวตั้งและแนวนอน (A4 Landscape Form) จัดคอลัมน์กว้างสวยงาม พร้อมลายเซ็นดิจิทัล 2 ระดับ
   - รองรับตัวเลขไทยและมาตรฐานงานสารบรรณ พ.ศ. ๒๕๒๖

3. **Core Modular JavaScript ES6 Architecture:**
   - แยกตรรกะระบบออกเป็น 14 โมดูลอิสระภายใต้ `js/modules/` (State, DB API, Numeral, Logbook, PDPA, Signature, Membership, Sync Hub, Audit Console, RBAC Manager)
   - ดูแลรักษาง่าย (Clean Architecture) และโหลดรวดเร็วด้วย Native ES Modules

4. **Multi-Database & Cloud Sync:**
   - จัดเก็บข้อมูลหลักบน Docker PostgreSQL 16
   - รองรับการสำรองและซิงค์ข้อมูลกับ Google Sheets ผ่าน Google Apps Script

5. **Automated Backup Utility:**
   - สคริปต์ `scripts/backup_postgres.sh` สำรองฐานข้อมูล PostgreSQL อัตโนมัติในรูปแบบ Compressed Archive

---

## 🚀 สถาปัตยกรรมและพอร์ตการทำงาน (System Ports)

| บริการ (Service) | พอร์ต (Port) | เทคโนโลยี (Technology) | หน้าที่ (Description) |
|---|---|---|---|
| **Web Frontend** | `8085` | `secure_dev_server.py` | UI แสดงผลหลัก (Dashboard, OJT Logbook, A4 Print) |
| **API Backend** | `8086` | FastAPI + AsyncPG (`backend/main.py`) | REST API และ Dynamic RBAC Matrix Service |
| **Database** | `5432` | Docker PostgreSQL 16 (`smartgov_v25`) | ฐานข้อมูลหลัก จัดเก็บ Users, Reports, Logs, Roles |

---

## 🛠️ วิธีการรันระบบ (How to Run)

### 1. เริ่มต้นระบบทั้งหมดในคลิกเดียว:
```bash
./1_CLICK_START.command
```
หรือรันแยกแต่ละ Service:

```bash
# 1. รัน Backend API (Port 8086)
cd backend
/Users/Shared/my_ai_project/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8086 --reload

# 2. รัน Frontend Web Server (Port 8085)
python3 secure_dev_server.py
```

เข้าใช้งานได้ที่: **http://localhost:8085**

---

## 🧪 การทดสอบระบบ (Quality Assurance)

รันชุดทดสอบความถูกต้องแบบอัตโนมัติ (Automated Standalone Test Suite):
```bash
python3 test_v2_5_standalone_suite.py
```
ผลการทดสอบ: **34/34 Passed (100%)**

---

## 📂 โครงสร้างไดเรกทอรี (Directory Structure)

```text
ojt-smartgov-report-v2.5/
├── 1_CLICK_START.command          # สคริปต์เปิดระบบอัตโนมัติ
├── backend/
│   ├── main.py                    # FastAPI Backend API & RBAC Matrix Endpoints
│   ├── schema_v25.sql             # โครงสร้างฐานข้อมูล PostgreSQL 16
│   └── .env.example               # ไฟล์ตัวอย่างการตั้งค่า Environment
├── css/
│   ├── main.css                   # สไตล์หลักของระบบ
│   └── print-a4.css               # สไตล์เอกสารสิ่งพิมพ์ A4 Portrait/Landscape
├── js/
│   ├── app.js                     # Main ES6 Module Bootstrapper
│   └── modules/                   # โมดูลระบบ 14 ส่วนย่อย
│       ├── 01-core-state.js
│       ├── 02-db-api.js
│       ├── 03-numeral.js
│       ├── 05-logbook-views.js
│       ├── 06-evidence-pdpa.js
│       ├── 07-signature.js
│       ├── 09-gov-docs.js
│       ├── 10-membership.js
│       ├── 11-sync-hub.js
│       ├── 12-audit-console.js
│       └── 14-rbac-manager.js     # โมดูลควบคุม Dynamic RBAC Matrix
├── scripts/
│   └── backup_postgres.sh         # สคริปต์สำรองฐานข้อมูล PostgreSQL
├── index.html                     # หน้าเว็บแอปพลิเคชันหลัก
├── secure_dev_server.py           # เว็บเซิร์ฟเวอร์ความปลอดภัยสูง (Port 8085)
└── test_v2_5_standalone_suite.py  # ชุดทดสอบระบบอัตโนมัติ 34 หัวข้อ
```

---
© 2026 Smart GovReport Hub
