import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure root directory in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import app, db, create_token

class TestRBACIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Ensure database is seeded
        db.seed_initial_data()

        # Create tokens for test users
        cls.trainee_token = create_token("usr_jake", "trainee")
        cls.supervisor_token = create_token("sup_pm_it", "supervisor")
        cls.admin_token = create_token("usr_admin", "admin")

    def test_01_database_tables_and_seeds(self):
        """1. ตรวจสอบการสร้างตารางและชุดข้อมูลเริ่มต้นใน SQLite"""
        with db.get_connection() as conn:
            roles_cnt = conn.execute("SELECT COUNT(*) as c FROM ojt_roles").fetchone()["c"]
            menus_cnt = conn.execute("SELECT COUNT(*) as c FROM ojt_menus").fetchone()["c"]
            perms_cnt = conn.execute("SELECT COUNT(*) as c FROM ojt_role_menu_permissions").fetchone()["c"]

            self.assertGreaterEqual(roles_cnt, 3, "Roles table should have at least 3 roles")
            self.assertGreaterEqual(menus_cnt, 8, "Menus table should have at least 8 menus")
            self.assertGreaterEqual(perms_cnt, 24, "Permissions table should have at least 24 entries")

    def test_02_effective_permissions_query(self):
        """2. ตรวจสอบสิทธิ์การมองเห็น (can_view_map) ของผู้ฝึกงาน vs ผู้ควบคุมงาน"""
        trainee_perms = db.get_user_effective_permissions("usr_jake")
        self.assertEqual(trainee_perms["role"], "trainee")
        self.assertFalse(trainee_perms["can_view_map"]["dashboard"], "Trainee must not view dashboard")
        self.assertFalse(trainee_perms["can_view_map"]["audit-console"], "Trainee must not view audit console")
        self.assertFalse(trainee_perms["can_view_map"]["backup-json"], "Trainee must not view backup json")
        self.assertTrue(trainee_perms["can_view_map"]["ojt-log"], "Trainee must view ojt-log")

        sup_perms = db.get_user_effective_permissions("sup_pm_it")
        self.assertEqual(sup_perms["role"], "supervisor")
        self.assertTrue(sup_perms["can_view_map"]["dashboard"], "Supervisor can view dashboard")
        self.assertTrue(sup_perms["can_view_map"]["audit-console"], "Supervisor can view audit console")
        self.assertTrue(sup_perms["can_view_map"]["backup-json"], "Supervisor can view backup json")

    def test_03_api_my_permissions(self):
        """3. ทดสอบเรียก API GET /api/v1/rbac/my-permissions"""
        # Trainee
        headers = {"Authorization": f"Bearer {self.trainee_token}"}
        res = self.client.get("/api/v1/rbac/my-permissions", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertFalse(data["can_view_map"]["dashboard"])
        self.assertTrue(data["can_view_map"]["ojt-log"])

        # Admin
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}
        res_admin = self.client.get("/api/v1/rbac/my-permissions", headers=headers_admin)
        self.assertEqual(res_admin.status_code, 200)
        self.assertTrue(res_admin.json()["can_view_map"]["dashboard"])

    def test_04_api_rbac_matrix_guard(self):
        """4. ตรวจสอบการป้องกันสิทธิ์เข้าถึงเมทริกซ์ (Non-admin must get 403)"""
        # Trainee attempt
        headers_trainee = {"Authorization": f"Bearer {self.trainee_token}"}
        res_trainee = self.client.get("/api/v1/rbac/matrix", headers=headers_trainee)
        self.assertEqual(res_trainee.status_code, 403, "Trainee should be forbidden from reading matrix")

        # Supervisor attempt
        headers_sup = {"Authorization": f"Bearer {self.supervisor_token}"}
        res_sup = self.client.get("/api/v1/rbac/matrix", headers=headers_sup)
        self.assertEqual(res_sup.status_code, 403, "Supervisor should be forbidden from reading matrix")

        # Admin attempt
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}
        res_admin = self.client.get("/api/v1/rbac/matrix", headers=headers_admin)
        self.assertEqual(res_admin.status_code, 200, "Admin can read matrix")
        matrix = res_admin.json()["matrix"]
        self.assertIn("admin", matrix)
        self.assertIn("trainee", matrix)

    def test_05_api_export_backup_guard(self):
        """5. ตรวจสอบการบล็อกการสำรองข้อมูลดิบ JSON ของผู้ฝึกงาน (Negative Test)"""
        headers_trainee = {"Authorization": f"Bearer {self.trainee_token}"}
        res_trainee = self.client.get("/api/v1/export/sync-payload", headers=headers_trainee)
        self.assertEqual(res_trainee.status_code, 403, "Trainee without backup-json permission must get 403")

        # Supervisor/Admin allowed
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}
        res_admin = self.client.get("/api/v1/export/sync-payload?trainee_id=usr_jake", headers=headers_admin)
        self.assertEqual(res_admin.status_code, 200, "Admin can export sync payload")

    def test_06_admin_update_matrix_realtime(self):
        """6. ทดสอบ Admin อัปเดตสิทธิ์เปิด Dashboard ให้ Trainee แล้วตรวจสอบผลลัพธ์แบบเรียลไทม์"""
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}
        payload = {
            "permissions": [
                {"role_id": "trainee", "menu_id": "m_dash", "can_view": 1, "can_edit": 0}
            ]
        }
        res_update = self.client.post("/api/v1/rbac/matrix", json=payload, headers=headers_admin)
        self.assertEqual(res_update.status_code, 200)

        # Trainee calls my-permissions now
        headers_trainee = {"Authorization": f"Bearer {self.trainee_token}"}
        res_trainee = self.client.get("/api/v1/rbac/my-permissions", headers=headers_trainee)
        self.assertEqual(res_trainee.status_code, 200)
        self.assertTrue(res_trainee.json()["can_view_map"]["dashboard"], "Dashboard should now be visible to trainee")

        # Revert back to default
        payload_revert = {
            "permissions": [
                {"role_id": "trainee", "menu_id": "m_dash", "can_view": 0, "can_edit": 0}
            ]
        }
        self.client.post("/api/v1/rbac/matrix", json=payload_revert, headers=headers_admin)
        res_revert = self.client.get("/api/v1/rbac/my-permissions", headers=headers_trainee)
        self.assertFalse(res_revert.json()["can_view_map"]["dashboard"], "Dashboard should be hidden again")

if __name__ == "__main__":
    unittest.main()
