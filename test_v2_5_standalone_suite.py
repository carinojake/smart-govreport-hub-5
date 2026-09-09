#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🏛️ Smart GovReport Hub 2.5 - Standalone Verification Suite
"""

import urllib.request
import json
import os
import sys

def run_suite():
    print("==========================================================================")
    print("🏛️ Verifying Smart GovReport Hub 2.5 Standalone System...")
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
            check("v2.5 Index contains Smart GovReport Hub 2.5", "Smart GovReport Hub" in content and "v2.5" in content)
            check("v2.5 Index loads ES module app.js", 'type="module" src="js/app.js"' in content)
            check("v2.5 Index has all 5 main tabs", "tab-btn-logbook" in content and "tab-btn-dashboard" in content and "tab-btn-govdocs" in content and "tab-btn-ai" in content and "tab-btn-profile" in content)
    except Exception as e:
        check(f"v2.5 Frontend reachable: {e}", False)

    # 2. Test 2.5 Backend on Port 8086
    try:
        with urllib.request.urlopen("http://127.0.0.1:8086/api/health") as res:
            check("v2.5 Backend on Port 8086 returns HTTP 200", res.status == 200)
            data = json.loads(res.read().decode('utf-8'))
            check("v2.5 Backend health status is online", data.get("status") == "online")
            check("v2.5 Backend version is 2.5.0", data.get("version") == "2.5.0")
            print(f"         ↳ Active Database Engine: {data.get('database')}")
    except Exception as e:
        check(f"v2.5 Backend reachable: {e}", False)

    # 3. Test 2.0 Still Online on Port 8082
    try:
        with urllib.request.urlopen("http://localhost:8082/") as res:
            check("v2.0 Preserved on Port 8082 returns HTTP 200", res.status == 200)
    except Exception as e:
        check(f"v2.0 Preserved reachable: {e}", False)

    # 4. Test 10 Modules Files Exist
    modules = [
        "js/modules/01-layout.js",
        "js/modules/02-storage.js",
        "js/modules/03-auth.js",
        "js/modules/04-logbook.js",
        "js/modules/05-evidence.js",
        "js/modules/06-signature.js",
        "js/modules/07-dashboard.js",
        "js/modules/08-gov-docs.js",
        "js/modules/09-ai-assistant.js",
        "js/modules/10-sync-hub.js"
    ]
    base_dir = "/Users/Shared/my_ai_project/01_ACTIVE_PROJECTS/ojt-smartgov-report-v2.5"
    for m in modules:
        full_p = os.path.join(base_dir, m)
        check(f"Module file exists: {m}", os.path.exists(full_p) and os.path.getsize(full_p) > 0)

    # 5. Test 1_CLICK_START.command
    cmd_file = os.path.join(base_dir, "1_CLICK_START.command")
    check("1_CLICK_START.command is executable", os.path.exists(cmd_file) and os.access(cmd_file, os.X_OK))

    print("==========================================================================")
    print(f"🎯 Total Score: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    print("==========================================================================")
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(run_suite())
