import os
import sys
import json

# ตั้งค่า path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ojt_system.ai_client import OJTAIClient
from ojt_system.database import OJTDatabase
from ojt_system.a4_exporter import A4Exporter

def run_demo():
    print("=" * 70)
    print("🚀 เริ่มต้นระบบทดสอบการบันทึก OJT (90 ชม.) & ออกบันทึกข้อความราชการ")
    print("   ขับเคลื่อนโดย Gemini 2.5 Flash + ระบบความปลอดภัย PDPA + SQLite")
    print("=" * 70)

    # 1. เริ่มต้นฐานข้อมูล
    db_file = "ojt_logbook.db"
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"🧹 ล้างฐานข้อมูลเก่า ({db_file}) เพื่อเตรียมทดสอบใหม่สะอาดเอี่ยม")
        except Exception:
            pass

    db = OJTDatabase(db_file)
    ai_client = OJTAIClient()

    # 2. ข้อมูลจำลองการปฏิบัติงาน 5 วัน (พร้อมเคสทดสอบ PDPA: เบอร์โทร, บัตร ปชช., Line ID, อีเมล)
    daily_inputs = [
        {
            "date": "1 กันยายน 2569",
            "day": "จันทร์",
            "hours": 7.0,
            "raw": "ตรวจเช็คระบบ Network Core Switch ชั้น 3 และคอนฟิก VLAN กองทุนผู้สูงอายุ เจอสายแลนหลวมที่ห้องผู้อำนวยการ ช่างชื่อประสิทธิ์ เบอร์โทรติดต่อ 089-123-4567 บัตรประชาชน 1-1004-99887-12-3 ทำการย้ำหัว RJ-45 ใหม่และทดสอบ ping gateway 192.168.1.1 ผ่านฉลุย"
        },
        {
            "date": "2 กันยายน 2569",
            "day": "อังคาร",
            "hours": 7.0,
            "raw": "ติดตั้งและตั้งค่าการสำรองข้อมูลฐานข้อมูล PostgreSQL บน Docker Port 5432 อัตโนมัติ ตรวจพบ cronjob สิทธิ์ติดขัด จึงทักประสานงานผ่าน Line id: dev_admin_jake เพื่อขอสิทธิ์ root ดำเนินการทดสอบกู้คืน (Disaster Recovery Test) ข้อมูลสมบูรณ์ 100%"
        },
        {
            "date": "3 กันยายน 2569",
            "day": "พุธ",
            "hours": 7.0,
            "raw": "ตรวจสอบความปลอดภัยและ Audit Log ตามมาตรฐาน สกมช. บนเครื่องคอมพิวเตอร์ลูกข่าย 15 เครื่อง ตรวจพบเครื่องติด Malware โฆษณา 1 เครื่อง จึงแยก Segment VLAN เพื่อกักกัน และทำ Full Scan กำจัดมัลแวร์พร้อมอัปเดต Signature ปลอดภัย"
        },
        {
            "date": "4 กันยายน 2569",
            "day": "พฤหัสบดี",
            "hours": 7.0,
            "raw": "พัฒนาโมดูล API เชื่อมต่อระหว่างระบบบันทึกงานกับ LINE OA โดยใช้ FastAPI ทดสอบการรับส่ง Webhook และสกัดข้อมูลสลิปรายงานผลการทำงานแบบ Real-time ผลทดสอบ Latency เฉลี่ย 120ms"
        },
        {
            "date": "5 กันยายน 2569",
            "day": "ศุกร์",
            "hours": 7.0,
            "raw": "จัดทำคู่มือการใช้งานระบบ (SOP User Manual) จำนวน 1 ฉบับ และจัดทำสรุปสถิติการใช้งานประจำสัปดาห์ ส่งอีเมลรายงานให้หัวหน้างาน saraban_ops@dop.mail.go.th เรียบร้อย"
        }
    ]

    print("\n📌 [ขั้นตอนที่ 1] สกัดข้อมูลด้วย Template 1 (OCR/Text -> SOP + PDPA Masking -> SQLite)")
    for idx, item in enumerate(daily_inputs, 1):
        print(f"\n▶ วันที่ {idx} ({item['day']}): กำลังวิเคราะห์ข้อมูล...")
        activity_rec, pdpa_audit = ai_client.generate_activity_log(item['raw'], default_hours=item['hours'])
        
        # บันทึกลง SQLite
        row_id = db.insert_activity(
            activity=activity_rec,
            activity_date=item['date'],
            day_name=item['day'],
            week_number=1,
            raw_input=item['raw']
        )
        print(f"   ✓ บันทึกสำเร็จ (ID: {row_id}) | รหัส: {activity_rec.competency_code} | {activity_rec.activity_title}")
        print(f"   ⏱ ชั่วโมงสะสม: {db.get_latest_cumulative_hours():.1f} / 90.0 ชม.")
        if pdpa_audit:
            print(f"   🛡️ ตรวจพบและเซ็นเซอร์ PDPA: {', '.join(pdpa_audit)}")

    # 3. สร้าง Template 2: บันทึกข้อความราชการ
    print("\n" + "=" * 70)
    print("📌 [ขั้นตอนที่ 2] ร่างบันทึกข้อความราชการ (Template 2 - สารบรรณ พ.ศ. 2526)")
    memo_summary = "ตรวจสอบและปรับปรุงระบบเครือข่าย Core Switch, ตั้งค่าระบบสำรองข้อมูล PostgreSQL Docker, ตรวจสอบความปลอดภัยเครื่องลูกข่าย 15 เครื่อง, พัฒนา API เชื่อมต่อ LINE OA, และจัดทำคู่มือ SOP"
    memo_problems = "ตรวจพบสายแลนชำรุด 1 จุด และเครื่องลูกข่ายติดมัลแวร์ 1 เครื่อง ซึ่งได้ทำการแก้ไขและกักกันความเสียหายเรียบร้อยแล้ว"

    memo_rec = ai_client.generate_official_memo(
        week_number=1,
        current_date="5 กันยายน 2569",
        work_summary=memo_summary,
        problems=memo_problems,
        department="กองทุนผู้สูงอายุ กรมกิจการผู้สูงอายุ"
    )
    memo_id = db.insert_memo(memo_rec, week_number=1)
    print(f"   ✓ บันทึกข้อความสำเร็จ (ID: {memo_id})")
    print(f"   - เรื่อง: {memo_rec.subject}")
    print(f"   - ต้นเรื่อง: {memo_rec.origin_section[:80]}...")

    # 4. สร้าง Template 3: ผู้ควบคุมงานประเมินผล
    print("\n" + "=" * 70)
    print("📌 [ขั้นตอนที่ 3] พี่ใหญ่ PM (5.1) ประเมินผลและให้ข้อคิดเห็น (Template 3)")
    activities_list = db.get_activities_by_week(week_number=1)
    act_summary_text = "\n".join([f"- {a['day_name']}: {a['activity_title']} ({a['hours']} ชม.) เครื่องมือ: {a['tools_used']}" for a in activities_list])

    eval_rec = ai_client.generate_supervisor_feedback(act_summary_text)
    eval_id = db.insert_evaluation(eval_rec, week_number=1, supervisor_name="พี่ใหญ่ PM (5.1)")
    print(f"   ✓ บันทึกผลการประเมินสำเร็จ (ID: {eval_id})")
    print(f"   - คะแนน: {eval_rec.suggested_score} / 5 ดาว")
    print(f"   - ข้อคิดเห็น: {eval_rec.supervisor_comment}")
    print(f"   - ข้อเสนอแนะ: {eval_rec.development_advice}")

    # 5. สร้างเอกสารรายงาน A4
    print("\n" + "=" * 70)
    print("📌 [ขั้นตอนที่ 4] ออกรายงานสมุดบันทึก OJT และบันทึกข้อความราชการขนาด A4")
    progress = db.get_progress_summary(target_hours=90.0)
    memo_data = db.get_memo_by_week(1)
    eval_data = db.get_evaluation_by_week(1)

    html_content = A4Exporter.generate_html_report(
        activities=activities_list,
        memo=memo_data,
        evaluation=eval_data,
        progress=progress,
        student_name="นายปฏิภาณ มุ่งมั่นงาน (นักศึกษาฝึกงาน)",
        supervisor_name="พี่ใหญ่ PM (5.1) ผู้ควบคุมงาน"
    )

    output_html_path = "ojt_report_a4.html"
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"   ✓ สร้างเอกสารรายงานเรียบร้อยแล้ว: {output_html_path}")
    print(f"   📊 สถานะ OJT: ปฏิบัติงานไปแล้ว {progress['completed_hours']} / {progress['target_hours']} ชม. ({progress['progress_percent']}%) คงเหลือ {progress['remaining_hours']} ชม.")
    print("=" * 70)
    print("🎉 ดำเนินการทดสอบครบทุกขั้นตอนสำเร็จเรียบร้อยแล้วค่ะ!")

if __name__ == "__main__":
    run_demo()
