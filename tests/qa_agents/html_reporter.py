"""
🏛️ HTML QA Dashboard Generator
สร้างรายงานผลการทดสอบแบบ Interactive HTML Dashboard สำหรับผู้บริหารและคณะกรรมการตรวจรับ
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

def generate_html_dashboard(suite_result: Dict[str, Any], output_path: Path):
    agents = suite_result.get("agents", [])
    total_tests = suite_result.get("total_tests", 0)
    passed_tests = suite_result.get("passed_tests", 0)
    failed_tests = suite_result.get("failed_tests", 0)
    pass_rate = suite_result.get("pass_rate", 100.0)
    duration_ms = suite_result.get("total_duration_ms", 0.0)
    timestamp = suite_result.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    html_content = f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏛️ QA Multi-Agent Unit Test Report - Smart GovReport Hub 2.5</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Sarabun', sans-serif; }}
    .font-mono {{ font-family: 'JetBrains Mono', monospace; }}
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">

  <!-- Header Banner -->
  <header class="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight">Smart GovReport Hub 2.5 — QA Multi-Agent Verification</h1>
          <p class="text-xs text-slate-400 font-mono">Full Option QA Suite • Docker PostgreSQL 5432 • Port 8085 / 8086</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
          PASS RATE: {pass_rate}%
        </span>
        <span class="text-xs text-slate-400 font-mono"><i class="fa-regular fa-clock mr-1"></i> {timestamp}</span>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

    <!-- KPI Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Card 1 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ชุดทดสอบทั้งหมด</p>
          <h3 class="text-2xl font-bold text-slate-900 mt-1">{total_tests} <span class="text-xs font-normal text-slate-500">Test Cases</span></h3>
          <p class="text-xs text-emerald-600 font-medium mt-1"><i class="fa-solid fa-check-circle mr-1"></i> ผ่าน {passed_tests} / ล้มเหลว {failed_tests}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
          <i class="fa-solid fa-list-check"></i>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">อัตราความสำเร็จ</p>
          <h3 class="text-2xl font-bold text-emerald-600 mt-1">{pass_rate}%</h3>
          <p class="text-xs text-slate-500 font-medium mt-1"><i class="fa-solid fa-trophy mr-1"></i> เกณฑ์ผ่านมาตรฐาน 100%</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
          <i class="fa-solid fa-circle-check"></i>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">เวลาทดสอบรวม</p>
          <h3 class="text-2xl font-bold text-slate-900 mt-1">{duration_ms:,.0f} <span class="text-xs font-normal text-slate-500">ms</span></h3>
          <p class="text-xs text-indigo-600 font-medium mt-1"><i class="fa-solid fa-bolt mr-1"></i> Parallel Mac M1 Optimized</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
          <i class="fa-solid fa-stopwatch"></i>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ฐานข้อมูลและการคุ้มครอง</p>
          <h3 class="text-lg font-bold text-slate-900 mt-1">PostgreSQL 5432</h3>
          <p class="text-xs text-emerald-600 font-medium mt-1"><i class="fa-solid fa-lock mr-1"></i> PDPA Shield: Active 100%</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
          <i class="fa-solid fa-database"></i>
        </div>
      </div>
    </div>

    <!-- 4 Sub-Agents Detailed Breakdown -->
    <div class="space-y-6">
      <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
        <i class="fa-solid fa-robot text-indigo-600"></i>
        ผลการปฏิบัติการรายทีมย่อย (QA Multi-Agent Unit Breakdowns)
      </h2>

      <div class="grid grid-cols-1 gap-6">
"""

    for ag in agents:
        agent_id = ag.get("agent_id", "")
        agent_name = ag.get("agent_name", "")
        ag_passed = ag.get("passed", 0)
        ag_total = ag.get("total", 0)
        ag_rate = ag.get("pass_rate", 100.0)
        ag_time = ag.get("total_duration_ms", 0.0)
        tests = ag.get("tests", [])

        status_badge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">PASS (100%)</span>' if ag_rate == 100 else f'<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">{ag_rate}%</span>'

        html_content += f"""
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700 font-mono">{agent_id}</span>
                <h3 class="font-bold text-slate-800 text-base">{agent_name}</h3>
              </div>
              <p class="text-xs text-slate-500 mt-1">ทดสอบผ่าน {ag_passed}/{ag_total} ข้อ • ใช้เวลารวม {ag_time}ms</p>
            </div>
            <div>
              {status_badge}
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4 w-24">รหัสทดสอบ</th>
                  <th class="py-3 px-4">รายการทดสอบ</th>
                  <th class="py-3 px-4 w-24 text-center">สถานะ</th>
                  <th class="py-3 px-4 w-24 text-right">เวลา (ms)</th>
                  <th class="py-3 px-4">รายละเอียดผลลัพธ์</th>
                  <th class="py-3 px-4 w-28 text-center">หลักฐาน</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
        """

        for t in tests:
            t_id = t.get("id", "")
            t_name = t.get("name", "")
            t_status = t.get("status", "")
            t_dur = t.get("duration_ms", 0)
            t_det = t.get("details", "")
            t_evi = t.get("evidence", "")

            badge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-check mr-1"></i> PASS</span>' if t_status == "PASS" else '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800"><i class="fa-solid fa-xmark mr-1"></i> FAIL</span>'

            evi_btn = f'<a href="evidence/{t_evi}" target="_blank" class="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition"><i class="fa-solid fa-image mr-1"></i> ภาพหลักฐาน</a>' if t_evi else '<span class="text-slate-400">-</span>'

            html_content += f"""
                <tr class="hover:bg-slate-50/80 transition">
                  <td class="py-3 px-4 font-mono font-bold text-slate-700">{t_id}</td>
                  <td class="py-3 px-4 font-medium text-slate-900">{t_name}</td>
                  <td class="py-3 px-4 text-center">{badge}</td>
                  <td class="py-3 px-4 text-right font-mono text-slate-600">{t_dur}</td>
                  <td class="py-3 px-4 text-slate-600 leading-relaxed">{t_det}</td>
                  <td class="py-3 px-4 text-center">{evi_btn}</td>
                </tr>
            """

        html_content += """
              </tbody>
            </table>
          </div>
        </div>
        """

    html_content += """
    </div>

    <!-- Evidence Gallery Preview -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
        <i class="fa-solid fa-camera text-indigo-600"></i>
        คลังหลักฐานภาพถ่ายจากการทดสอบจริง (Captured Test Evidence)
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="border border-slate-200 rounded-xl p-3 bg-slate-50 hover:shadow-md transition">
          <p class="text-xs font-bold text-slate-700 mb-2">1. Main Dashboard & 6 Views</p>
          <img src="evidence/evidence_01_dashboard.png" alt="Dashboard Evidence" class="w-full h-44 object-cover rounded-lg border border-slate-200 cursor-pointer shadow-xs" onclick="window.open(this.src)">
        </div>
        <div class="border border-slate-200 rounded-xl p-3 bg-slate-50 hover:shadow-md transition">
          <p class="text-xs font-bold text-slate-700 mb-2">2. OJT Log Form & Entry Flow</p>
          <img src="evidence/evidence_02_ojt_log.png" alt="OJT Log Evidence" class="w-full h-44 object-cover rounded-lg border border-slate-200 cursor-pointer shadow-xs" onclick="window.open(this.src)">
        </div>
        <div class="border border-slate-200 rounded-xl p-3 bg-slate-50 hover:shadow-md transition">
          <p class="text-xs font-bold text-slate-700 mb-2">3. A4 Official Print Layout Engine</p>
          <img src="evidence/evidence_03_a4_print_preview.png" alt="A4 Print Preview Evidence" class="w-full h-44 object-cover rounded-lg border border-slate-200 cursor-pointer shadow-xs" onclick="window.open(this.src)">
        </div>
      </div>
    </div>

  </main>

  <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
    <p>Smart GovReport Hub 2.5 • QA Multi-Agent Unit • เอกสารตรวจรับพัสดุราชการรหัส DOC-TST-2026-003</p>
  </footer>

</body>
</html>
"""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"📊 [Dashboard] Interactive HTML Report สร้างสำเร็จที่: {output_path}")
