/**
 * 🏛️ MODULE 8: GOVERNMENT DOCUMENTS SUITE
 * เอกสารมาตรฐานภาครัฐ: ผืนผ้าใบ Project Canvas, บันทึกข้อความ 2526, และ Portfolio
 */

export class GovDocumentsSuite {
  constructor() {
    this.canvasData = {
      problem: 'การรายงานผลจ้างงานคนพิการเดิมซ้ำซ้อน เอกสารกระดาษสูญหายง่าย ขาดระบบจัดเก็บสมรรถนะดิจิทัล',
      solution: 'พัฒนา Web App สำหรับบันทึก OJT และสร้างเล่ม Portfolio มาตรฐานภาครัฐในไฟล์เดียว',
      targetGroup: 'ผู้เข้าอบรมคนพิการ, หัวหน้างานฝ่ายสารบรรณ/ไอที และคณะกรรมการประเมินผล',
      sprints: 'Sprint 1: ออกแบบ UI/UX, Sprint 2: พัฒนาระบบบันทึก OJT, Sprint 3: ทดสอบ Accessibility',
      kpis: 'ชั่วโมงฝึกงานครบ 90 ชม. (100%), ผ่านเกณฑ์มาตรฐาน WCAG 2.1 AA',
      raci: 'R: ผู้ฝึกงาน, A: ผอ.กลุ่มงาน, C: วิทยากร ก.พ.ร., I: คณะกรรมการ'
    };

    this.officialMemo = {
      org: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สำนักงานปลัดกระทรวงยุติธรรม',
      number: 'ยธ ๐๒๐๔/พิเศษ',
      date: '๓๐ กันยายน ๒๕๖๙',
      subject: 'รายงานผลการปฏิบัติงานตามโครงการส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ',
      intro: 'ตามที่ข้าพเจ้าได้รับมอบหมายให้เข้ารับการฝึกปฏิบัติงาน...',
      facts: 'บัดนี้ การปฏิบัติงานได้ดำเนินการครบถ้วน ๙๐ ชั่วโมงแล้ว...',
      proposal: 'จึงเรียนมาเพื่อโปรดทราบและพิจารณาลงนามรับรองผล'
    };
  }

  getCanvas() {
    return this.canvasData;
  }

  getMemo() {
    return this.officialMemo;
  }
}

export const govDocs = new GovDocumentsSuite();
