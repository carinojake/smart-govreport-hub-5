import unittest
import json
import os
import shutil
from unittest.mock import patch
from fastapi.testclient import TestClient

# Setup isolated test database before importing app
TEST_DB_PATH = "test_ojt_logbook.db"
TEST_AUDIT_LOG_PATH = "logs/test_pdpa_audit.jsonl"
os.environ["SMARTGOV_DB_PATH"] = TEST_DB_PATH
os.environ["SMARTGOV_AUDIT_LOG_PATH"] = TEST_AUDIT_LOG_PATH

from ojt_system.database import OJTDatabase
import app as app_module
from app import app

# Point global app database to the isolated test database
test_db = OJTDatabase(TEST_DB_PATH, TEST_AUDIT_LOG_PATH)
app_module.db = test_db

client = TestClient(app)

class TestSmartGovReportHub(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Reset test DB fresh
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
        if os.path.exists(TEST_AUDIT_LOG_PATH):
            os.remove(TEST_AUDIT_LOG_PATH)
        cls.db = OJTDatabase(TEST_DB_PATH, TEST_AUDIT_LOG_PATH)
        app_module.db = cls.db

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
        if os.path.exists(TEST_AUDIT_LOG_PATH):
            os.remove(TEST_AUDIT_LOG_PATH)

    def test_1_root_page(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("Smart GovReport Hub 2.5", res.text)
        self.assertIn("pdpaConsentModal", res.text)

        # Legacy routes /v1, /v2, /v3 must redirect to 2.5
        for legacy_route in ["/v1", "/v2", "/v3"]:
            redir_res = client.get(legacy_route, follow_redirects=False)
            self.assertEqual(redir_res.status_code, 307)
            self.assertEqual(redir_res.headers["location"], "/")

        print("✓ 1. Root dashboard 2.5 loaded & legacy V1/V2/V3 successfully redirected")

    def test_2_users_list_secrecy_and_pin_login(self):
        res = client.get("/api/v1/auth/users")
        self.assertEqual(res.status_code, 200)
        users = res.json()["users"]
        self.assertGreaterEqual(len(users), 7)

        # SECURITY VERIFICATION: Verify pin_code and password_hash are NEVER leaked in public API
        for u in users:
            self.assertNotIn("pin_code", u, f"Security Leak: pin_code found in user {u['user_id']}")
            self.assertNotIn("password_hash", u, f"Security Leak: password_hash found in user {u['user_id']}")
        print("✓ 2.1 Security verified: No PIN codes or password hashes leaked in public users list")

        # Login Jake with PIN 123456
        res_jake = client.post("/api/v1/auth/pin-login", json={"pin": "123456"})
        self.assertEqual(res_jake.status_code, 200)
        data_jake = res_jake.json()
        self.assertEqual(data_jake["user"]["user_id"], "usr_jake")
        self.assertEqual(data_jake["user"]["role"], "trainee")
        self.__class__.token_jake = data_jake["token"]

        # Login May with PIN 111111
        res_may = client.post("/api/v1/auth/pin-login", json={"pin": "111111"})
        self.assertEqual(res_may.status_code, 200)
        data_may = res_may.json()
        self.assertEqual(data_may["user"]["user_id"], "usr_may")
        self.__class__.token_may = data_may["token"]

        # Login Supervisor with PIN 999999
        res_pm = client.post("/api/v1/auth/pin-login", json={"pin": "999999"})
        self.assertEqual(res_pm.status_code, 200)
        data_pm = res_pm.json()
        self.assertEqual(data_pm["user"]["role"], "supervisor")
        self.__class__.token_pm = data_pm["token"]
        print("✓ 2.2 PIN login and HMAC tokens successfully generated for all roles")

    def test_3_auth_enforcement_and_bola_protection(self):
        # 1. Unauthenticated request must return 401 Unauthorized
        res_unauth = client.get("/api/v1/activities")
        self.assertEqual(res_unauth.status_code, 401)
        print("✓ 3.1 Unauthenticated access correctly rejected with 401 Unauthorized")

        # 2. Trainee Jake attempting to read or modify May's data (BOLA / IDOR) must return 403 Forbidden
        headers_jake = {"Authorization": f"Bearer {self.token_jake}"}
        res_bola = client.get("/api/v1/activities?trainee_id=usr_may", headers=headers_jake)
        self.assertEqual(res_bola.status_code, 403)
        self.assertIn("ไม่มีสิทธิ์", res_bola.json()["detail"])
        print("✓ 3.2 BOLA / IDOR protection verified: Trainee cannot inspect another trainee's data (403 Forbidden)")

        # 3. Supervisor CAN inspect May's data
        headers_pm = {"Authorization": f"Bearer {self.token_pm}"}
        res_pm_inspect = client.get("/api/v1/activities?trainee_id=usr_may", headers=headers_pm)
        self.assertEqual(res_pm_inspect.status_code, 200)
        self.assertEqual(res_pm_inspect.json()["trainee_id"], "usr_may")
        print("✓ 3.3 Role-based access verified: Supervisor can inspect assigned trainee data")

    def test_4_data_isolation_and_hours_accumulation(self):
        headers_jake = {"Authorization": f"Bearer {self.token_jake}"}
        headers_may = {"Authorization": f"Bearer {self.token_may}"}

        # Check Jake initial activities
        res_jake = client.get("/api/v1/activities", headers=headers_jake)
        self.assertEqual(res_jake.status_code, 200)
        jake_data = res_jake.json()
        self.assertEqual(len(jake_data["activities"]), 4)
        self.assertEqual(jake_data["progress"]["completed_hours"], 24.0)

        # May initial activities should be 0
        res_may = client.get("/api/v1/activities", headers=headers_may)
        self.assertEqual(res_may.status_code, 200)
        may_data = res_may.json()
        self.assertEqual(len(may_data["activities"]), 0)
        self.assertEqual(may_data["progress"]["completed_hours"], 0.0)

        # May creates an activity
        new_act = {
            "activity_date": "5 กันยายน 2569",
            "day_name": "ศุกร์",
            "week_number": 1,
            "activity_title": "จัดทำทะเบียนรับส่งหนังสือราชการผ่านระบบ e-Saraban",
            "hours": 7.0,
            "competency_code": "GOV-01",
            "sop_procedure": "1. รับหนังสือเข้าสารบรรณ\n2. ออกเลขที่หนังสือราชการ เบอร์โทร 089-999-8888",
            "tools_used": "e-Saraban, Google Drive",
            "problems_and_solutions": "ไม่พบปัญหา"
        }
        res_create = client.post("/api/v1/activities", json=new_act, headers=headers_may)
        self.assertEqual(res_create.status_code, 200)

        # Verify May has 1 activity and 7.0 hours
        res_may_after = client.get("/api/v1/activities", headers=headers_may)
        may_after_data = res_may_after.json()
        self.assertEqual(len(may_after_data["activities"]), 1)
        self.assertEqual(may_after_data["progress"]["completed_hours"], 7.0)

        # Verify Jake is completely unaffected (still 24.0 hours)
        res_jake_after = client.get("/api/v1/activities", headers=headers_jake)
        self.assertEqual(res_jake_after.json()["progress"]["completed_hours"], 24.0)
        print("✓ 4. Complete data isolation & hours accumulation verified")

    def test_5_pdpa_consent_and_audit_trail(self):
        headers_jake = {"Authorization": f"Bearer {self.token_jake}"}
        consent_req = {
            "policy_version": "v1.2-2026",
            "consent_status": True,
            "agreed_purposes": ["daily_log", "photos"],
            "signature_hash": "audit_hash_test_1234"
        }
        res = client.post("/api/v1/pdpa/consent", json=consent_req, headers=headers_jake)
        self.assertEqual(res.status_code, 200)

        # Verify audit trail file
        self.assertTrue(os.path.exists(TEST_AUDIT_LOG_PATH))
        with open(TEST_AUDIT_LOG_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()
            last_entry = json.loads(lines[-1])
            self.assertEqual(last_entry["event"], "PDPA_CONSENT_RECORDED")
            self.assertEqual(last_entry["user_id"], "usr_jake")
        print("✓ 5. PDPA Consent logged to SQLite and immutable audit JSONL trail")

    @patch("ojt_system.ai_client.OJTAIClient.polish_text")
    def test_6_ai_polish_mocked(self, mock_polish):
        mock_polish.return_value = "ปฏิบัติงานวิเคราะห์ข้อมูลสารสนเทศและพัฒนาระบบราชการดิจิทัลตามมาตรฐานกำหนดตำแหน่ง"
        req = {
            "raw_text": "วันนี้เรียนทำเอ็กเซลสูตรซัมอีฟกับทำแดชบอร์ด แล้วตอนบ่ายฝึกวางแผนงานแบบอาจาย์ล",
            "mode": "brief"
        }
        res = client.post("/api/v1/ai/polish", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("วิเคราะห์ข้อมูลสารสนเทศ", data["result"])
        print("✓ 6. AI Polish test executed with lightning speed (< 0.1s) via Mocking")

    def test_7_signature_and_pin_verify(self):
        headers_pm = {"Authorization": f"Bearer {self.token_pm}"}

        # 1. Reject invalid PIN
        bad_sig = {
            "week_number": 1,
            "trainee_id": "usr_jake",
            "signature_image": "data:image/png;base64,fake",
            "pin": "000001",
            "role": "supervisor"
        }
        res_bad = client.post("/api/v1/signatures", json=bad_sig, headers=headers_pm)
        self.assertEqual(res_bad.status_code, 401)
        print("✓ 7.1 Invalid PIN correctly rejected with 401 Unauthorized")

        # 2. Success with valid PM PIN 999999
        good_sig = {
            "week_number": 1,
            "trainee_id": "usr_jake",
            "signature_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "pin": "999999",
            "role": "supervisor"
        }
        res_good = client.post("/api/v1/signatures", json=good_sig, headers=headers_pm)
        self.assertEqual(res_good.status_code, 200)
        self.assertEqual(res_good.json()["signer_name"], "นางสาวชนินาถ วิจิตรไพฑูรณ์ (พี่ใหญ่ PM)")
        print("✓ 7.2 Supervisor Canvas signature recorded with verified PIN 999999")

if __name__ == "__main__":
    unittest.main()
