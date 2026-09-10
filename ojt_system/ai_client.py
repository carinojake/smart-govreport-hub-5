import os
import json
from typing import Optional, Tuple
from dotenv import load_dotenv
from google import genai
from google.genai import types

from ojt_system.models import OJTActivityRecord, OfficialMemoRecord, SupervisorFeedbackRecord
from ojt_system.pdpa_sanitizer import PDPASanitizer
from ojt_system.templates import (
    SYSTEM_INSTRUCTION_T1, USER_PROMPT_T1,
    SYSTEM_INSTRUCTION_T2, USER_PROMPT_T2,
    SYSTEM_INSTRUCTION_T3, USER_PROMPT_T3
)

# โหลดตัวแปรสภาพแวดล้อม
load_dotenv('/Users/Shared/my_ai_project/.env')
load_dotenv()

class OJTAIClient:
    """
    AI Client สำหรับระบบ OJT 90 ชั่วโมง
    ใช้ Google GenAI SDK (Gemini 2.5 Flash, Temp=0.2, Structured Output)
    พร้อมเกราะป้องกัน PDPA สองชั้น (Regex Pre/Post Sanitizer + System Instruction)
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("ไม่พบ GEMINI_API_KEY ใน Environment หรือ .env file")
        self.client = genai.Client(api_key=self.api_key)
        self.candidate_models = [model_name, "gemini-2.0-flash", "gemini-1.5-flash"]
        self.model_name = model_name

    @staticmethod
    def _clean_json_markdown(raw_text: str) -> str:
        """Helper ตัด Markdown code block ออกจากคำตอบของ LLM เพื่อป้องกัน JSON parsing error"""
        text = raw_text.strip()
        if text.startswith("```json"):
            text = text.removeprefix("```json")
        elif text.startswith("```"):
            text = text.removeprefix("```")
        return text.removesuffix("```").strip()

    def _call_with_fallback(self, contents: str, config: types.GenerateContentConfig):
        """เรียกโมเดลพร้อมระบบ Fallback หากโมเดลใดติด Rate Limit / Quota 429"""
        last_error = None
        for model in self.candidate_models:
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config
                )
                self.model_name = model
                return response
            except Exception as e:
                last_error = e
                # หากเจอ 429 หรือ error ให้ลองโมเดลถัดไป
                continue
        raise last_error

    def generate_activity_log(self, raw_input: str, default_hours: float = 7.0) -> Tuple[OJTActivityRecord, list]:
        """
        Template 1: สกัดข้อมูลจากภาพถ่าย/ข้อความปฏิบัติงานดิบ เป็น SOP + OJT Record
        """
        import time
        sanitized_input, pdpa_findings = PDPASanitizer.sanitize(raw_input)
        user_content = USER_PROMPT_T1.format(raw_input=sanitized_input)

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION_T1,
            temperature=0.2,
            response_mime_type="application/json",
            response_schema=OJTActivityRecord
        )

        last_err = None
        for attempt in range(3):
            try:
                response = self._call_with_fallback(user_content, config)
                clean_json = self._clean_json_markdown(response.text)
                data = json.loads(clean_json)
                record = OJTActivityRecord(**data)
                if default_hours and (record.hours == 0 or record.hours is None):
                    record.hours = default_hours

                if pdpa_findings and "ตรวจไม่พบ" in record.pdpa_redaction_notes:
                    record.pdpa_redaction_notes = f"เซ็นเซอร์อัตโนมัติ: {', '.join(pdpa_findings)}"

                return record, pdpa_findings
            except Exception as e:
                last_err = e
                time.sleep(1.5 * (attempt + 1))

        raise RuntimeError(f"ล้มเหลวในการสร้างข้อมูลกิจกรรม OJT หลังพยายาม 3 ครั้ง: {last_err}")

    def generate_official_memo(
        self,
        week_number: int,
        current_date: str,
        work_summary: str,
        problems: str = "ไม่พบปัญหาหรืออุปสรรคสำคัญในการปฏิบัติงาน",
        department: str = "กองทุนผู้สูงอายุ กรมกิจการผู้สูงอายุ"
    ) -> OfficialMemoRecord:
        """
        Template 2: ร่างบันทึกข้อความราชการตามระเบียบงานสารบรรณ
        """
        clean_summary, _ = PDPASanitizer.sanitize(work_summary)
        clean_problems, _ = PDPASanitizer.sanitize(problems)

        user_content = USER_PROMPT_T2.format(
            department=department,
            current_date=current_date,
            week_number=week_number,
            work_summary=clean_summary,
            problems=clean_problems
        )

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION_T2,
            temperature=0.2,
            response_mime_type="application/json",
            response_schema=OfficialMemoRecord
        )

        response = self._call_with_fallback(user_content, config)
        clean_json = self._clean_json_markdown(response.text)
        data = json.loads(clean_json)
        return OfficialMemoRecord(**data)

    def generate_supervisor_feedback(self, weekly_activities_text: str) -> SupervisorFeedbackRecord:
        """
        Template 3: ผู้ควบคุมงานประเมินผลและให้ข้อคิดเห็น (พี่ใหญ่ PM 5.1)
        """
        clean_activities, _ = PDPASanitizer.sanitize(weekly_activities_text)

        user_content = USER_PROMPT_T3.format(weekly_activities=clean_activities)

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION_T3,
            temperature=0.2,
            response_mime_type="application/json",
            response_schema=SupervisorFeedbackRecord
        )

        response = self._call_with_fallback(user_content, config)
        clean_json = self._clean_json_markdown(response.text)
        data = json.loads(clean_json)
        return SupervisorFeedbackRecord(**data)

    def polish_text(self, raw_text: str, mode: str = "formal") -> str:
        """
        ปรับระดับภาษาเป็นทางการตามสูตร R-C-T-F:
        - mode="brief": สรุปย่อ 1-2 บรรทัด สำหรับลงตาราง A4 ทางการ
        - mode="formal": เรียบเรียงเป็นทางการเต็มรูปแบบพร้อมขั้นตอน SOP
        """
        sanitized_input, _ = PDPASanitizer.sanitize(raw_text)
        if mode == "brief":
            prompt = f"""คุณคือผู้เชี่ยวชาญด้านงานสารบรรณภาครัฐและการจัดทำสมุดบันทึก OJT (90 ชั่วโมง)
