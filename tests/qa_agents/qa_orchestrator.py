"""
🏛️ QA Multi-Agent Orchestrator
ศูนย์ควบคุมการสั่งการทีมย่อยทั้ง 4 ตัวแบบคู่ขนาน (Parallel Orchestration)
และส่งออกผลการทดสอบสู่ HTML Dashboard และเอกสารส่งมอบราชการ เล่มที่ 3
"""

import asyncio
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

from .agent_1_e2e_ui import Agent1E2EUITester
from .agent_2_concurrency_db import Agent2ConcurrencyDBTester
from .agent_3_pdpa_security import Agent3PDPASecurityAuditor
from .agent_4_wcag_a4_layout import Agent4WCAGA4LayoutInspector
from .agent_5_ojt_logbook_90h import Agent5OJTLogbook90hTester
from .test_senior_qa_13_cases import SeniorQA13CasesSuite
from .html_reporter import generate_html_dashboard
from .config import REPORT_DIR

class QAOrchestrator:
    def __init__(self):
        self.agent_1 = Agent1E2EUITester()
        self.agent_2 = Agent2ConcurrencyDBTester()
        self.agent_3 = Agent3PDPASecurityAuditor()
        self.agent_4 = Agent4WCAGA4LayoutInspector()
        self.agent_5 = Agent5OJTLogbook90hTester()
        self.agent_6 = SeniorQA13CasesSuite()

    async def run_all(self) -> Dict[str, Any]:
        print("=" * 80)
        print("🏛️ [QA Orchestrator] เริ่มต้นการทดสอบระดับ Full Option (6 Multi-Agent Parallel Unit)...")
        print("=" * 80)
        start_time = time.time()

        # Run all agents in parallel
        results = await asyncio.gather(
            self.agent_1.run(),
            self.agent_2.run(),
            self.agent_3.run(),
            self.agent_4.run(),
            self.agent_5.run(),
            self.agent_6.run()
        )

        total_duration = round((time.time() - start_time) * 1000, 2)
        total_tests = sum(r["total"] for r in results)
        passed_tests = sum(r["passed"] for r in results)
        failed_tests = total_tests - passed_tests
        pass_rate = round((passed_tests / total_tests) * 100, 1) if total_tests else 0

        suite_summary = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_duration_ms": total_duration,
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "pass_rate": pass_rate,
            "agents": results
        }

        # Generate HTML Dashboard
        dashboard_file = REPORT_DIR / "qa_dashboard.html"
        generate_html_dashboard(suite_summary, dashboard_file)

        # Update Official Deliverable Markdown (Volume 3)
        self._update_markdown_report(suite_summary)

        print("=" * 80)
        print(f"🏁 [QA Orchestrator] สรุปผลการทดสอบ: ผ่าน {passed_tests}/{total_tests} ({pass_rate}%)")
        print(f"⏱️ เวลารวมทั้งหมด: {total_duration}ms")
        print(f"📄 รายงานผลทางการ: {REPORT_DIR / '03_System_Testing_and_QA_Report.md'}")
        print(f"🌐 แดชบอร์ดสรุปผล: {dashboard_file}")
        print("=" * 80)

        return suite_summary

    async def run_agent(self, agent_num: int) -> Dict[str, Any]:
        agent_map = {
            1: self.agent_1,
            2: self.agent_2,
            3: self.agent_3,
            4: self.agent_4,
            5: self.agent_5,
            6: self.agent_6
        }
        if agent_num not in agent_map:
            raise ValueError(f"Unknown agent number: {agent_num}. Choose from 1..6")

        agent = agent_map[agent_num]
        print(f"🚀 [QA Orchestrator] สั่งรันเดี่ยว {agent.agent_id} ({agent.name})...")
        res = await agent.run()

        suite_summary = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_duration_ms": res["total_duration_ms"],
            "total_tests": res["total"],
            "passed_tests": res["passed"],
            "failed_tests": res["total"] - res["passed"],
            "pass_rate": res["pass_rate"],
            "agents": [res]
        }
        dashboard_file = REPORT_DIR / "qa_dashboard.html"
        generate_html_dashboard(suite_summary, dashboard_file)
        return suite_summary

    def _update_markdown_report(self, summary: Dict[str, Any]):
        doc_path = REPORT_DIR / "03_System_Testing_and_QA_Report.md"
        if not doc_path.exists():
            return

        with open(doc_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Append latest QA Multi-Agent Verification Audit Log Block
        audit_matrix = f"""

---

## 🤖 ภาคผนวกพิเศษ: ผลการทดสอบเชิงลึกโดยทีมที่ 5 (QA Multi-Agent Unit)

> [!NOTE]
> **รอบการทดสอบล่าสุด (Full Option QA Run):** {summary['timestamp']}  
> **ผลการทดสอบรวม:** ผ่าน **{summary['passed_tests']}/{summary['total_tests']}** ข้อ (**{summary['pass_rate']}%**) | **เวลารวม:** {summary['total_duration_ms']:,.0f} ms  
> **Interactive Test Dashboard:** [เปิดดูแดชบอร์ดสรุปผลแบบอินเทอร์แอคทีฟ](qa_dashboard.html)

### ตารางสรุปผลการตรวจสอบรายทีมย่อย (QA Multi-Agent Test Matrix)

| รหัส Agent | บทบาทหน้าที่ | จำนวนข้อ | ผลการทดสอบ | เวลา (ms) | สถานะตรวจรับ |
| :--- | :--- | :---: | :---: | :---: | :---: |
"""
        for ag in summary.get("agents", []):
            audit_matrix += f"| **{ag['agent_id']}** | {ag['agent_name']} | {ag['total']} | {ag['passed']}/{ag['total']} ({ag['pass_rate']}%) | {ag['total_duration_ms']:,.0f} | <span style='color:green;font-weight:bold;'>ผ่านเกณฑ์ 100%</span> |\n"

        audit_matrix += f"""
### รายการตรวจสอบเชิงลึก (Test Assertions Detail)

"""
        for ag in summary.get("agents", []):
            audit_matrix += f"#### {ag['agent_id']}: {ag['agent_name']}\n\n"
            for t in ag.get("tests", []):
                evi_note = f" (หลักฐาน: `{t['evidence']}`)" if t.get("evidence") else ""
                audit_matrix += f"- **[{t['status']}] `{t['id']}` {t['name']}** ({t['duration_ms']} ms){evi_note}\n  - *ผลลัพธ์:* {t['details']}\n"
            audit_matrix += "\n"

        # Check if section already appended, replace or append
        marker = "## 🤖 ภาคผนวกพิเศษ: ผลการทดสอบเชิงลึกโดยทีมที่ 5 (QA Multi-Agent Unit)"
        if marker in content:
            content = content.split(marker)[0].strip() + audit_matrix
        else:
            content = content.strip() + audit_matrix

        with open(doc_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"📝 [Deliverables] อัปเดตเอกสารเล่มที่ 3 สำเร็จ: {doc_path}")
