#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🏛️ Smart GovReport Hub 2.5 - Comprehensive Verification Suite
ทดสอบการเชื่อมต่อ Docker PostgreSQL 5432, FastAPI Backend, และ Modular Frontend
"""

import urllib.request
import json
import os
import sys

def run_suite():
    print("==========================================================================")
    print("🏛️ Verifying Smart GovReport Hub 2.5 (PostgreSQL 5432 + Modular Frontend)...")
    print("==========================================================================")
    passed = 0
    total = 0

    def check(desc, cond):
        nonlocal passed, total
        total += 1
        if cond:
            passed += 1
            print(f"  ✅ [PASS] {desc}")
        else:
            print(f"  ❌ [FAIL] {desc}")

    # 1. Test 2.5 Frontend on Port 8085
    try:
        with urllib.request.urlopen("http://localhost:8085/") as res:
            check("v2.5 Frontend on Port 8085 returns HTTP 200", res.status == 200)
            content = res.read().decode('utf-8')
            check("v2.5 Index contains Smart GovReport Hub 2.5", "Smart GovReport Hub 2.5" in content)
            check("v2.5 Index loads ES module app.js", 'type="module" src="js/app.js"' in content)
            check("v2.5 Index contains Docker PostgreSQL 5432 live badge", "pg-docker-pill" in content)
            check("v2.5 Index contains all 6 authentic views", 
                  "view-dashboard" in content and 
                  "view-ojt-log" in content and 
                  "view-project-summary" in content and 
                  "view-official-memo" in content and 
                  "view-portfolio-report" in content and 
                  "view-executive-overview" in content)
            check("v2.5 Index contains core modals (Signature, Sync, PDPA)", 
                  "signature-modal" in content and "api-sync-modal" in content and "ojt-photo-modal" in content)
            # Approval Gate Enhanced Verification
            check("v2.5 Index contains Member Management & Approval Gate Modal", "member-management-modal" in content)
            check("v2.5 Index contains Search & Filter Toolbar in Approval Gate", "mgmt-search-input" in content and "mgmt-role-filter" in content)
            check("v2.5 Index contains Batch Actions Bar in Approval Gate", "batch-actions-container" in content and "master-select-pending" in content)
            check("v2.5 Index contains Edit Member Profile Modal", "edit-member-modal" in content and "edit-member-form" in content)
    except Exception as e:
        check(f"v2.5 Frontend reachable: {e}", False)

    # 2. Test 2.5 Backend on Port 8086 with Docker PostgreSQL 5432
    try:
        with urllib.request.urlopen("http://127.0.0.1:8086/api/health") as res:
            check("v2.5 Backend on Port 8086 returns HTTP 200", res.status == 200)
            data = json.loads(res.read().decode('utf-8'))
            check("v2.5 Backend health status is online", data.get("status") == "online")
            check("v2.5 Backend version is 2.5.0", data.get("version") == "2.5.0")
            db_name = data.get("database", "")
            check("Active Database is Docker PostgreSQL 5432 Full Connection", "PostgreSQL" in db_name and "5432" in db_name)
            telemetry = data.get("telemetry", {})
            check("Telemetry reports active users >= 2 in PostgreSQL", telemetry.get("active_users", 0) >= 2)
            check("Telemetry reports saved reports in PostgreSQL", telemetry.get("saved_reports", 0) >= 1)
            print(f"         ↳ Active Database Engine: {db_name}")
            print(f"         ↳ Telemetry: {telemetry}")
    except Exception as e:
        check(f"v2.5 Backend reachable: {e}", False)

    # 3. Test REST API Endpoints with Docker PostgreSQL
    try:
        with urllib.request.urlopen("http://127.0.0.1:8086/api/reports") as res:
            check("GET /api/reports returns HTTP 200", res.status == 200)
            reports = json.loads(res.read().decode('utf-8'))
            check("Reports query returns list from PostgreSQL", isinstance(reports, list) and len(reports) >= 1)
    except Exception as e:
        check(f"GET /api/reports: {e}", False)

    try:
        with urllib.request.urlopen("http://127.0.0.1:8086/api/sync/state") as res:
            check("GET /api/sync/state returns HTTP 200", res.status == 200)
            state = json.loads(res.read().decode('utf-8'))
            check("Full state contains reports & database info", state.get("success") == True and "PostgreSQL" in state.get("database", ""))
    except Exception as e:
        check(f"GET /api/sync/state: {e}", False)

    # 4. Test 2.0 Still Online on Port 8082 (100% untouched)
    try:
        with urllib.request.urlopen("http://localhost:8082/") as res:
            check("v2.0 Preserved on Port 8082 returns HTTP 200", res.status == 200)
    except Exception as e:
        check(f"v2.0 Preserved reachable: {e}", False)

    # 5. Test Modular Files in js/modules/
    modules = [
        "js/app.js",
        "js/modules/01-core-state.js",
        "js/modules/02-db-api.js",
        "js/modules/03-numeral.js",
        "js/modules/05-logbook-views.js",
        "js/modules/06-evidence-pdpa.js",
        "js/modules/07-signature.js",
        "js/modules/09-gov-docs.js",
        "js/modules/10-membership.js",
        "js/modules/11-sync-hub.js",
        "css/main.css",
        "css/print-a4.css"
    ]
    base_dir = "/Users/Shared/my_ai_project/01_ACTIVE_PROJECTS/ojt-smartgov-report-v2.5"
    for m in modules:
        full_p = os.path.join(base_dir, m)
        exists = os.path.exists(full_p) and os.path.getsize(full_p) > 0
        check(f"Modular asset exists and non-empty: {m}", exists)

    # 6. Test 1_CLICK_START.command
    cmd_file = os.path.join(base_dir, "1_CLICK_START.command")
    check("1_CLICK_START.command is executable", os.path.exists(cmd_file) and os.access(cmd_file, os.X_OK))

    print("==========================================================================")
    print(f"🎯 Total Score: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    print("==========================================================================")
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(run_suite())
