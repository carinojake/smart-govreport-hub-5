/**
 * 🏛️ SMART GOVREPORT HUB 2.5 - MASTER APPLICATION ORCHESTRATOR
 * เชื่อมประสาน 10 โมดูลหลักแบบ Zero-Bundler ES Modules
 */

import { layout } from './modules/01-layout.js';
import { storage } from './modules/02-storage.js';
import { auth } from './modules/03-auth.js';
import { logbook, toThaiNumber } from './modules/04-logbook.js';
import { compressImageToDataUrl } from './modules/05-evidence.js';
import { signature } from './modules/06-signature.js';
import { dashboard } from './modules/07-dashboard.js';
import { govDocs } from './modules/08-gov-docs.js';
import { aiAssistant } from './modules/09-ai-assistant.js';
import { syncHub } from './modules/10-sync-hub.js';

class SmartGovApp25 {
  constructor() {
    this.currentWeek = 1;
    this.profile = {
      traineeName: '',
      orgName: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สำนักงานปลัดกระทรวงยุติธรรม',
      supervisorName: '',
      supervisorPos: ''
    };
    this.ojtWeeks = {};
    this.signatures = {};
  }

  async init() {
    console.log('🚀 [Smart GovReport Hub 2.5] Initializing 10 Modular Engines...');
    layout.init();
    await storage.init();

    // 1. โหลดข้อมูล Profile (Clean Slate if not found)
    const storedProfile = await storage.get('profile', 'main');
    if (storedProfile) {
      this.profile = storedProfile;
    }

    // 2. โหลดข้อมูล OJT Weeks
    for (let w = 1; w <= 5; w++) {
      const storedWeek = await storage.get('ojt_weeks', String(w));
      if (storedWeek) {
        this.ojtWeeks[w] = storedWeek;
      } else {
        // Clean Slate Template
        this.ojtWeeks[w] = logbook.getCleanWeekTemplate(w);
      }
    }

    // 3. ตรวจสอบสถานะ Server Database (PostgreSQL / SQLite)
    this.checkServerHealth();

    // 4. ผูกเหตุการณ์บนหน้าจอ
    this.bindEvents();

    // 5. Render หน้าจอ
    this.render();
    console.log('✅ [Smart GovReport Hub 2.5] Application Ready 100%!');
  }

  async checkServerHealth() {
    const health = await syncHub.checkServerDatabaseHealth();
    const badge = document.getElementById('server-status-badge');
    if (badge) {
      if (health.status === 'online') {
        badge.className = 'px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-1.5';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Server: ${health.database || 'PostgreSQL'} Ready</span>`;
      } else {
        badge.className = 'px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 text-xs font-semibold flex items-center space-x-1.5';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>Local-First (IndexedDB Ready)</span>`;
      }
    }
  }

  bindEvents() {
    // Week Switcher
    const weekSelect = document.getElementById('week-selector');
    if (weekSelect) {
      weekSelect.addEventListener('change', (e) => {
        this.currentWeek = parseInt(e.target.value, 10);
        this.render();
      });
    }

    // 1-Click Complete JSON Backup
    const backupBtn = document.getElementById('btn-instant-backup-v25');
    if (backupBtn) {
      backupBtn.addEventListener('click', () => this.handleInstantBackup());
    }

    // Print
    const printBtn = document.getElementById('btn-print-v25');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    // Tab Navigation
    window.switchTab = (tabId) => layout.switchTab(tabId);
    window.saveProfile = () => this.handleSaveProfile();
    window.addDayEntry = () => this.handleAddDayEntry();
    window.runAiSummary = () => this.handleAiSummary();
  }

  async handleInstantBackup() {
    try {
      const snapshot = await storage.exportFullSnapshot();
      const dateStr = new Date().toISOString().slice(0, 10);
      const name = (this.profile.traineeName || 'CleanSlate').replace(/\s+/g, '_');
      const filename = `SmartGov_2.5_Complete_Backup_${name}_${dateStr}.json`;
      syncHub.downloadJSONSnapshot(snapshot, filename);
      layout.showToast(`✅ สำรองข้อมูลครบ 10 โมดูลสำเร็จ (${filename})`, 'success');
    } catch (err) {
      layout.showToast('เกิดข้อผิดพลาดในการสำรองข้อมูล: ' + err.message, 'error');
    }
  }

  async handleSaveProfile() {
    const traineeInput = document.getElementById('profile-trainee-name');
    const orgInput = document.getElementById('profile-org-name');
    const supInput = document.getElementById('profile-sup-name');
    const supPosInput = document.getElementById('profile-sup-pos');

    this.profile = {
      traineeName: traineeInput?.value || '',
      orgName: orgInput?.value || 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สำนักงานปลัดกระทรวงยุติธรรม',
      supervisorName: supInput?.value || '',
      supervisorPos: supPosInput?.value || ''
    };

    await storage.set('profile', 'main', this.profile);
    layout.showToast('✅ บันทึกข้อมูลตั้งต้นเรียบร้อยแล้ว!', 'success');
    this.render();
  }

