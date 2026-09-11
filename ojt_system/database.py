import sqlite3
import json
import os
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from ojt_system.models import OJTActivityRecord, OfficialMemoRecord, SupervisorFeedbackRecord

class OJTDatabase:
    def __init__(self, db_path: str = "ojt_logbook.db", audit_log_path: str = "logs/pdpa_audit.jsonl", backend_audit_log_path: str = "logs/backend_audit.jsonl"):
        self.db_path = db_path
        self.audit_log_path = audit_log_path
        self.backend_audit_log_path = backend_audit_log_path
        os.makedirs(os.path.dirname(os.path.abspath(audit_log_path)), exist_ok=True)
        os.makedirs(os.path.dirname(os.path.abspath(backend_audit_log_path)), exist_ok=True)
        self.init_db()
        self.seed_initial_data()
        self.seed_audit_demo_logs()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                pin_code TEXT NOT NULL,
                full_name TEXT NOT NULL,
                nickname TEXT,
                role TEXT NOT NULL CHECK(role IN ('trainee', 'supervisor', 'admin')),
                department TEXT NOT NULL,
                cohort_id TEXT DEFAULT 'cohort_gov_pwd_r1',
                assigned_supervisor_id TEXT,
                position_title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trainee_id TEXT NOT NULL,
                activity_date TEXT NOT NULL,
                day_name TEXT NOT NULL,
                week_number INTEGER NOT NULL DEFAULT 1,
                activity_title TEXT NOT NULL,
                hours REAL NOT NULL,
                cumulative_hours REAL NOT NULL,
                competency_code TEXT NOT NULL,
                sop_procedure TEXT NOT NULL,
                tools_used TEXT NOT NULL,
                problems_and_solutions TEXT NOT NULL,
                pdpa_redaction_notes TEXT NOT NULL,
                raw_input TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainee_id) REFERENCES ojt_users(user_id)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_memos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trainee_id TEXT NOT NULL,
                week_number INTEGER NOT NULL,
                department TEXT NOT NULL,
                doc_number TEXT NOT NULL,
                memo_date TEXT NOT NULL,
                subject TEXT NOT NULL,
                origin_section TEXT NOT NULL,
                facts_section TEXT NOT NULL,
                consideration_section TEXT NOT NULL,
                signatory_title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainee_id) REFERENCES ojt_users(user_id)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_evaluations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trainee_id TEXT NOT NULL,
                week_number INTEGER NOT NULL,
                supervisor_id TEXT NOT NULL,
                supervisor_name TEXT NOT NULL,
                supervisor_comment TEXT NOT NULL,
                suggested_score INTEGER NOT NULL,
                development_advice TEXT NOT NULL,
                status TEXT DEFAULT 'approved',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainee_id) REFERENCES ojt_users(user_id)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_signatures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trainee_id TEXT NOT NULL,
                week_number INTEGER NOT NULL,
                signer_id TEXT NOT NULL,
                signer_name TEXT NOT NULL,
                role TEXT NOT NULL,
                signature_image_base64 TEXT NOT NULL,
                signed_pin_hash TEXT NOT NULL,
                signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainee_id) REFERENCES ojt_users(user_id)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_pdpa_consents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                policy_version TEXT NOT NULL,
                consent_status INTEGER NOT NULL,
                agreed_purposes TEXT NOT NULL,
                signature_hash TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                consented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES ojt_users(user_id)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_project_canvas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trainee_id TEXT UNIQUE NOT NULL,
                project_title TEXT NOT NULL,
                executive_summary TEXT NOT NULL,
                problem_statement TEXT,
                solution_statement TEXT,
                target_groups TEXT,
                sprints_plan TEXT,
                key_metrics TEXT,
                raci_matrix TEXT,
                steps_json TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainee_id) REFERENCES ojt_users(user_id)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_portfolios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trainee_id TEXT UNIQUE NOT NULL,
                headline TEXT NOT NULL,
                work_vision TEXT NOT NULL,
                experience_summary TEXT,
                experiences_json TEXT,
                skills_json TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainee_id) REFERENCES ojt_users(user_id)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_id TEXT,
                username TEXT,
                user_role TEXT,
                event_category TEXT NOT NULL,
                event_name TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'INFO',
                target_resource TEXT,
                ip_address TEXT,
                user_agent TEXT,
                details_json TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime'))
            );
            """)

            conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON ojt_audit_logs(timestamp);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_user_id ON ojt_audit_logs(user_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_category ON ojt_audit_logs(event_category);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_severity ON ojt_audit_logs(severity);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_activities_trainee_week ON ojt_activities(trainee_id, week_number);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_activities_date ON ojt_activities(activity_date);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_memos_trainee_week ON ojt_memos(trainee_id, week_number);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_evaluations_trainee_week ON ojt_evaluations(trainee_id, week_number);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_signatures_trainee_week ON ojt_signatures(trainee_id, week_number);")

            # Dynamic RBAC Tables
            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_roles (
                role_id TEXT PRIMARY KEY,
                role_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_menus (
                menu_id TEXT PRIMARY KEY,
                module_key TEXT NOT NULL UNIQUE,
                menu_label TEXT NOT NULL,
                menu_category TEXT DEFAULT 'sidebar',
                menu_icon TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS ojt_role_menu_permissions (
                role_id TEXT NOT NULL,
                menu_id TEXT NOT NULL,
                can_view INTEGER DEFAULT 1,
                can_edit INTEGER DEFAULT 0,
                PRIMARY KEY (role_id, menu_id),
                FOREIGN KEY (role_id) REFERENCES ojt_roles(role_id) ON DELETE CASCADE,
                FOREIGN KEY (menu_id) REFERENCES ojt_menus(menu_id) ON DELETE CASCADE
            );
            """)

            conn.commit()

    def _hash_pin(self, pin: str) -> str:
        return hashlib.sha256(pin.encode('utf-8')).hexdigest()

    def seed_initial_data(self):
        with self.get_connection() as conn:
            users = [
                ("usr_jake", "jake", self._hash_pin("password123"), "123456", "นายนิติพัฒน์ คุ้มวงษ์", "พี่เจค", "trainee", "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร", "cohort_gov_pwd_r1", "sup_pm_it", "นักวิชาการคอมพิวเตอร์"),
                ("usr_may", "may", self._hash_pin("password123"), "111111", "นางสาวกานดา นวลจันทร์", "น้องเมย์", "trainee", "กองพัฒนาระบบสารบรรณ", "cohort_gov_pwd_r1", "sup_saraban", "เจ้าพนักงานธุรการปฏิบัติงาน"),
                ("usr_non", "non", self._hash_pin("password123"), "222222", "นายอานนท์ ภักดีสุข", "น้องนนท์", "trainee", "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร", "cohort_gov_pwd_r1", "sup_pm_it", "โปรแกรมเมอร์ปฏิบัติงาน"),
                ("usr_tum", "tum", self._hash_pin("password123"), "333333", "นายวิทวัส สายสมบูรณ์", "พี่ตั้ม", "trainee", "กองพัฒนาระบบสารบรรณ", "cohort_gov_pwd_r1", "sup_saraban", "นักวิชาการจัดการงานทั่วไป"),
                ("sup_pm_it", "pm_it", self._hash_pin("password123"), "999999", "นางสาวชนินาถ วิจิตรไพฑูรณ์ (พี่ใหญ่ PM)", "พี่ใหญ่ PM", "supervisor", "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร", "cohort_gov_pwd_r1", None, "นักวิชาการคอมพิวเตอร์ชำนาญการ"),
                ("sup_saraban", "head_saraban", self._hash_pin("password123"), "888888", "นางพิมพ์ใจ เจริญพร", "ผอ.พิมพ์ใจ", "supervisor", "กองพัฒนาระบบสารบรรณ", "cohort_gov_pwd_r1", None, "ผู้อำนวยการกลุ่มงานสารบรรณ"),
                ("usr_admin", "admin", self._hash_pin("password123"), "000000", "นายพิชัย ยืนยงเกียรติ", "แอดมินกลาง", "admin", "กลุ่มพัฒนาระบบบริหาร", "cohort_gov_pwd_r1", None, "ผู้ดูแลระบบศูนย์กลาง")
            ]

            for u in users:
                conn.execute("""
                INSERT OR IGNORE INTO ojt_users (
                    user_id, username, password_hash, pin_code, full_name, nickname,
                    role, department, cohort_id, assigned_supervisor_id, position_title
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, u)

            existing_act = conn.execute("SELECT COUNT(*) as cnt FROM ojt_activities WHERE trainee_id = 'usr_jake'").fetchone()
            if existing_act["cnt"] == 0:
                demo_activities = [
                    (
                        "usr_jake", "1 กันยายน 2569", "จันทร์", 1,
                        "วิเคราะห์ชุดข้อมูลสารสนเทศโครงการ ด้วย PivotTable และคำนวณ Score Gain (+76.7%)",
                        6.0, 6.0, "DIG-01",
                        "1. Clean Data ข้อมูลโครงการด้วย Remove Duplicates & TRIM\n2. เขียนสูตร Score Gain = Post_Score - Pre_Score และ XLOOKUP ผูกรหัสหลักสูตร\n3. สร้าง PivotTable สรุปอัตราได้งาน 62.0% และเงินเดือนเฉลี่ย 18,500 บาท",
                        "Microsoft Excel 365, Power Query, Google Sheets",
                        "ข้อมูลตัวเลขวันที่ไม่อยู่ในมาตรฐาน ISO แก้ไขโดยใช้ฟังก์ชัน DATEVALUE",
                        "ตรวจไม่พบข้อมูลส่วนบุคคลที่มีความอ่อนไหว",
                        "ทำความสะอาดข้อมูลโครงการ 500 แถวด้วย Excel วิเคราะห์อัตราการมีงานทำ"
                    ),
                    (
                        "usr_jake", "2 กันยายน 2569", "อังคาร", 1,
                        "ออกแบบและพัฒนา Dashboard วิเคราะห์สถิติผู้พิการด้วย Slicer และ Interactive Charts",
                        6.0, 12.0, "ANL-02",
                        "1. วางโครงสร้าง Layout Dashboard ตามหลัก Human-Centered Design\n2. ผูก Slicer จำแนกตามประเภทความพิการ 7 ด้าน และช่วงอายุ\n3. ออกแบบการ์ดสรุป KPIs รายได้เฉลี่ยและการบรรจุงาน",
                        "Excel Dashboard, Figma, SVG Icons",
                        "กราฟแสดงผลหน่วงเมื่อเลือก Slicer หลายตัวพร้อมกัน ทำการลดทอนภาพกราฟิกพื้นหลัง",
                        "ข้อมูลชื่อผู้เข้าร่วมโครงการถูกสุ่มรหัส Masking แทนชื่อจริง",
                        "สร้าง Dashboard สรุปผลงานด้วย Excel สไลเซอร์แบบอินเทอร์แอคทีฟ"
                    ),
                    (
                        "usr_jake", "3 กันยายน 2569", "พุธ", 1,
                        "จัดทำรายงานการบริหารโครงการ Project Canvas (12 ขั้นตอน) และบทสรุปผู้บริหาร",
                        6.0, 18.0, "GOV-03",
                        "1. ประมวลผลลัพธ์ Sprint ที่ 1-2 สรุปเข้าผืนผ้าใบ Project Canvas 6 ช่อง\n2. ร่างบทสรุปสำหรับผู้บริหาร (Executive Summary) ตามระเบียบงานสารบรรณ\n3. จัดหมวดหมู่ RACI Matrix เพื่อระบุผู้รับผิดชอบงานไอที",
                        "Project Canvas, Google Docs, e-Saraban template",
                        "ไม่พบปัญหาอุปสรรค การประสานงานกับกลุ่มเป้าหมายราบรื่น",
                        "เบอร์โทรศัพท์และอีเมลผู้ติดต่อประสานงานถูกเซ็นเซอร์เรียบร้อย",
                        "เขียนรายงานสรุปโครงการ 12 ขั้นตอนและร่าง Canvas สำหรับเสนอผู้บริหาร"
                    ),
                    (
                        "usr_jake", "4 กันยายน 2569", "พฤหัสบดี", 1,
                        "ตรวจสอบความมั่นคงปลอดภัยสารสนเทศ สแกน Audit Log และทดสอบการส่งออกเอกสาร A4",
                        6.0, 24.0, "SEC-04",
                        "1. ตรวจสอบสิทธิ์การเข้าถึงแบบ Role-Based Access Control (RBAC)\n2. ทดสอบระบบความปลอดภัย PDPA Sanitizer ปิดบังเลขบัตรประชาชนและเบอร์โทร\n3. ทดสอบการพิมพ์เอกสาร A4 ไม่ตกขอบกระดาษตามมาตรฐานงานพิมพ์ราชการ",
                        "Chrome DevTools, CSS @media print, SQLite WAL",
                        "หน้าพิมพ์ A4 บน Safari มีระยะขอบเพี้ยนเล็กน้อย ทำการปรับ @page margin เป็น 7mm 10mm",
                        "ผ่านเกณฑ์ความมั่นคงปลอดภัย PDPA Double-Shield 100%",
                        "ทดสอบระบบความปลอดภัยสารสนเทศและตรวจสอบ Layout สำหรับสั่งพิมพ์ A4"
                    )
                ]

                for act in demo_activities:
                    conn.execute("""
                    INSERT INTO ojt_activities (
                        trainee_id, activity_date, day_name, week_number, activity_title,
                        hours, cumulative_hours, competency_code, sop_procedure,
                        tools_used, problems_and_solutions, pdpa_redaction_notes, raw_input
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, act)

            existing_memo = conn.execute("SELECT COUNT(*) as cnt FROM ojt_memos WHERE trainee_id = 'usr_jake' AND week_number = 1").fetchone()
            if existing_memo["cnt"] == 0:
                conn.execute("""
                INSERT INTO ojt_memos (
                    trainee_id, week_number, department, doc_number, memo_date,
                    subject, origin_section, facts_section, consideration_section, signatory_title
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    "usr_jake", 1,
                    "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สำนักงานปลัดกระทรวงยุติธรรม",
                    "ยธ ๐๒๐๔/ว-พิเศษ ๐๑",
                    "๔ กันยายน ๒๕๖๙",
                    "ขออนุมัติและรายงานผลการปฏิบัติงานตามโครงการ On-the-Job Training (OJT 90 ชม.) สัปดาห์ที่ ๑",
                    "ตามที่ข้าพเจ้า นายนิติพัฒน์ คุ้มวงษ์ ได้รับมอบหมายให้เข้ารับการฝึกปฏิบัติงานตามโครงการเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ ประจำปีงบประมาณ พ.ศ. ๒๕๖๙ นั้น",
                    "บัดนี้ ข้าพเจ้าได้ปฏิบัติงานประจำสัปดาห์ที่ ๑ ระหว่างวันที่ ๑ - ๔ กันยายน ๒๕๖๙ รวมชั่วโมงปฏิบัติงานสะสมทั้งสิ้น ๒๔.๐ ชั่วโมง โดยได้ดำเนินการวิเคราะห์ข้อมูลสารสนเทศโครงการด้วย PivotTable, พัฒนา Executive Dashboard, จัดทำ Project Canvas และทดสอบระบบความปลอดภัยสารสนเทศตามมาตรฐาน PDPA เรียบร้อยแล้ว",
                    "จึงเรียนมาเพื่อโปรดทราบ และโปรดพิจารณาลงนามรับรองผลการปฏิบัติงานประจำสัปดาห์ที่ ๑ ในระบบลายมือชื่อดิจิทัลต่อไป",
                    "นายนิติพัฒน์ คุ้มวงษ์ (ผู้ฝึกภาคปฏิบัติ / นักวิชาการคอมพิวเตอร์)"
                ))

            existing_eval = conn.execute("SELECT COUNT(*) as cnt FROM ojt_evaluations WHERE trainee_id = 'usr_jake' AND week_number = 1").fetchone()
            if existing_eval["cnt"] == 0:
                conn.execute("""
                INSERT INTO ojt_evaluations (
                    trainee_id, week_number, supervisor_id, supervisor_name,
                    supervisor_comment, suggested_score, development_advice, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    "usr_jake", 1, "sup_pm_it", "นางสาวชนินาถ วิจิตรไพฑูรณ์ (พี่ใหญ่ PM)",
                    "ผู้รับการฝึกมีความกระตือรือร้นสูงมาก เชี่ยวชาญการประมวลผลข้อมูลและนำเทคโนโลยีสารสนเทศมาปรับปรุงระบบงานได้อย่างมีประสิทธิภาพ",
                    5, "รักษามาตรฐานการทำงานและนำเสนอผลงานในสัปดาห์ถัดไปอย่างต่อเนื่อง", "approved"
                ))

            existing_canvas = conn.execute("SELECT COUNT(*) as cnt FROM ojt_project_canvas WHERE trainee_id = 'usr_jake'").fetchone()
            if existing_canvas["cnt"] == 0:
                steps_data = [
                    {"step": 1, "name": "สำรวจและวิเคราะห์ปัญหา (Problem Discovery)", "kpi": "รายงานวิเคราะห์ปัญหา 1 ฉบับ", "status": "เสร็จสิ้น (100%)"},
                    {"step": 2, "name": "ออกแบบสถาปัตยกรรมระบบ (System Architecture)", "kpi": "พิมพ์เขียวระบบและ ER-Diagram", "status": "เสร็จสิ้น (100%)"},
                    {"step": 3, "name": "พัฒนาระบบบันทึก OJT (Smart Logbook)", "kpi": "ระบบบันทึกเวลาสะสม 90 ชม.", "status": "เสร็จสิ้น (100%)"},
                    {"step": 4, "name": "ผสานโมเดล AI ขัดเกลาภาษา (AI Polish)", "kpi": "สูตร Prompt R-C-T-F ภาครัฐ", "status": "เสร็จสิ้น (100%)"},
                    {"step": 5, "name": "ติดตั้งเกราะป้องกันข้อมูล (PDPA Double-Shield)", "kpi": "สแกนและเซ็นเซอร์ข้อมูลอ่อนไหว 100%", "status": "เสร็จสิ้น (100%)"},
                    {"step": 6, "name": "พัฒนา A4 Paper Simulator & Print", "kpi": "พิมพ์เอกสาร A4 คมชัดไม่ตกขอบ", "status": "เสร็จสิ้น (100%)"}
                ]
                conn.execute("""
                INSERT INTO ojt_project_canvas (
                    trainee_id, project_title, executive_summary, problem_statement,
                    solution_statement, target_groups, sprints_plan, key_metrics,
                    raci_matrix, steps_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    "usr_jake",
                    "โครงการพัฒนาระบบ Smart GovReport Hub สำหรับรายงาน OJT 90 ชม. และระบบสารบรรณดิจิทัล",
                    "โครงการนี้จัดทำขึ้นเพื่อยกระดับขีดความสามารถของบุคลากรภาครัฐผู้พิการตามกรอบ 7 ทักษะดิจิทัล และการทำงานแบบ Agile โดยประยุกต์ใช้ระบบคลังผลงานดิจิทัล (e-Portfolio & Analytics) ในการเก็บข้อมูลผลการฝึกงาน OJT 90 ชั่วโมง และการวิเคราะห์ข้อมูลสารสารสนเทศโครงการ",
                    "การรายงานผลจ้างงานคนพิการเดิมมีความซ้ำซ้อน เอกสารกระดาษสูญหายง่าย ขาดระบบจัดเก็บสมรรถนะดิจิทัล",
                    "พัฒนา Web App สำหรับบันทึก OJT และสร้างเล่ม Portfolio มาตรฐานภาครัฐในไฟล์เดียว",
                    "ผู้เข้าอบรมคนพิการรุ่นที่ 1, หัวหน้างานฝ่ายสารบรรณ/ไอที และคณะกรรมการประเมินผล",
                    "Sprint 1: ออกแบบ UI/UX, Sprint 2: พัฒนาระบบบันทึก OJT & AI Polish, Sprint 3: ทดสอบ Accessibility",
                    "ชั่วโมงฝึกงานครบ 90 ชม. (100%), อัตราความพึงพอใจ > 92%, ผ่านเกณฑ์ WCAG 2.1 AA",
                    "R: คุณเจค (IT Dev), A: ผอ.กลุ่มงาน, C: วิทยากร BDI/ก.พ.ร., I: ผู้เข้าอบรมรุ่น 1",
                    json.dumps(steps_data, ensure_ascii=False)
                ))

            existing_portfolio = conn.execute("SELECT COUNT(*) as cnt FROM ojt_portfolios WHERE trainee_id = 'usr_jake'").fetchone()
            if existing_portfolio["cnt"] == 0:
                exps = [
                    {"period": "2556 - ปัจจุบัน", "role": "ผู้เชี่ยวชาญด้าน IT & การบริหารคลังข้อมูลสารสนเทศ", "org": "หน่วยงานภาครัฐและเอกชน", "desc": "ดูแลระบบ Server, Network, ฐานข้อมูล และพัฒนานวัตกรรมรายงานผลอัตโนมัติ"},
                    {"period": "2553 - 2556", "role": "นักพัฒนาซอฟต์แวร์และผู้ดูแลระบบฐานข้อมูล", "org": "บริษัทเทคโนโลยีสารสนเทศ", "desc": "ออกแบบและบำรุงรักษาระบบฐานข้อมูลระดับองค์กร และประสานงานเทคนิค"}
                ]
                skills = ["Microsoft Excel (Pivot/PowerQuery)", "FastAPI / Python", "SQL / Database Admin", "e-Saraban & ThaiD", "PDPA Compliance", "Prompt Engineering (R-C-T-F)"]
                conn.execute("""
                INSERT INTO ojt_portfolios (
                    trainee_id, headline, work_vision, experience_summary, experiences_json, skills_json
                ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    "usr_jake",
                    "ผู้เชี่ยวชาญระบบเทคโนโลยีสารสนเทศ การบริหารฐานข้อมูล และเครือข่ายคอมพิวเตอร์ (ประสบการณ์ 13 ปี)",
                    "มุ่งมั่นนำทักษะและความเชี่ยวชาญด้านไอทีตลอด 13 ปี มาร่วมขับเคลื่อนและพัฒนาระบบดิจิทัลของหน่วยงานภาครัฐ เพิ่มประสิทธิภาพการบริการประชาชนอย่างไร้รอยต่อ และสร้างระบบงานสารบรรณอิเล็กทรอนิกส์ที่ปลอดภัย โปร่งใส และทุกคนเข้าถึงได้อย่างเท่าเทียม",
                    "ประสบการณ์การทำงานสายเทคโนโลยีสารสนเทศและการบริหารฐานข้อมูลภาครัฐรวม 13 ปี",
                    json.dumps(exps, ensure_ascii=False),
                    json.dumps(skills, ensure_ascii=False)
                ))

            # --- Seed RBAC Roles, Menus, Permissions ---
            roles_seed = [
                ("admin", "ผู้ดูแลระบบ/ผู้บริหาร (Admin Superuser)"),
                ("supervisor", "ผู้ควบคุมงาน/พี่เลี้ยง (Supervisor/Mentor)"),
                ("trainee", "ผู้ฝึกปฏิบัติงาน (Trainee)")
            ]
            for r in roles_seed:
                conn.execute("INSERT OR IGNORE INTO ojt_roles (role_id, role_name) VALUES (?, ?)", r)

            menus_seed = [
                ("m_dash", "dashboard", "แดชบอร์ดภาพรวมรายงาน", "sidebar", "fa-solid fa-chart-pie", 1),
                ("m_log", "ojt-log", "สมุดบันทึกการฝึกภาคปฏิบัติ", "sidebar", "fa-solid fa-book-bookmark", 2),
                ("m_proj", "project-summary", "รายงานบริหารโครงการ", "sidebar", "fa-solid fa-diagram-project", 3),
                ("m_memo", "official-memo", "บันทึกข้อความราชการ", "sidebar", "fa-solid fa-stamp", 4),
                ("m_port", "portfolio-report", "รายงานสมรรถนะ Portfolio", "sidebar", "fa-solid fa-award", 5),
                ("m_audit", "audit-console", "ศูนย์ตรวจสอบประวัติระบบ", "sidebar", "fa-solid fa-terminal", 6),
                ("m_ai_polish", "ai-polish", "AI Polish ขัดเกลาภาษาราชการ", "widget", "fa-solid fa-wand-magic-sparkles", 7),
                ("m_backup_json", "backup-json", "สำรองข้อมูล JSON", "toolbar", "fa-solid fa-file-arrow-down", 8)
            ]
            for m in menus_seed:
                conn.execute("""
                INSERT OR IGNORE INTO ojt_menus (menu_id, module_key, menu_label, menu_category, menu_icon, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
                """, m)

            # Default Role Permissions Matrix
            # Admin: all visible & editable
            # Supervisor: all visible & editable except audit (view only)
            # Trainee: hides dashboard, audit-console, backup-json
            default_permissions = [
                # ADMIN
                ("admin", "m_dash", 1, 1),
                ("admin", "m_log", 1, 1),
                ("admin", "m_proj", 1, 1),
                ("admin", "m_memo", 1, 1),
                ("admin", "m_port", 1, 1),
                ("admin", "m_audit", 1, 1),
                ("admin", "m_ai_polish", 1, 1),
                ("admin", "m_backup_json", 1, 1),
                # SUPERVISOR
                ("supervisor", "m_dash", 1, 0),
                ("supervisor", "m_log", 1, 1),
                ("supervisor", "m_proj", 1, 1),
                ("supervisor", "m_memo", 1, 1),
                ("supervisor", "m_port", 1, 1),
                ("supervisor", "m_audit", 1, 0),
                ("supervisor", "m_ai_polish", 1, 1),
                ("supervisor", "m_backup_json", 1, 1),
                # TRAINEE
                ("trainee", "m_dash", 0, 0),
                ("trainee", "m_log", 1, 1),
                ("trainee", "m_proj", 1, 1),
                ("trainee", "m_memo", 1, 1),
                ("trainee", "m_port", 1, 0),
                ("trainee", "m_audit", 0, 0),
                ("trainee", "m_ai_polish", 1, 1),
                ("trainee", "m_backup_json", 0, 0)
            ]
            for p in default_permissions:
                conn.execute("""
                INSERT OR IGNORE INTO ojt_role_menu_permissions (role_id, menu_id, can_view, can_edit)
                VALUES (?, ?, ?, ?)
                """, p)

            conn.commit()

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM ojt_users WHERE user_id = ?", (user_id,)).fetchone()
            return dict(row) if row else None

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM ojt_users WHERE username = ?", (username,)).fetchone()
            return dict(row) if row else None

    def get_user_by_pin(self, pin: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM ojt_users WHERE pin_code = ?", (pin,)).fetchone()
            return dict(row) if row else None

    def list_all_users(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT user_id, username, full_name, nickname, role, department, position_title, assigned_supervisor_id FROM ojt_users ORDER BY role DESC, full_name ASC").fetchall()
            return [dict(r) for r in rows]

    def list_trainees_for_supervisor(self, supervisor_id: str) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("""
                SELECT user_id, username, full_name, nickname, role, department, position_title
                FROM ojt_users
                WHERE role = 'trainee' AND (assigned_supervisor_id = ? OR ? IS NULL)
                ORDER BY full_name ASC
            """, (supervisor_id, supervisor_id)).fetchall()
            return [dict(r) for r in rows]

    def get_latest_cumulative_hours(self, trainee_id: str) -> float:
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT cumulative_hours FROM ojt_activities WHERE trainee_id = ? ORDER BY id DESC LIMIT 1", (trainee_id,))
            row = cursor.fetchone()
            return float(row["cumulative_hours"]) if row else 0.0

    def insert_activity_for_trainee(
        self,
        trainee_id: str,
        activity: OJTActivityRecord,
        activity_date: str,
        day_name: str,
        week_number: int = 1,
        raw_input: str = ""
    ) -> int:
        current_cumulative = self.get_latest_cumulative_hours(trainee_id)
        new_cumulative = round(current_cumulative + activity.hours, 1)

        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO ojt_activities (
                    trainee_id, activity_date, day_name, week_number, activity_title,
                    hours, cumulative_hours, competency_code, sop_procedure,
                    tools_used, problems_and_solutions, pdpa_redaction_notes,
                    raw_input
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trainee_id, activity_date, day_name, week_number, activity.activity_title,
                activity.hours, new_cumulative, activity.competency_code,
                activity.sop_procedure, activity.tools_used,
                activity.problems_and_solutions, activity.pdpa_redaction_notes,
                raw_input
            ))
            conn.commit()
            return cursor.lastrowid

    def update_activity(
        self,
        activity_id: int,
        trainee_id: str,
        activity_date: str,
        day_name: str,
        activity_title: str,
        hours: float,
        competency_code: str,
        sop_procedure: str,
        tools_used: str,
        problems_and_solutions: str
    ) -> bool:
        with self.get_connection() as conn:
            conn.execute("""
                UPDATE ojt_activities SET
                    activity_date = ?, day_name = ?, activity_title = ?, hours = ?,
                    competency_code = ?, sop_procedure = ?, tools_used = ?, problems_and_solutions = ?
                WHERE id = ? AND trainee_id = ?
            """, (
                activity_date, day_name, activity_title, hours,
                competency_code, sop_procedure, tools_used, problems_and_solutions,
                activity_id, trainee_id
            ))
            self._recalculate_cumulative(conn, trainee_id)
            conn.commit()
            return True

    def delete_activity(self, activity_id: int, trainee_id: str) -> bool:
        with self.get_connection() as conn:
            conn.execute("DELETE FROM ojt_activities WHERE id = ? AND trainee_id = ?", (activity_id, trainee_id))
            self._recalculate_cumulative(conn, trainee_id)
            conn.commit()
            return True

    def _recalculate_cumulative(self, conn: sqlite3.Connection, trainee_id: str):
        conn.execute("""
            WITH calculated AS (
                SELECT id, SUM(hours) OVER (
                    ORDER BY id ASC
                ) as new_cumulative
                FROM ojt_activities
                WHERE trainee_id = ?
            )
            UPDATE ojt_activities
            SET cumulative_hours = (
                SELECT ROUND(new_cumulative, 1) 
                FROM calculated 
                WHERE calculated.id = ojt_activities.id
            )
            WHERE trainee_id = ?;
        """, (trainee_id, trainee_id))

    def get_all_activities(self, trainee_id: str) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM ojt_activities WHERE trainee_id = ? ORDER BY id ASC", (trainee_id,)).fetchall()
            return [dict(r) for r in rows]

    def get_activities_by_week(self, trainee_id: str = "usr_jake", week_number: int = 1) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM ojt_activities WHERE trainee_id = ? AND week_number = ? ORDER BY id ASC", (trainee_id, week_number)).fetchall()
            return [dict(r) for r in rows]

    # Backwards-compatible aliases for single-tenant scripts
    def insert_activity(self, activity: OJTActivityRecord, activity_date: str, day_name: str, week_number: int = 1, raw_input: str = "", trainee_id: str = "usr_jake") -> int:
        return self.insert_activity_for_trainee(trainee_id, activity, activity_date, day_name, week_number, raw_input)

    def insert_memo(self, memo: OfficialMemoRecord, week_number: int = 1, trainee_id: str = "usr_jake") -> int:
        return self.upsert_memo(trainee_id, week_number, memo)

    def insert_evaluation(self, eval_rec: SupervisorFeedbackRecord, week_number: int = 1, supervisor_id: str = "sup_pm_it", supervisor_name: str = "พี่ใหญ่ PM (5.1)", trainee_id: str = "usr_jake") -> int:
        return self.save_evaluation(trainee_id, week_number, supervisor_id, supervisor_name, eval_rec)

    def get_progress_summary(self, trainee_id: str, target_hours: float = 90.0) -> Dict[str, Any]:
        total_logged = self.get_latest_cumulative_hours(trainee_id)
        pct = min(100.0, round((total_logged / target_hours) * 100, 1)) if target_hours > 0 else 0
        remaining = max(0.0, round(target_hours - total_logged, 1))
        return {
            "target_hours": target_hours,
            "completed_hours": total_logged,
            "remaining_hours": remaining,
            "progress_percent": pct
        }

    def get_memo_by_week(self, trainee_id: str, week_number: int) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM ojt_memos WHERE trainee_id = ? AND week_number = ? ORDER BY id DESC LIMIT 1", (trainee_id, week_number)).fetchone()
            return dict(row) if row else None

    def upsert_memo(self, trainee_id: str, week_number: int, memo: OfficialMemoRecord) -> int:
        with self.get_connection() as conn:
            existing = conn.execute("SELECT id FROM ojt_memos WHERE trainee_id = ? AND week_number = ?", (trainee_id, week_number)).fetchone()
            if existing:
                conn.execute("""
                    UPDATE ojt_memos SET
                        department = ?, doc_number = ?, memo_date = ?, subject = ?,
                        origin_section = ?, facts_section = ?, consideration_section = ?,
                        signatory_title = ?
                    WHERE id = ?
                """, (
                    memo.department, memo.doc_number, memo.date_str, memo.subject,
                    memo.origin_section, memo.facts_section, memo.consideration_section,
                    memo.signatory_title, existing["id"]
                ))
                memo_id = existing["id"]
            else:
                cursor = conn.execute("""
                    INSERT INTO ojt_memos (
                        trainee_id, week_number, department, doc_number, memo_date,
                        subject, origin_section, facts_section, consideration_section, signatory_title
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    trainee_id, week_number, memo.department, memo.doc_number, memo.date_str,
                    memo.subject, memo.origin_section, memo.facts_section,
                    memo.consideration_section, memo.signatory_title
                ))
                memo_id = cursor.lastrowid
            conn.commit()
            return memo_id

    def get_evaluation_by_week(self, trainee_id: str, week_number: int) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM ojt_evaluations WHERE trainee_id = ? AND week_number = ? ORDER BY id DESC LIMIT 1", (trainee_id, week_number)).fetchone()
            return dict(row) if row else None

    def save_evaluation(self, trainee_id: str, week_number: int, supervisor_id: str, supervisor_name: str, eval_rec: SupervisorFeedbackRecord) -> int:
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT OR REPLACE INTO ojt_evaluations (
                    trainee_id, week_number, supervisor_id, supervisor_name,
                    supervisor_comment, suggested_score, development_advice, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
            """, (
                trainee_id, week_number, supervisor_id, supervisor_name,
                eval_rec.supervisor_comment, eval_rec.suggested_score, eval_rec.development_advice
            ))
            conn.commit()
            return cursor.lastrowid

    def save_signature(self, trainee_id: str, week_number: int, signer_id: str, signer_name: str, role: str, image_base64: str, pin: str) -> int:
        pin_hash = self._hash_pin(pin)
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO ojt_signatures (
                    trainee_id, week_number, signer_id, signer_name, role,
                    signature_image_base64, signed_pin_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                trainee_id, week_number, signer_id, signer_name, role,
                image_base64, pin_hash
            ))
            conn.commit()
            return cursor.lastrowid

    def get_signatures_by_week(self, trainee_id: str, week_number: int) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM ojt_signatures WHERE trainee_id = ? AND week_number = ? ORDER BY id DESC", (trainee_id, week_number)).fetchall()
            return [dict(r) for r in rows]

    def record_pdpa_consent(self, user_id: str, policy_version: str, consent_status: bool, agreed_purposes: List[str], signature_hash: str, ip: str = "", user_agent: str = "") -> int:
        purposes_str = json.dumps(agreed_purposes, ensure_ascii=False)
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO ojt_pdpa_consents (
                    user_id, policy_version, consent_status, agreed_purposes,
                    signature_hash, ip_address, user_agent
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, policy_version, 1 if consent_status else 0,
                purposes_str, signature_hash, ip, user_agent
            ))
            conn.commit()
            consent_id = cursor.lastrowid

        audit_entry = {
            "timestamp": datetime.now().isoformat(),
            "event": "PDPA_CONSENT_RECORDED",
            "consent_id": consent_id,
            "user_id": user_id,
            "policy_version": policy_version,
            "consent_status": consent_status,
            "agreed_purposes": agreed_purposes,
            "signature_hash": signature_hash,
            "ip": ip,
            "user_agent": user_agent
        }
        try:
            with open(self.audit_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(audit_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"⚠️ Audit Log write error: {e}")

        return consent_id

    def get_latest_pdpa_consent(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM ojt_pdpa_consents WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,)).fetchone()
            if row:
                d = dict(row)
                d["agreed_purposes"] = json.loads(d["agreed_purposes"]) if d["agreed_purposes"] else []
                return d
            return None

    def get_project_canvas(self, trainee_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM ojt_project_canvas WHERE trainee_id = ?", (trainee_id,)).fetchone()
            if row:
                d = dict(row)
                d["steps"] = json.loads(d["steps_json"]) if d["steps_json"] else []
                return d
            return None

    def update_project_canvas(self, trainee_id: str, data: Dict[str, Any]) -> bool:
        steps_json = json.dumps(data.get("steps", []), ensure_ascii=False)
        with self.get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO ojt_project_canvas (
                    trainee_id, project_title, executive_summary, problem_statement,
                    solution_statement, target_groups, sprints_plan, key_metrics,
                    raci_matrix, steps_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                trainee_id, data.get("project_title", ""), data.get("executive_summary", ""),
                data.get("problem_statement", ""), data.get("solution_statement", ""),
                data.get("target_groups", ""), data.get("sprints_plan", ""),
                data.get("key_metrics", ""), data.get("raci_matrix", ""),
                steps_json
            ))
            conn.commit()
            return True

    def get_portfolio(self, trainee_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM ojt_portfolios WHERE trainee_id = ?", (trainee_id,)).fetchone()
            if row:
                d = dict(row)
                d["experiences"] = json.loads(d["experiences_json"]) if d["experiences_json"] else []
                d["skills"] = json.loads(d["skills_json"]) if d["skills_json"] else []
                return d
            return None

    def export_all_data_for_sync(self, trainee_id: str) -> Dict[str, Any]:
        user = self.get_user_by_id(trainee_id)
        activities = self.get_all_activities(trainee_id)
        progress = self.get_progress_summary(trainee_id)
        canvas = self.get_project_canvas(trainee_id)
        portfolio = self.get_portfolio(trainee_id)
        memo = self.get_memo_by_week(trainee_id, 1)
        evaluation = self.get_evaluation_by_week(trainee_id, 1)

        return {
            "sync_version": "2.0-2026",
            "exported_at": datetime.now().isoformat(),
            "trainee": user,
            "progress": progress,
            "activities_count": len(activities),
            "activities": activities,
            "project_canvas": canvas,
            "portfolio": portfolio,
            "weekly_memos": [memo] if memo else [],
            "evaluations": [evaluation] if evaluation else []
        }

    def create_user(
        self,
        full_name: str,
        pin_code: str,
        role: str = "trainee",
        department: str = "ศูนย์เทคโนโลยีสารสนเทศ",
        nickname: str = "",
        position_title: str = "ผู้ฝึกปฏิบัติงาน",
        assigned_supervisor_id: Optional[str] = "sup_pm_it"
    ) -> Dict[str, Any]:
        import time
        clean_name = full_name.strip()
        user_id = f"usr_{int(time.time())}"
        username = f"user_{pin_code}"
        pass_hash = self._hash_pin("password123")

        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO ojt_users (
                    user_id, username, password_hash, pin_code, full_name, nickname,
                    role, department, cohort_id, assigned_supervisor_id, position_title
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, username, pass_hash, pin_code, clean_name, nickname or clean_name.split()[0],
                role, department, "cohort_gov_pwd_r1", assigned_supervisor_id, position_title
            ))
            conn.commit()

        return self.get_user_by_id(user_id)

    def log_audit_event(
        self,
        event_category: str,
        event_name: str,
        severity: str = "INFO",
        user_id: Optional[str] = None,
        username: Optional[str] = None,
        user_role: Optional[str] = None,
        target_resource: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        บันทึกประวัติเหตุการณ์คู่ขนาน (Dual Engine):
        1. ตาราง SQLite `ojt_audit_logs` สำหรับ Query/Filter หน้า Console แบบ Real-time
        2. ไฟล์ Append-only `logs/backend_audit.jsonl` ป้องกันการแก้ไข (Tamper-proof)
        """
        ts = datetime.now().isoformat()
        details_str = json.dumps(details, ensure_ascii=False) if details is not None else "{}"

        # 1. บันทึกลง SQLite
        with self.get_connection() as conn:
            cur = conn.execute("""
                INSERT INTO ojt_audit_logs (
                    timestamp, user_id, username, user_role,
                    event_category, event_name, severity,
                    target_resource, ip_address, user_agent, details_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ts, user_id, username, user_role,
                event_category, event_name, severity,
                target_resource, ip_address, user_agent, details_str
            ))
            conn.commit()
            log_id = cur.lastrowid

        # 2. บันทึก Append-only ลง JSONL
        audit_record = {
            "log_id": log_id,
            "timestamp": ts,
            "user_id": user_id,
            "username": username,
            "user_role": user_role,
            "event_category": event_category,
            "event_name": event_name,
            "severity": severity,
            "target_resource": target_resource,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "details": details or {}
        }
        try:
            with open(self.backend_audit_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(audit_record, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"⚠️ Backend Audit Log append error: {e}")

        return log_id

    def get_audit_logs(
        self,
        limit: int = 100,
        offset: int = 0,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        user_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = "SELECT * FROM ojt_audit_logs WHERE 1=1"
        params = []

        if category and category.upper() != "ALL":
            query += " AND event_category = ?"
            params.append(category.upper())

        if severity and severity.upper() != "ALL":
            query += " AND severity = ?"
            params.append(severity.upper())

        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)

        if search:
            s = f"%{search.strip()}%"
            query += " AND (event_name LIKE ? OR details_json LIKE ? OR target_resource LIKE ? OR username LIKE ? OR ip_address LIKE ?)"
            params.extend([s, s, s, s, s])

        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        with self.get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            logs = []
            for r in rows:
                item = dict(r)
                try:
                    item["details"] = json.loads(item["details_json"]) if item["details_json"] else {}
                except Exception:
                    item["details"] = {}
                logs.append(item)
            return logs

    def get_audit_stats(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            total_logs = conn.execute("SELECT COUNT(*) as c FROM ojt_audit_logs").fetchone()["c"]
            security_alerts = conn.execute("SELECT COUNT(*) as c FROM ojt_audit_logs WHERE severity IN ('ALERT', 'ERROR', 'WARN')").fetchone()["c"]
            data_mutations = conn.execute("SELECT COUNT(*) as c FROM ojt_audit_logs WHERE event_category = 'DATA_MUTATION'").fetchone()["c"]
            auth_events = conn.execute("SELECT COUNT(*) as c FROM ojt_audit_logs WHERE event_category = 'AUTH'").fetchone()["c"]
            unique_users = conn.execute("SELECT COUNT(DISTINCT user_id) as c FROM ojt_audit_logs WHERE user_id IS NOT NULL").fetchone()["c"]

            return {
                "total_logs": total_logs,
                "security_alerts": security_alerts,
                "data_mutations": data_mutations,
                "auth_events": auth_events,
                "unique_users": unique_users
            }

    def seed_audit_demo_logs(self):
        try:
            with self.get_connection() as conn:
                cnt = conn.execute("SELECT COUNT(*) as c FROM ojt_audit_logs").fetchone()["c"]
                if cnt > 0:
                    return
        except Exception:
            return

        demo_events = [
            ("AUTH", "LOGIN_SUCCESS", "SUCCESS", "usr_jake", "jake", "trainee", "session_auth", "192.168.1.45", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", {"auth_method": "PIN", "pin_masked": "******", "message": "เข้าสู่ระบบสำเร็จผ่าน PIN ผู้ฝึกงาน"}),
            ("DATA_MUTATION", "ACTIVITY_CREATE", "INFO", "usr_jake", "jake", "trainee", "act_001", "192.168.1.45", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", {"week": 1, "day": "จันทร์", "hours": 6.0, "title": "วิเคราะห์ชุดข้อมูลสารสนเทศโครงการ ด้วย PivotTable", "competency": "DIG-01"}),
            ("DATA_MUTATION", "AI_POLISH_REQUEST", "INFO", "usr_jake", "jake", "trainee", "ai_polisher", "192.168.1.45", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", {"mode": "formal", "prompt_len": 84, "model": "gemini-2.5-flash"}),
            ("SECURITY", "BOLA_BLOCKED", "ALERT", "usr_non", "non", "trainee", "trainee_usr_jake", "192.168.1.88", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", {"violation": "BOLA / IDOR Violation", "attempted_target": "usr_jake", "blocked_reason": "ผู้ฝึกงานไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของผู้ฝึกงานท่านอื่น"}),
            ("SIGNATURE", "DUAL_SIGNATURE_STAMP", "SUCCESS", "sup_pm_it", "pm_it", "supervisor", "signature_w1", "192.168.1.12", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", {"week": 1, "signer_role": "supervisor", "signature_hash": "a8fbc91e709c31405b63", "status": "APPROVED"}),
            ("DATA_MUTATION", "SUPERVISOR_EVALUATION", "SUCCESS", "sup_pm_it", "pm_it", "supervisor", "eval_w1", "192.168.1.12", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", {"week": 1, "suggested_score": 95, "advice": "ผลงานดีเยี่ยม มีความคิดสร้างสรรค์ในการแก้ปัญหาข้อมูล"}),
            ("AUTH", "LOGIN_FAILED", "WARN", None, "unknown", "anonymous", "session_auth", "203.0.113.42", "curl/8.1.2", {"auth_method": "PIN", "pin_attempt": "******", "reason": "PIN ไม่ถูกต้อง 3 ครั้งติดต่อกัน"}),
            ("EXPORT", "JSON_BACKUP_DOWNLOAD", "INFO", "usr_admin", "admin", "admin", "full_system_payload", "127.0.0.1", "Mozilla/5.0 (Macintosh; Apple Silicon)", {"export_type": "FULL_JSON", "trainee_id": "usr_jake", "status": "COMPLETED"}),
            ("COMPLIANCE", "PDPA_CONSENT_RECORDED", "SUCCESS", "usr_jake", "jake", "trainee", "pdpa_consent_v1", "192.168.1.45", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", {"policy_version": "1.0-2569", "consent_status": True, "purposes_count": 4})
        ]

        for e in demo_events:
            self.log_audit_event(
                event_category=e[0],
                event_name=e[1],
                severity=e[2],
                user_id=e[3],
                username=e[4],
                user_role=e[5],
                target_resource=e[6],
                ip_address=e[7],
                user_agent=e[8],
                details=e[9]
            )

    # =========================================================================
    # RBAC Management Methods
    # =========================================================================
    def get_role_permissions(self, role_id: str) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            rows = conn.execute("""
                SELECT m.menu_id, m.module_key, m.menu_label, m.menu_category, m.menu_icon, m.sort_order,
                       p.can_view, p.can_edit
                FROM ojt_menus m
                JOIN ojt_role_menu_permissions p ON m.menu_id = p.menu_id
                WHERE p.role_id = ? AND m.is_active = 1
                ORDER BY m.sort_order ASC
            """, (role_id,)).fetchall()
            return [dict(r) for r in rows]

    def get_user_effective_permissions(self, user_id: str) -> Dict[str, Any]:
        with self.get_connection() as conn:
            user = self.get_user_by_id(user_id)
            if not user:
                role = "trainee"
            else:
                role = user.get("role", "trainee")

            perms = self.get_role_permissions(role)
            can_view_map = {p["module_key"]: bool(p["can_view"]) for p in perms}
            can_edit_map = {p["module_key"]: bool(p["can_edit"]) for p in perms}

            return {
                "user_id": user_id if user else None,
                "role": role,
                "permissions": perms,
                "can_view_map": can_view_map,
                "can_edit_map": can_edit_map
            }

    def get_full_permission_matrix(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            roles = [dict(r) for r in conn.execute("SELECT role_id, role_name FROM ojt_roles ORDER BY role_id ASC").fetchall()]
            menus = [dict(r) for r in conn.execute("SELECT menu_id, module_key, menu_label, menu_category, sort_order FROM ojt_menus WHERE is_active = 1 ORDER BY sort_order ASC").fetchall()]
            raw_perms = conn.execute("SELECT role_id, menu_id, can_view, can_edit FROM ojt_role_menu_permissions").fetchall()
            
            matrix: Dict[str, Dict[str, Dict[str, int]]] = {}
            for r in roles:
                matrix[r["role_id"]] = {}

            for p in raw_perms:
                rid = p["role_id"]
                mid = p["menu_id"]
                if rid not in matrix:
                    matrix[rid] = {}
                matrix[rid][mid] = {
                    "can_view": int(p["can_view"]),
                    "can_edit": int(p["can_edit"])
                }

            return {
                "roles": roles,
                "menus": menus,
                "matrix": matrix
            }

    def update_permission(self, role_id: str, menu_id: str, can_view: int, can_edit: int) -> bool:
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO ojt_role_menu_permissions (role_id, menu_id, can_view, can_edit)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(role_id, menu_id) DO UPDATE SET
                    can_view = excluded.can_view,
                    can_edit = excluded.can_edit
            """, (role_id, menu_id, can_view, can_edit))
            conn.commit()
            return True

