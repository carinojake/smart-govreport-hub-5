import html
from typing import List, Dict, Any, Optional

class A4Exporter:
    """
    โมดูลสร้างเอกสารแบบฟอร์ม A4 มาตรฐานราชการไทย
    รองรับการจัดพิมพ์ (Print to PDF) ด้วย CSS @media print สำหรับ OJT 90 ชม.
    """

    GARUDA_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 115" width="80" height="92" style="display:block; margin: 0 auto 10px auto;">
        <!-- จำลองสัญลักษณ์ตราครุฑทางการสำหรับหัวกระดาษราชการ -->
        <path d="M50 5 C55 15, 65 20, 75 18 C70 28, 62 32, 58 40 C65 42, 80 40, 92 35 C88 48, 75 52, 65 55 C78 60, 88 68, 95 80 C82 78, 72 72, 63 68 C65 78, 68 90, 72 105 C62 98, 55 88, 50 78 C45 88, 38 98, 28 105 C32 90, 35 78, 37 68 C28 72, 18 78, 5 80 C12 68, 22 60, 35 55 C25 52, 12 48, 8 35 C20 40, 35 42, 42 40 C38 32, 30 28, 25 18 C35 20, 45 15, 50 5 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="1.5"/>
        <circle cx="50" cy="45" r="7" fill="#b91c1c"/>
    </svg>"""

    @classmethod
    def generate_html_report(
        cls,
        activities: List[Dict[str, Any]],
        memo: Optional[Dict[str, Any]],
        evaluation: Optional[Dict[str, Any]],
        progress: Dict[str, Any],
        student_name: str = "นายสมชาย มุ่งมั่นพัฒนา (นักศึกษาฝึกงาน)",
        supervisor_name: str = "นายศักดิ์สิทธิ์ ชำนาญการ (พี่ใหญ่ PM - 5.1)"
    ) -> str:
        # คำนวณสรุป
        target_hours = progress.get("target_hours", 90.0)
        completed_hours = progress.get("completed_hours", 0.0)
        remaining_hours = progress.get("remaining_hours", 90.0)
        pct = progress.get("progress_percent", 0.0)

        # แถวตารางกิจกรรม
        rows_html = []
        for idx, act in enumerate(activities, 1):
            sop_formatted = "<br>".join([html.escape(line.strip()) for line in act["sop_procedure"].split("\n") if line.strip()])
            rows_html.append(f"""
            <tr>
                <td class="text-center font-bold">{idx}</td>
                <td>
                    <strong>{html.escape(act['activity_date'])}</strong><br>
                    <span class="text-muted">({html.escape(act.get('day_name', ''))})</span>
                </td>
                <td>
                    <div class="font-bold text-primary">{html.escape(act['activity_title'])}</div>
                    <span class="badge badge-code">{html.escape(act['competency_code'])}</span>
                </td>
                <td class="text-center">
                    <span class="font-bold">{act['hours']:.1f} ชม.</span><br>
                    <small class="text-muted">(สะสม {act['cumulative_hours']:.1f})</small>
                </td>
                <td class="sop-cell">{sop_formatted}</td>
                <td><small>{html.escape(act['tools_used'])}</small></td>
                <td><small>{html.escape(act['problems_and_solutions'])}</small></td>
                <td>
                    <span class="badge badge-success">✓ ผ่าน PDPA</span><br>
                    <small class="text-muted">{html.escape(act['pdpa_redaction_notes'])}</small>
                </td>
            </tr>
            """)

        table_body = "\n".join(rows_html)

        # ข้อมูลบันทึกข้อความ
        memo_dept = memo.get("department", "กองทุนผู้สูงอายุ กรมกิจการผู้สูงอายุ") if memo else "กองทุนผู้สูงอายุ กรมกิจการผู้สูงอายุ"
        memo_doc = memo.get("doc_number", "พม 0605/ว-พิเศษ") if memo else "พม 0605/ว-พิเศษ"
        memo_date = memo.get("memo_date", "5 กันยายน 2569") if memo else "5 กันยายน 2569"
        memo_subject = memo.get("subject", "รายงานผลการฝึกปฏิบัติงานภาคปฏิบัติ (OJT) ประจำสัปดาห์ที่ 1") if memo else "รายงานผลการฝึกปฏิบัติงานภาคปฏิบัติ (OJT)"
        memo_origin = memo.get("origin_section", "ด้วยผู้รายงานได้ปฏิบัติหน้าที่ตามแผนการฝึกงาน...") if memo else ""
        memo_facts = memo.get("facts_section", "ในการนี้ การปฏิบัติงานในรอบสัปดาห์เป็นไปด้วยความเรียบร้อย...") if memo else ""
        memo_consider = memo.get("consideration_section", "จึงเรียนมาเพื่อโปรดพิจารณาและลงนามรับรอง...") if memo else ""

        # ข้อมูลการประเมิน
        eval_comment = evaluation.get("supervisor_comment", "ผู้ฝึกงานมีความตั้งใจและเรียนรู้ระบบได้รวดเร็ว") if evaluation else "อยู่ระหว่างการประเมิน"
        eval_score = evaluation.get("suggested_score", 5) if evaluation else 5
        eval_advice = evaluation.get("development_advice", "มุ่งเน้นการฝึกทักษะการตรวจสอบความปลอดภัยของระบบเพิ่มเติม") if evaluation else "-"
        stars = "★" * eval_score + "☆" * (5 - eval_score)

        return f"""<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>สมุดบันทึก OJT (90 ชั่วโมง) และบันทึกข้อความราชการ</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --primary: #1e3a8a;
            --secondary: #0f766e;
            --accent: #b91c1c;
            --bg-page: #f8fafc;
            --text-main: #1f2937;
            --border-color: #cbd5e1;
        }}
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #525659;
            color: var(--text-main);
            padding: 20px 0;
            line-height: 1.6;
        }}
        .a4-page {{
            background: white;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto 30px auto;
            padding: 25mm 20mm 20mm 25mm; /* ขอบกระดาษราชการ ซ้าย 2.5 ซม. */
            box-shadow: 0 4px 15px rgba(0,0,0,0.25);
            position: relative;
        }}
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            .a4-page {{
                margin: 0;
                box-shadow: none;
                page-break-after: always;
                width: 100%;
                min-height: 100%;
                padding: 20mm 15mm 15mm 20mm;
            }}
            .no-print {{
                display: none !important;
            }}
        }}

        /* Typography & ราชการ */
        .text-center {{ text-align: center; }}
        .text-right {{ text-align: right; }}
        .font-bold {{ font-weight: 700; }}
        .text-primary {{ color: var(--primary); }}
        .text-muted {{ color: #64748b; }}

        .memo-title {{
            font-size: 26pt;
            font-weight: 700;
            letter-spacing: 2px;
            margin-top: 10px;
            color: #111827;
        }}
        .memo-header-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 20px;
        }}
        .memo-header-table td {{
            padding: 4px 6px;
            font-size: 15pt;
            vertical-align: top;
        }}
        .memo-divider {{
            border-bottom: 2px solid #111827;
            margin: 15px 0 20px 0;
        }}
        .memo-body {{
            font-size: 15pt;
            text-align: justify;
            text-justify: inter-cluster;
        }}
        .memo-para {{
            text-indent: 2.5cm;
            margin-bottom: 14px;
        }}
        .signature-block {{
            float: right;
            width: 260px;
            text-align: center;
            margin-top: 40px;
            font-size: 15pt;
        }}

        /* Table & Components */
        table.data-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 10.5pt;
        }}
        table.data-table th, table.data-table td {{
            border: 1px solid var(--border-color);
            padding: 7px 8px;
            vertical-align: top;
        }}
        table.data-table th {{
            background-color: #f1f5f9;
            font-weight: 700;
            text-align: center;
        }}
        .badge {{
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: 600;
        }}
        .badge-code {{
            background-color: #e0e7ff;
            color: #3730a3;
        }}
        .badge-success {{
            background-color: #dcfce7;
            color: #166534;
        }}
        .sop-cell {{
            font-size: 9.5pt;
            line-height: 1.4;
        }}

        /* Progress Card */
        .progress-container {{
            background: linear-gradient(135deg, #1e3a8a, #0f766e);
            color: white;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .progress-bar-wrap {{
            width: 100%;
            background: rgba(255,255,255,0.25);
            height: 12px;
            border-radius: 6px;
            overflow: hidden;
            margin-top: 8px;
        }}
        .progress-bar-fill {{
            background: #22c55e;
            height: 100%;
            width: {pct}%;
        }}

        .eval-box {{
            border: 2px dashed #0284c7;
            background-color: #f0f9ff;
            border-radius: 8px;
            padding: 16px 20px;
            margin-top: 20px;
        }}
        .stars {{
            color: #f59e0b;
            font-size: 18pt;
            letter-spacing: 2px;
        }}

        .action-bar {{
            max-width: 210mm;
            margin: 0 auto 15px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .btn {{
            background-color: #1e3a8a;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 13pt;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }}
        .btn:hover {{
            background-color: #1d4ed8;
        }}
    </style>
</head>
<body>

    <div class="action-bar no-print">
        <span style="color: white; font-size: 14pt; font-weight: 600;">
            ระบบบันทึก OJT (90 ชั่วโมง) & บันทึกข้อความราชการ | น้องฟ้า (5.11)
        </span>
        <button class="btn" onclick="window.print()">🖨️ พิมพ์เอกสาร A4 (Print to PDF)</button>
    </div>

    <!-- ==================== หน้าที่ 1: บันทึกข้อความราชการ ==================== -->
    <div class="a4-page">
        <div style="text-align: center;">
            {cls.GARUDA_SVG}
            <h1 class="memo-title">บันทึกข้อความ</h1>
        </div>

        <table class="memo-header-table">
            <tr>
                <td style="width: 55%;"><strong>ส่วนราชการ</strong> {html.escape(memo_dept)}</td>
                <td style="width: 45%;"><strong>โทร.</strong> 02-***-4000</td>
            </tr>
            <tr>
                <td><strong>ที่</strong> {html.escape(memo_doc)}</td>
                <td><strong>วันที่</strong> {html.escape(memo_date)}</td>
            </tr>
            <tr>
                <td colspan="2"><strong>เรื่อง</strong> {html.escape(memo_subject)}</td>
            </tr>
        </table>

        <div class="memo-divider"></div>

        <div class="memo-body">
            <p><strong>เรียน</strong> ผู้ควบคุมงานฝึกปฏิบัติงาน (OJT) / หัวหน้ากลุ่มงานเทคโนโลยีสารสนเทศ</p>
            <br>
            <p class="memo-para">
                <strong>๑. ต้นเรื่อง</strong><br>
                {html.escape(memo_origin)}
            </p>
            <p class="memo-para">
                <strong>๒. ข้อเท็จจริง</strong><br>
                {html.escape(memo_facts)}
            </p>
            <p class="memo-para">
                <strong>๓. ข้อพิจารณาและข้อเสนอ</strong><br>
                {html.escape(memo_consider)}
            </p>
        </div>

        <div class="signature-block">
            <br><br>
            <p>(..........................................................)</p>
            <p style="margin-top: 5px;"><strong>{student_name}</strong></p>
            <p style="color: #4b5563;">ผู้ปฏิบัติงานฝึกอบรม (OJT)</p>
        </div>
    </div>

    <!-- ==================== หน้าที่ 2: สมุดบันทึก OJT รายวัน (90 ชม.) ==================== -->
    <div class="a4-page">
        <div class="progress-container">
            <div style="flex: 1; margin-right: 25px;">
                <div style="display: flex; justify-content: space-between; font-size: 13pt;">
                    <span><strong>ความก้าวหน้าโครงการ OJT (เป้าหมาย {target_hours:.0f} ชั่วโมง)</strong></span>
                    <span><strong>{completed_hours:.1f} / {target_hours:.0f} ชม. ({pct:.1f}%)</strong></span>
                </div>
                <div class="progress-bar-wrap">
                    <div class="progress-bar-fill"></div>
                </div>
            </div>
            <div style="text-align: right; min-width: 140px;">
                <div style="font-size: 10pt; opacity: 0.9;">ชั่วโมงคงเหลือ</div>
                <div style="font-size: 18pt; font-weight: 700; color: #fef08a;">{remaining_hours:.1f} ชม.</div>
            </div>
        </div>

        <h2 style="font-size: 16pt; margin-bottom: 8px; color: #1e3a8a;">
            📋 รายละเอียดกิจกรรมการปฏิบัติงานประจำสัปดาห์ (OJT Logbook)
        </h2>
        <p style="font-size: 10.5pt; color: #475569; margin-bottom: 12px;">
            * ผ่านการตรวจสอบและเซ็นเซอร์ข้อมูลส่วนบุคคล (PDPA Double-Shield) ก่อนบันทึกลงระบบ
        </p>

        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 5%;">ลำดับ</th>
                    <th style="width: 13%;">วัน/วันที่</th>
                    <th style="width: 21%;">กิจกรรม / รหัส</th>
                    <th style="width: 11%;">ชั่วโมง</th>
                    <th style="width: 24%;">ขั้นตอนปฏิบัติ (SOP)</th>
                    <th style="width: 12%;">เครื่องมือ</th>
                    <th style="width: 14%;">ปัญหา/แก้ไข</th>
                    <th style="width: 10%;">PDPA</th>
                </tr>
            </thead>
            <tbody>
                {table_body}
            </tbody>
        </table>

        <!-- กล่องการประเมินของผู้ควบคุมงาน -->
        <div class="eval-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h3 style="font-size: 13.5pt; color: #0369a1;">
                    ⭐ ข้อคิดเห็นและการประเมินของผู้ควบคุมงาน (Supervisor Assessment)
                </h3>
                <div class="stars">{stars} <span style="font-size: 12pt; color: #1e293b;">({eval_score}/5 ดาว)</span></div>
            </div>
            <p style="font-size: 11.5pt; margin-bottom: 8px;">
                <strong>ข้อคิดเห็น:</strong> {html.escape(eval_comment)}
            </p>
            <p style="font-size: 11.5pt; color: #0f766e;">
                <strong>ข้อเสนอแนะเพื่อการพัฒนา:</strong> {html.escape(eval_advice)}
            </p>
            <div style="text-align: right; margin-top: 15px;">
                <span>ลงนามผู้ควบคุมงาน: .......................................................... (<strong>{supervisor_name}</strong>)</span>
            </div>
        </div>
    </div>

</body>
</html>"""