  async handleAddDayEntry() {
    const currentWeekEntries = this.ojtWeeks[this.currentWeek] || [];
    currentWeekEntries.push(logbook.getCleanDayTemplate(currentWeekEntries.length + 1));
    this.ojtWeeks[this.currentWeek] = currentWeekEntries;
    await storage.set('ojt_weeks', String(this.currentWeek), currentWeekEntries);
    layout.showToast(`เพิ่มรายการวันที่ ${currentWeekEntries.length} เรียบร้อยแล้ว`, 'success');
    this.render();
  }

  async handleAiSummary() {
    const entries = this.ojtWeeks[this.currentWeek] || [];
    const summary = await aiAssistant.summarizeWeek(this.currentWeek, entries);
    const modalEl = document.getElementById('ai-summary-result');
    if (modalEl) modalEl.innerText = summary;
    layout.showToast('✨ Gemini AI สรุปรายงานสำเร็จ 3 บรรทัดทางการ', 'success');
  }

  render() {
    // Header & Profile Rendering
    const nameEl = document.getElementById('display-trainee-name');
    if (nameEl) nameEl.innerText = this.profile.traineeName || '...................................................';

    const orgEl = document.getElementById('display-org-name');
    if (orgEl) orgEl.innerText = this.profile.orgName || '...................................................';

    const supEl = document.getElementById('display-sup-name');
    if (supEl) supEl.innerText = this.profile.supervisorName || '...................................................';

    const supPosEl = document.getElementById('display-sup-pos');
    if (supPosEl) supPosEl.innerText = this.profile.supervisorPos || '...................................................';

    // Total hours calculation
    const totalHours = logbook.calculateTotalHours(this.ojtWeeks);
    const hoursEl = document.getElementById('total-hours-display');
    if (hoursEl) {
      hoursEl.innerText = `${totalHours.toFixed(1)} / 90.0 ชม. (${((totalHours / 90) * 100).toFixed(0)}%)`;
    }

    // Weekly Table Rendering
    const weekEntries = this.ojtWeeks[this.currentWeek] || [];
    const weekHours = logbook.calculateWeekHours(weekEntries);
    const weekHoursSumEl = document.getElementById('week-hours-sum');
    if (weekHoursSumEl) weekHoursSumEl.innerText = toThaiNumber(weekHours.toFixed(1));

    const weekTitleEl = document.getElementById('current-week-label');
    if (weekTitleEl) weekTitleEl.innerText = toThaiNumber(this.currentWeek);

    const tbody = document.getElementById('ojt-table-body');
    if (tbody) {
      if (weekEntries.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="p-6 text-center text-slate-400 text-xs">
              ยังไม่มีบันทึกในสัปดาห์นี้ คลิกปุ่ม "เพิ่มรายการบันทึกวันใหม่" ด้านบนเพื่อเริ่มบันทึก
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = weekEntries.map((day, idx) => `
          <tr class="hover:bg-slate-50 transition border-b border-slate-300">
            <td class="border border-slate-400 p-2 text-center text-xs">
              <input type="text" value="${day.date || ''}" placeholder="วว/ดด/ปปปป" class="w-full text-center bg-transparent border-none p-0 focus:ring-0 text-xs" onchange="window.app.updateDay(${idx}, 'date', this.value)">
            </td>
            <td class="border border-slate-400 p-2 text-center text-xs font-bold">
              <input type="number" step="0.5" value="${day.hours || 4.5}" class="w-14 text-center bg-transparent border border-slate-200 rounded p-1 text-xs font-bold" onchange="window.app.updateDay(${idx}, 'hours', this.value)">
            </td>
            <td class="border border-slate-400 p-2 text-left text-xs">
              <textarea placeholder="ระบุงานที่ปฏิบัติโดยย่อ..." class="w-full bg-transparent border-none p-0 focus:ring-0 text-xs resize-none" rows="2" onchange="window.app.updateDay(${idx}, 'title', this.value)">${day.title || ''}</textarea>
            </td>
            <td class="border border-slate-400 p-2 text-left text-xs">
              <textarea placeholder="ระบุความรู้หรือทักษะที่ได้รับ..." class="w-full bg-transparent border-none p-0 focus:ring-0 text-xs resize-none" rows="2" onchange="window.app.updateDay(${idx}, 'knowledge', this.value)">${day.knowledge || ''}</textarea>
            </td>
            <td class="border border-slate-400 p-2 text-center text-xs">
              <input type="text" value="${day.problem || 'ไม่มี'}" class="w-full text-center bg-transparent border-none p-0 focus:ring-0 text-xs text-slate-500" onchange="window.app.updateDay(${idx}, 'problem', this.value)">
            </td>
          </tr>
        `).join('');
      }
    }
  }

  async updateDay(idx, field, value) {
    const entries = this.ojtWeeks[this.currentWeek] || [];
    if (entries[idx]) {
      entries[idx][field] = field === 'hours' ? parseFloat(value) || 0 : value;
      this.ojtWeeks[this.currentWeek] = entries;
      await storage.set('ojt_weeks', String(this.currentWeek), entries);
      this.render();
    }
  }
}

const app = new SmartGovApp25();
window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());
