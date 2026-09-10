from pydantic import BaseModel, Field
from typing import Optional, List

class OJTActivityRecord(BaseModel):
    """Template 1: สกัดข้อมูลจากภาพถ่ายหน้างาน / เอกสาร (OCR + SOP Generator)"""
    activity_title: str = Field(description="ชื่องาน/กิจกรรมที่เป็นทางการและสอดคล้องกับมาตรฐานกำหนดตำแหน่ง")
    hours: float = Field(default=7.0, description="จำนวนชั่วโมงปฏิบัติงาน (เช่น 7.0 หรือ 8.0)")
    competency_code: str = Field(description="รหัสสมรรถนะ (เช่น IT-01, NET-02, GOV-01)")
    sop_procedure: str = Field(description="ขั้นตอนการปฏิบัติงานโดยละเอียด 3-5 ขั้นตอน (ใช้คำว่า 1. ... 2. ...)")
    tools_used: str = Field(description="เครื่องมือ ฮาร์ดแวร์ หรือซอฟต์แวร์ที่ใช้งาน")
    problems_and_solutions: str = Field(default="ไม่พบปัญหาอุปสรรค การปฏิบัติงานดำเนินไปด้วยความเรียบร้อย", description="ปัญหาที่พบและแนวทางแก้ไข (ถ้ามี)")
    pdpa_redaction_notes: str = Field(default="ตรวจไม่พบข้อมูลส่วนบุคคลที่มีความอ่อนไหว", description="รายการข้อมูลอ่อนไหวที่ตรวจพบและทำการเซ็นเซอร์แล้ว")

class OfficialMemoRecord(BaseModel):
    """Template 2: ร่างบันทึกข้อความราชการ (Official Memo Generator)"""
    department: str = Field(default="กองทุนผู้สูงอายุ กรมกิจการผู้สูงอายุ", description="ส่วนราชการเจ้าของเรื่อง")
    doc_number: str = Field(default="พม 0605/ว-พิเศษ", description="เลขที่หนังสือราชการ")
    date_str: str = Field(description="วันที่ร่างบันทึกข้อความ")
    subject: str = Field(description="เรื่อง")
    origin_section: str = Field(description="ต้นเรื่อง (ด้วย... มีความประสงค์...)")
    facts_section: str = Field(description="ข้อเท็จจริง (ในการนี้ ผลการดำเนินงานปรากฏดังนี้...)")
    consideration_section: str = Field(description="ข้อพิจารณาและข้อเสนอ (จึงเรียนมาเพื่อโปรดพิจารณา...)")
    signatory_title: str = Field(default="นักศึกษาฝึกงาน / ผู้ปฏิบัติงานโครงการ OJT", description="ตำแหน่งผู้ลงนาม")

class SupervisorFeedbackRecord(BaseModel):
    """Template 3: ผู้ควบคุมงานประเมินผลและให้ข้อคิดเห็น (Supervisor Feedback Assistant)"""
    supervisor_comment: str = Field(description="ข้อคิดเห็นของผู้ควบคุมงาน 2-3 บรรทัด เชิงสร้างสรรค์ สะท้อนวินัยและทักษะ")
    suggested_score: int = Field(ge=1, le=5, description="ระดับคะแนนการประเมิน (1 - 5)")
    development_advice: str = Field(description="ข้อเสนอแนะเพื่อการพัฒนาในสัปดาห์ถัดไป")
