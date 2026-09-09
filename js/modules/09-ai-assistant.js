/**
 * 🏛️ MODULE 9: GEMINI AI ASSISTANT
 * สรุปรายงานรายสัปดาห์ 3 บรรทัดภาษาทางการ และสังเคราะห์ภาพถ่าย SOP เป็นบันทึก OJT
 */

export class GeminiAiAssistant {
  constructor(apiBaseUrl = 'http://127.0.0.1:8086') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async summarizeWeek(weekNum, weekEntries) {
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/ai/summarize-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_num: weekNum,
          entries: weekEntries
        })
      });
      const data = await res.json();
      return data.summary || this.fallbackSummary(weekNum, weekEntries);
    } catch {
      return this.fallbackSummary(weekNum, weekEntries);
    }
  }

  fallbackSummary(weekNum, weekEntries) {
    const titles = (weekEntries || []).map(e => e.title).filter(Boolean);
    return `๑. ปฏิบัติหน้าที่การฝึกภาคปฏิบัติตามหลักสูตรสัปดาห์ที่ ${weekNum} ได้แก่ ${titles.slice(0, 2).join(' และ ')}\n๒. ได้รับความรู้และทักษะด้านเทคโนโลยีดิจิทัลภาครัฐตามระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖\n๓. ส่งมอบผลสัมฤทธิ์ครบถ้วนตามเกณฑ์มาตรฐาน ๒๒.๕ ชั่วโมงประจำสัปดาห์`;
  }
}

export const aiAssistant = new GeminiAiAssistant();
