import os
import json
import sqlite3
from fastapi.testclient import TestClient

from app import app, db, create_token
from ojt_system.database import OJTDatabase

def test_audit_database_engine():
    print("\n--- 1. Testing Database Audit Engine (Dual-Engine) ---")
    test_db_path = "test_audit_temp.db"
    test_log_path = "logs/test_backend_audit.jsonl"
    
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    if os.path.exists(test_log_path):
        os.remove(test_log_path)

    test_db = OJTDatabase(db_path=test_db_path, backend_audit_log_path=test_log_path)

    # Verify table and indexes
    with test_db.get_connection() as conn:
        tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        assert "ojt_audit_logs" in tables, "Table ojt_audit_logs must exist"
        
        indexes = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='index'").fetchall()]
        assert "idx_audit_timestamp" in indexes, "idx_audit_timestamp index must exist"
        assert "idx_audit_category" in indexes, "idx_audit_category index must exist"

    # Verify Demo Seeds were created
    stats = test_db.get_audit_stats()
    assert stats["total_logs"] >= 8, f"Expected seeded logs, got {stats['total_logs']}"
    assert stats["security_alerts"] >= 1, "Expected security alert in demo logs"
    print(f"✅ Demo seed logs initialized: {stats}")

    # Test Dual Write
    new_log_id = test_db.log_audit_event(
        event_category="SECURITY",
        event_name="TEST_EVENT",
        severity="ALERT",
        user_id="usr_tester",
        username="tester",
        user_role="supervisor",
        target_resource="res_test",
        ip_address="192.168.1.99",
        user_agent="pytest-client",
        details={"test_key": "test_value"}
    )
    assert new_log_id > 0, "log_audit_event must return positive ID"

    # Verify write to JSONL
    assert os.path.exists(test_log_path), "JSONL log file must exist"
    with open(test_log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        assert len(lines) > 0, "JSONL log must have entries"
        last_entry = json.loads(lines[-1])
        assert last_entry["event_name"] == "TEST_EVENT"
        assert last_entry["severity"] == "ALERT"
    print("✅ Dual engine persistence (SQLite + JSONL) verified!")

    # Test Filter & Search
    logs_filtered = test_db.get_audit_logs(category="SECURITY")
    assert any(l["event_name"] == "TEST_EVENT" for l in logs_filtered)

    logs_search = test_db.get_audit_logs(search="tester")
    assert len(logs_search) >= 1
    print("✅ Audit Log query, filter, and keyword search verified!")

    # Cleanup test files
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    if os.path.exists(test_log_path):
        os.remove(test_log_path)


def test_audit_api_endpoints():
    print("\n--- 2. Testing FastAPI Audit Log Endpoints & RBAC ---")
    client = TestClient(app)

    # Tokens
    trainee_token = create_token("usr_jake", "trainee")
    supervisor_token = create_token("sup_pm_it", "supervisor")
    admin_token = create_token("usr_admin", "admin")

    # 1. RBAC Test: Trainee should get 403 Forbidden
    res_trainee = client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert res_trainee.status_code == 403, f"Expected 403 for trainee, got {res_trainee.status_code}"
    print("✅ RBAC: Trainee access properly blocked with 403 Forbidden")

    # 2. Supervisor & Admin Access
    res_sup = client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {supervisor_token}"}
    )
    assert res_sup.status_code == 200, f"Expected 200 for supervisor, got {res_sup.status_code}"
    body = res_sup.json()
    assert body["status"] == "success"
    assert "data" in body
    print(f"✅ RBAC: Supervisor retrieved {body['count']} audit records")

    # 3. Stats Endpoint
    res_stats = client.get(
        "/api/v1/audit-logs/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_stats.status_code == 200
    stats = res_stats.json()["data"]
    assert "total_logs" in stats
    assert "security_alerts" in stats
    print(f"✅ Stats endpoint verified: {stats}")

    # 4. Export Endpoints (JSON & CSV)
    res_csv = client.get(
        "/api/v1/audit-logs/export?format=csv",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "ID,Timestamp,User ID" in res_csv.text
    print("✅ Export CSV endpoint verified")

    res_json = client.get(
        "/api/v1/audit-logs/export?format=json",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_json.status_code == 200
    assert "application/json" in res_json.headers["content-type"]
    print("✅ Export JSON endpoint verified")

    # 5. Interceptor Test: Failed PIN Login should generate LOGIN_FAILED log
    res_bad_login = client.post(
        "/api/v1/auth/pin-login",
        json={"pin": "000001"} # Invalid PIN
    )
    assert res_bad_login.status_code == 401

    # Check that failed login was audited
    res_check = client.get(
        "/api/v1/audit-logs?search=LOGIN_FAILED",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_check.status_code == 200
    failed_logs = res_check.json()["data"]
    assert len(failed_logs) >= 1
    assert failed_logs[0]["severity"] == "WARN"
    print("✅ Security Interceptor: Failed PIN login audited as WARN")

    # 6. Interceptor Test: BOLA Prevention should generate BOLA_BLOCKED ALERT
    # Trainee usr_jake trying to access non-owned trainee usr_non
    res_bola = client.get(
        "/api/v1/activities?trainee_id=usr_non",
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert res_bola.status_code == 403

    res_check_bola = client.get(
        "/api/v1/audit-logs?search=BOLA_BLOCKED",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_check_bola.status_code == 200
    bola_logs = res_check_bola.json()["data"]
    assert len(bola_logs) >= 1
    assert bola_logs[0]["severity"] == "ALERT"
    print("✅ Security Interceptor: BOLA attempt intercepted and audited as ALERT")

if __name__ == "__main__":
    test_audit_database_engine()
    test_audit_api_endpoints()
    print("\n🎉 ALL AUDIT LOG CONSOLE AUTOMATED TESTS PASSED!")
