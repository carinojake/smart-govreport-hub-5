-- ==============================================================================
-- Smart GovReport Hub 2.5 - PostgreSQL Database Schema
-- ออกแบบโดย: เซียน SA (5.2) | สถาปัตยกรรมระบบราชการดิจิทัล & PDPA
-- สภาพแวดล้อมเป้าหมาย: Docker PostgreSQL (Port: 5432) / Smart Fallback SQLite
-- งบประมาณ: 0 บาท (ใช้เครื่อง Mac M1 + Local Docker / Open-Source)
-- ==============================================================================

-- 1. สร้าง Extensions สำหรับ UUID และ JSON Operations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. สร้าง ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('trainee', 'supervisor', 'advisor', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. ตารางผู้ใช้งานและสิทธิ์การเข้าถึง (Users & RBAC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    role user_role NOT NULL DEFAULT 'trainee',
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(150) DEFAULT 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
    organization VARCHAR(200) DEFAULT 'กรมการค้าต่างประเทศ กระทรวงพาณิชย์',
    disability_type VARCHAR(100) DEFAULT 'การมองเห็น (สายตาเลือนราง)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. ตารางบันทึกการปฏิบัติงาน OJT (OJT Weekly & Daily Reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ojt_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_num INT NOT NULL CHECK (week_num BETWEEN 1 AND 52),
    work_date DATE NOT NULL,
    hours NUMERIC(4, 2) NOT NULL DEFAULT 4.50 CHECK (hours >= 0),
    tasks TEXT NOT NULL,
    knowledge_skills TEXT,
    problems TEXT,
    category VARCHAR(100) DEFAULT 'งานบริการสารสนเทศและดูแลระบบ',
    status report_status NOT NULL DEFAULT 'draft',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    -- JSONB รองรับ dynamic metadata เช่น checklist, พิกัดสถานที่, สรุป AI
    data_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_work_date UNIQUE(user_id, work_date)
);

-- Index สำหรับค้นหารายสัปดาห์และสถานะอย่างรวดเร็ว
CREATE INDEX IF NOT EXISTS idx_ojt_reports_user_week ON ojt_reports(user_id, week_num);
CREATE INDEX IF NOT EXISTS idx_ojt_reports_status ON ojt_reports(status);
CREATE INDEX IF NOT EXISTS idx_ojt_reports_payload_gin ON ojt_reports USING GIN (data_payload);

-- ==============================================================================
-- 5. ตารางแนบเอกสารและหลักฐานภาพถ่าย พร้อมพิกัด PDPA (Report Attachments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS report_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES ojt_reports(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_num INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    drive_file_id VARCHAR(100),
    mime_type VARCHAR(100) NOT NULL,
    file_size_kb NUMERIC(10, 2) NOT NULL,
    -- JSONB เก็บพิกัดและประวัติการเบลอ/คาดแถบดำข้อมูลส่วนบุคคล (PDPA Redaction)
    pdpa_redaction_metadata JSONB NOT NULL DEFAULT '{
        "masked": false,
        "rectangles": [],
        "blurred_elements": [],
        "consent_verified": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_user_week ON report_attachments(user_id, week_num);
CREATE INDEX IF NOT EXISTS idx_attachments_pdpa_gin ON report_attachments USING GIN (pdpa_redaction_metadata);

-- ==============================================================================
-- 6. ตารางลายเซ็นดิจิทัลพร้อมตราประทับเวลา (Digital Signatures & Timestamps)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_num INT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    signature_image_data TEXT NOT NULL, -- Base64 DataURL (PNG 300x120)
    digital_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_ip VARCHAR(45),
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_signer_week_role UNIQUE(week_num, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_signatures_week_role ON signatures(week_num, role);

-- ==============================================================================
-- 7. ตารางประเมินผลการฝึกงานโดยพี่เลี้ยง (Supervisor Evaluations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    week_num INT NOT NULL,
    -- JSONB เก็บเกณฑ์ 5 ด้าน: วินัย, คุณภาพงาน, ความคิดสร้างสรรค์, การสื่อสาร, จริยธรรม
    scores JSONB NOT NULL DEFAULT '{
        "discipline": 5,
        "quality": 5,
        "creativity": 5,
        "communication": 5,
        "ethics": 5,
        "total_score": 25
    }'::jsonb,
    grade VARCHAR(5) NOT NULL DEFAULT 'A',
    comments TEXT,
    batch_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_trainee_week_eval UNIQUE(trainee_id, week_num)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_trainee_week ON evaluations(trainee_id, week_num);
CREATE INDEX IF NOT EXISTS idx_evaluations_scores_gin ON evaluations USING GIN (scores);

-- ==============================================================================
-- 8. ตารางประวัติการตรวจสอบความปลอดภัยและการแก้ไข (Audit Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, SIGN, MASK_PDPA, EXPORT_PDF
    target_table VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    ip_address VARCHAR(45),
    changed_fields JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==============================================================================
-- 9. Trigger ฟังก์ชันสำหรับอัปเดต updated_at อัตโนมัติ
-- ==============================================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_ojt_reports ON ojt_reports;
CREATE TRIGGER set_timestamp_ojt_reports
BEFORE UPDATE ON ojt_reports
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_evaluations ON evaluations;
CREATE TRIGGER set_timestamp_evaluations
BEFORE UPDATE ON evaluations
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ==============================================================================
-- 10. Seed Initial System Accounts (รหัสผ่านเบื้องต้น: hash SHA-256)
-- ==============================================================================
INSERT INTO users (id, username, password_hash, salt, role, full_name, department, disability_type)
VALUES 
(
    'a0000001-0000-0000-0000-000000000001',
    'trainee_jake',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'salt_jake_2026',
    'trainee',
    'นายสุรเดช สว่างศรี (พี่แจ็ค)',
    'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
    'การมองเห็น (สายตาเลือนราง)'
),
(
    'a0000002-0000-0000-0000-000000000002',
    'supervisor_somchai',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'salt_somchai_2026',
    'supervisor',
    'นายสมชาย สายตรวจงาน (พี่เลี้ยงหน่วยงาน)',
    'กลุ่มพัฒนาระบบดิจิทัลภาครัฐ',
    'ไม่มี'
)
ON CONFLICT (username) DO NOTHING;

-- ==============================================================================
-- 11. Dynamic Role-Based Access Control (RBAC Matrix)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(50) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menus (
    menu_id VARCHAR(50) PRIMARY KEY,
    module_key VARCHAR(50) NOT NULL UNIQUE,
    menu_label VARCHAR(100) NOT NULL,
    menu_category VARCHAR(50) DEFAULT 'sidebar',
    menu_icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS role_menu_permissions (
    role_id VARCHAR(50) NOT NULL,
    menu_id VARCHAR(50) NOT NULL,
    can_view INTEGER DEFAULT 1,
    can_edit INTEGER DEFAULT 0,
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(menu_id) ON DELETE CASCADE
);

-- Seed Roles
INSERT INTO roles (role_id, role_name) VALUES
('staff', 'ผู้ดูแลระบบ / เจ้าหน้าที่ (Admin Staff)'),
('supervisor', 'ผู้ควบคุมงาน / พี่เลี้ยง (Supervisor)'),
('advisor', 'อาจารย์นิเทศก์ / ที่ปรึกษา (Advisor)'),
('trainee', 'ผู้ฝึกปฏิบัติงาน (Trainee)')
ON CONFLICT (role_id) DO NOTHING;

-- Seed 10 Menus
INSERT INTO menus (menu_id, module_key, menu_label, menu_category, menu_icon, sort_order) VALUES
('m_dash', 'dashboard', 'แดชบอร์ดภาพรวมรายงาน', 'sidebar', 'fa-solid fa-chart-pie', 1),
('m_log', 'ojt-log', 'สมุดบันทึกการฝึกภาคปฏิบัติ', 'sidebar', 'fa-solid fa-book-bookmark', 2),
('m_proj', 'project-summary', 'รายงานบริหารโครงการ', 'sidebar', 'fa-solid fa-diagram-project', 3),
('m_memo', 'official-memo', 'บันทึกข้อความราชการ', 'sidebar', 'fa-solid fa-stamp', 4),
('m_exec', 'executive-overview', 'Executive Dashboard', 'sidebar', 'fa-solid fa-users-viewfinder', 5),
('m_port', 'portfolio-report', 'รายงานสมรรถนะ Portfolio', 'sidebar', 'fa-solid fa-award', 6),
('m_audit', 'audit-console', 'Audit Log Console', 'sidebar', 'fa-solid fa-terminal', 7),
('m_kb', 'knowledge-base', 'คลังสืบค้นงานรุ่นพี่', 'sidebar', 'fa-solid fa-book-open-reader', 8),
('m_photo', 'photo-gallery', 'คลังภาพหลักฐาน', 'sidebar', 'fa-solid fa-images', 9),
('m_polish', 'ai-polish', 'AI Polish ขัดเกลาภาษาราชการ', 'widget', 'fa-solid fa-wand-magic-sparkles', 10)
ON CONFLICT (menu_id) DO NOTHING;

-- Seed Default Role Permissions
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_edit) VALUES
('staff', 'm_dash', 1, 1),
('staff', 'm_log', 1, 1),
('staff', 'm_proj', 1, 1),
('staff', 'm_memo', 1, 1),
('staff', 'm_exec', 1, 1),
('staff', 'm_port', 1, 1),
('staff', 'm_audit', 1, 1),
('staff', 'm_kb', 1, 1),
('staff', 'm_photo', 1, 1),
('staff', 'm_polish', 1, 1),
('supervisor', 'm_dash', 1, 1),
('supervisor', 'm_log', 1, 1),
('supervisor', 'm_proj', 1, 1),
('supervisor', 'm_memo', 1, 1),
('supervisor', 'm_exec', 1, 1),
('supervisor', 'm_port', 1, 1),
('supervisor', 'm_audit', 1, 0),
('supervisor', 'm_kb', 1, 1),
('supervisor', 'm_photo', 1, 1),
('supervisor', 'm_polish', 1, 1),
('advisor', 'm_dash', 1, 0),
('advisor', 'm_log', 1, 1),
('advisor', 'm_proj', 1, 1),
('advisor', 'm_memo', 1, 1),
('advisor', 'm_exec', 1, 1),
('advisor', 'm_port', 1, 1),
('advisor', 'm_audit', 1, 0),
('advisor', 'm_kb', 1, 1),
('advisor', 'm_photo', 1, 1),
('advisor', 'm_polish', 1, 1),
('trainee', 'm_dash', 0, 0),
('trainee', 'm_log', 1, 1),
('trainee', 'm_proj', 1, 1),
('trainee', 'm_memo', 1, 1),
('trainee', 'm_exec', 0, 0),
('trainee', 'm_port', 1, 0),
('trainee', 'm_audit', 0, 0),
('trainee', 'm_kb', 1, 1),
('trainee', 'm_photo', 1, 1),
('trainee', 'm_polish', 1, 1)
ON CONFLICT (role_id, menu_id) DO NOTHING;

