/**
 * 🏛️ MODULE 7: EXECUTIVE DASHBOARD & SUPERVISOR COMMAND
 * วิเคราะห์สมรรถนะดิจิทัล 4 ด้าน, รายชื่อเด็กฝึกงาน (1:M Roster) และระบบตรวจงานแบบชุด
 */

export class DashboardAnalytics {
  constructor() {
    this.competencies = {
      digitalTools: 85,
      govSaraban: 90,
      publicService: 88,
      agileProject: 82
    };
  }

  getOverallScore() {
    const vals = Object.values(this.competencies);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  getGrade(score) {
    if (score >= 85) return 'ดีเยี่ยม (Grade A)';
    if (score >= 75) return 'ดีมาก (Grade B+)';
    if (score >= 65) return 'ดี (Grade B)';
    return 'ผ่านเกณฑ์มาตรฐาน (Pass)';
  }

  renderSupervisorRoster(containerId, trainees = []) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (trainees.length === 0) {
      el.innerHTML = `
        <div class="text-center py-6 text-slate-400 text-xs">
          <i class="fa-solid fa-users text-2xl mb-1 text-slate-300"></i>
          <p>ยังไม่มีรายชื่อเด็กฝึกงานในสังกัด (สถานะ Clean Slate)</p>
        </div>
      `;
      return;
    }

    el.innerHTML = trainees.map(t => `
      <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h4 class="font-bold text-xs text-slate-900">${t.name}</h4>
          <p class="text-[11px] text-slate-500">${t.department} • สะสม ${t.hours} ชม.</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${t.status === 'approved' ? 'อนุมัติแล้ว' : 'รอการตรวจ'}
        </span>
      </div>
    `).join('');
  }
}

export const dashboard = new DashboardAnalytics();
