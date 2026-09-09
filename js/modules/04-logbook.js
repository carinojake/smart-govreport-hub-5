/**
 * 🏛️ MODULE 4: OJT LOGBOOK ENGINE (CLEAN SLATE)
 * ตารางบันทึก 5 วันมาตรฐานสารบรรณ, การจัดการ CRUD, และการคำนวณชั่วโมง
 */

export const THAI_NUMS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

export function toThaiNumber(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[0-9]/g, d => THAI_NUMS[parseInt(d, 10)]);
}

export class LogbookEngine {
  constructor() {
    this.currentWeek = 1;
    this.viewMode = 'brief'; // 'brief' หรือ 'full'
  }

  getCleanDayTemplate(dayIndex, dateStr = '') {
    return {
      id: `day-${Date.now()}-${dayIndex}`,
      date: dateStr,
      hours: 4.5,
      title: '',
      knowledge: '',
      problem: 'ไม่มี',
      sop: '',
      evidencePhotos: []
    };
  }

  getCleanWeekTemplate(weekNum) {
    const defaultDays = [];
    for (let i = 1; i <= 5; i++) {
      defaultDays.push(this.getCleanDayTemplate(i));
    }
    return defaultDays;
  }

  calculateWeekHours(entries) {
    if (!Array.isArray(entries)) return 0;
    return entries.reduce((acc, cur) => acc + (parseFloat(cur.hours) || 0), 0);
  }

  calculateTotalHours(allWeeks) {
    let sum = 0;
    for (const weekEntries of Object.values(allWeeks || {})) {
      sum += this.calculateWeekHours(weekEntries);
    }
    return sum;
  }
}

export const logbook = new LogbookEngine();