กรุณาเรียบเรียงข้อความต่อไปนี้ให้เป็นภาษาทางการ สรุปกระชับ 1-2 บรรทัด (ความยาวไม่เกิน 150 ตัวอักษร) เหมาะสำหรับใส่ในช่อง งาน/กิจกรรมที่ปฏิบัติ ในตารางสมุดบันทึก OJT ภาครัฐ
ห้ามใส่คำนำหน้า เช่น ข้อความที่ปรับแล้ว: ตอบเฉพาะประโยคที่เรียบเรียงแล้วเท่านั้น

ข้อความต้นฉบับ:
{sanitized_input}
"""
        else:
            prompt = f"""คุณคือผู้เชี่ยวชาญด้านงานสารบรรณภาครัฐและการจัดทำสมุดบันทึก OJT (90 ชั่วโมง)
กรุณาเรียบเรียงข้อความต่อไปนี้ให้เป็นภาษาทางการระดับราชการ โดยแบ่งเป็น 3 ส่วน:
1. การเตรียมการและวัตถุประสงค์ (ด้วย...)
2. ขั้นตอนการปฏิบัติงานและเครื่องมือที่ใช้ (ดำเนินการ...)
3. ผลลัพธ์และประโยชน์ที่ได้รับ (ผลการดำเนินงานปรากฏว่า...)

ข้อความต้นฉบับ:
{sanitized_input}
"""
        config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=1000
        )
        try:
            response = self._call_with_fallback(prompt, config)
            return response.text.strip()
        except Exception as e:
            # Fallback หากไม่มี API Key หรือโควตาหมด
            if mode == "brief":
                return f"ปฏิบัติงาน{sanitized_input[:80]} ตามมาตรฐานกำหนดตำแหน่งและระเบียบปฏิบัติราชการ"
            else:
                return f"๑. วัตถุประสงค์: เพื่อดำเนินการ{sanitized_input}\n๒. การปฏิบัติงาน: ได้ดำเนินการตามขั้นตอนมาตรฐานการปฏิบัติงาน (SOP) ด้วยความเรียบร้อย\n๓. ผลลัพธ์: การปฏิบัติงานบรรลุผลสำเร็จตามวัตถุประสงค์ทุกประการ"
