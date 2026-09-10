# 🏛️ Smart GovReport Hub 2.5 & OJT Report System
### ระบบบริหารจัดการและรายงานผลการปฏิบัติงานอัจฉริยะ (มาตรฐานราชการ 4.0)

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success.svg)](#)
[![PDPA Ready](https://img.shields.io/badge/Security-PDPA%20Compliant-red.svg)](#)

---

## 📖 ภาพรวมระบบ (System Overview)

**Smart GovReport Hub 2.5** คือระบบดิจิทัลบริหารจัดการและจัดทำรายงานผลการปฏิบัติงานของข้าราชการ/พนักงานราชการ/ผู้ฝึกงานภาครัฐ (OJT 90 ชั่วโมง) และจัดทำหนังสือราชการ (บันทึกข้อความ) ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖

ออกแบบบนหลักการ **Modular & Cost-Effective Hybrid Architecture**:
1. **Core Backend (Tier 1):** พัฒนาด้วย Python 3.12 + FastAPI + SQLite (WAL Mode) / PostgreSQL
2. **Modern Frontend (V3 Modular):** รองรับ Web Speech API (พิมพ์ด้วยเสียงภาษาไทย), IndexedDB Local-First, และ Cloud Auto-Sync
3. **Audit & Reconciliation Engine (2.5):** คอนโซลตรวจสอบความถูกต้องของระบบ พร้อมโมดูล Reconcile บัญชีซอฟต์แวร์ป้องกันไวรัสภาครัฐ (Star Cat vs XDR)

---

## 🌟 ฟีเจอร์หลัก (Key Features)

- 🎙️ **Thai Speech-to-Text Assistant:** บันทึกงานผ่านเสียงพูดภาษาไทย แปลงเป็นข้อความแบบเรียลไทม์
- 🛡️ **PDPA Two-Tier Sanitizer & Consent:** ตรวจจับและ Masking ข้อมูลส่วนบุคคล (เลขบัตร ปชช. 13 หลัก, เบอร์โทร, อีเมล) พร้อมระบบบันทึกความยินยอม PDPA
- 🤖 **AI Gov Polish (Gemini 1.5 Flash):** ขัดเกลาภาษาพูดให้เป็นภาษาราชการที่ถูกต้องตามระเบียบงานสารบรรณ
- ✍️ **Digital Signature Pad:** รองรับการลงนามดิจิทัล 2 ระดับ (ผู้ฝึกงาน และ ผู้ควบคุมงาน/Supervisor)
- 📄 **A4 Official Print Engine:** พิมพ์บันทึกข้อความและสมุดบันทึก OJT ตรงตามขนาดกระดาษ A4 มาตรฐาน ตราครุฑ 3 ซม. ไม่ตกขอบ
- 🔍 **Audit Log Console (Version 2.5):** ระบบบันทึกประวัติการเข้าถึงและการแก้ไขข้อมูลแบบโปร่งใส ตรวจสอบย้อนหลังได้ทุก Transaction
- 📊 **Executive Dashboard & Reconciliation:** แดชบอร์ดสรุปผลเชิงบริหาร และระบบเปรียบเทียบข้อมูลทรัพย์สินคอมพิวเตอร์/แอนตี้ไวรัส

---

## 🚀 วิธีการเริ่มต้นใช้งานแบบ 1-Click (Quick Start)

### ข้อกำหนดระบบ (Prerequisites)
- ระบบปฏิบัติการ macOS (Apple Silicon M1/M2/M3 หรือ Intel) หรือ Linux/Windows
- Python 3.10+ (แนะนำ Python 3.12 ใน `/Users/Shared/my_ai_project/venv`)

### รันระบบบน macOS:
```bash
# วิธีที่ 1: ดับเบิลคลิกไฟล์ผ่าน Finder
1_CLICK_START.command

# วิธีที่ 2: รันผ่าน Terminal
chmod +x 1_CLICK_START.sh
./1_CLICK_START.sh
```

ระบบจะเปิดเบราว์เซอร์ไปยัง `http://127.0.0.1:8000` ให้อัตโนมัติทันที

---

## 📂 โครงสร้างไดเรกทอรี (Directory Structure)

```text
smart-govreport-hub-2.5/
├── 1_CLICK_START.command      # ตัวเปิดระบบด่วนสำหรับ macOS Finder
├── 1_CLICK_START.sh           # Shell script รันระบบอัตโนมัติ
├── app.py                     # FastAPI Application หลัก (REST API & Endpoints)
├── run_server.py              # สคริปต์รันเซิร์ฟเวอร์ Uvicorn
├── requirements.txt           # รายการ Python dependencies
├── ojt_system/                # Backend Package โมดูลหลัก
│   ├── ai_client.py           # ตัวเชื่อมต่อ AI ขัดเกลาภาษาราชการ
│   ├── database.py            # ตัวจัดการฐานข้อมูล SQLite WAL / Transaction
│   ├── models.py              # Pydantic Schemas & Data Models
│   ├── pdpa_sanitizer.py      # เกราะป้องกันข้อมูลส่วนบุคคล PDPA
│   ├── templates.py           # แม่แบบรายงานและบันทึกข้อความ
│   └── a4_exporter.py         # ตัวเรนเดอร์เอกสาร A4 สารบรรณ
├── templates/                 # Jinja2 HTML Templates (index_v1, v2, v3)
├── static/                    # ไฟล์ Static Assets (CSS, JS, Web Speech, IndexedDB)
├── docs/                      # เอกสารราชการส่งมอบโครงการ 4 เล่มมาตรฐาน
│   └── deliverables/
│       ├── 01_System_Implementation_Report/
│       ├── 02_Comprehensive_System_Manual/
│       ├── 03_System_Testing_and_QA_Report/
│       └── 04_Maintenance_and_Handoff_Plan/
├── reconcile_antivirus.py     # โมดูล Audit & Reconcile แอนตี้ไวรัสภาครัฐ
└── test_integration.py        # ชุดทดสอบระบบ Integration Test ครอบคลุม 7 หมวด
```

---

## 🧪 การทดสอบระบบ (Testing & Verification)

ระบบผ่านการทดสอบครอบคลุมทุกฟังก์ชันหลัก 100%:
```bash
python3 test_integration.py
```
- **ผลการทดสอบ:** ผ่าน 7/7 หมวด (Status 200, PDPA Sanitizer, Multi-role RBAC, Signature, IndexedDB fallback, A4 Export)
- **มาตรฐาน Accessibility:** ผ่านเกณฑ์ **WCAG 2.1 AA**

---

## 📚 เอกสารส่งมอบโครงการ 4 เล่มมาตรฐาน (Project Deliverables)
อยู่ในโฟลเดอร์ `docs/deliverables/`:
1. **เล่ม 1:** รายงานจัดทำระบบแบบสมบูรณ์และสถาปัตยกรรมทางเทคนิค (`01_System_Implementation_Report`)
2. **เล่ม 2:** คู่มือการใช้งานระบบแบบสมบูรณ์ (`02_Comprehensive_System_Manual`)
3. **เล่ม 3:** รายงานผลการทดสอบระบบและการประกันคุณภาพ (`03_System_Testing_and_QA_Report`)
4. **เล่ม 4:** แผนการบำรุงรักษาและการฝึกอบรม/ส่งมอบงาน (`04_Maintenance_and_Handoff_Plan`)

---

## 📄 ใบอนุญาต (License)
โครงการนี้เผยแพร่ภายใต้สัญญาอนุญาต **MIT License**
