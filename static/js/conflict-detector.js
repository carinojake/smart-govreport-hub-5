/**
 * Smart GovReport Hub V3 - Data Conflict & Concurrency Detector
 * Prevents accidental overwrite when multiple tabs or devices edit OJT logs
 * Author: ทีมงาน SmartGov 2026 (พี่แจ็ค M1 Architecture)
 */

class SmartGovConflictManager {
  constructor() {
    this.modalEl = null;
    this.pendingResolution = null;
  }

  /**
   * Check for potential conflicts before saving an activity or note
   * @param {Object} currentEntry - Current entry being edited in UI
   * @param {Object} storedEntry - Existing entry currently in DB/Storage
   * @returns {boolean} - true if conflict detected, false if safe to save
   */
  hasConflict(currentEntry, storedEntry) {
    if (!storedEntry || !storedEntry.updated_at) return false;
    if (!currentEntry.original_updated_at) return false;

    // If stored entry was modified AFTER the current entry was loaded for editing
    const storedTime = new Date(storedEntry.updated_at).getTime();
    const originalTime = new Date(currentEntry.original_updated_at).getTime();

    return storedTime > originalTime;
  }

  /**
   * Show modal prompting user to resolve conflict
   * @param {Object} currentEntry - The data currently on screen
   * @param {Object} storedEntry - The newer data found in storage
   * @returns {Promise<'overwrite'|'reload'|'merge'>}
   */
  async promptResolution(currentEntry, storedEntry) {
    return new Promise((resolve) => {
      this.pendingResolution = resolve;
      this.renderModal(currentEntry, storedEntry);
    });
  }

  renderModal(currentEntry, storedEntry) {
    if (!this.modalEl) {
      this.modalEl = document.createElement('div');
      this.modalEl.className = 'conflict-modal-overlay';
      document.body.appendChild(this.modalEl);
    }

    const currentTitle = currentEntry.activity_title || currentEntry.topic || 'รายการที่กำลังแก้ไข';
    const storedTitle = storedEntry.activity_title || storedEntry.topic || 'รายการที่มีในระบบ';
    const storedTimeStr = storedEntry.updated_at ? new Date(storedEntry.updated_at).toLocaleTimeString('th-TH') : 'ล่าสุด';

    this.modalEl.innerHTML = `
      <div class="conflict-modal-content">
        <div class="flex items-center gap-3 text-red-600 mb-3">
          <i class="fa-solid fa-triangle-exclamation text-xl"></i>
          <h3 class="text-base font-bold text-slate-800">ตรวจพบการแก้ไขข้อมูลทับซ้อน (Data Conflict)</h3>
        </div>
        <p class="text-xs text-slate-600 mb-4 leading-relaxed">
          ตรวจพบว่ามีข้อมูลของรายการนี้ถูกบันทึกปรับปรุงในระบบเมื่อเวลา <strong>${storedTimeStr}</strong> (อาจมาจากการเปิดแก้ไขหลายหน้าต่าง หรืออุปกรณ์อื่น) ซึ่งใหม่กว่าข้อมูลที่ท่านกำลังพิมพ์
        </p>

        <div class="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div class="font-bold text-amber-800 mb-1">ข้อมูลที่ท่านกำลังพิมพ์:</div>
            <div class="text-slate-700 max-h-24 overflow-y-auto whitespace-pre-wrap">${currentTitle}</div>
          </div>
          <div class="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div class="font-bold text-blue-800 mb-1">ข้อมูลใหม่กว่าในระบบ (${storedTimeStr}):</div>
            <div class="text-slate-700 max-h-24 overflow-y-auto whitespace-pre-wrap">${storedTitle}</div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="window.SmartGovConflict.choose('reload')" class="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition">
            โหลดข้อมูลใหม่จากระบบ (Discard Mine)
          </button>
          <button type="button" onclick="window.SmartGovConflict.choose('merge')" class="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition">
            ผสานข้อมูลทั้งสอง (Auto-Merge)
          </button>
          <button type="button" onclick="window.SmartGovConflict.choose('overwrite')" class="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow transition">
            ยืนยันเขียนทับ (Overwrite)
          </button>
        </div>
      </div>
    `;

    this.modalEl.style.display = 'flex';
  }

  choose(action) {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
    if (this.pendingResolution) {
      const cb = this.pendingResolution;
      this.pendingResolution = null;
      cb(action);
    }
  }

  /**
   * Helper to merge two activity records cleanly
   */
  mergeEntries(currentEntry, storedEntry) {
    const merged = { ...storedEntry, ...currentEntry };
    if (currentEntry.sop_procedure && storedEntry.sop_procedure && currentEntry.sop_procedure !== storedEntry.sop_procedure) {
      merged.sop_procedure = `${storedEntry.sop_procedure}\n---\n[ข้อมูลที่ผสานเพิ่ม]: ${currentEntry.sop_procedure}`;
    }
    if (currentEntry.problems_and_solutions && storedEntry.problems_and_solutions && currentEntry.problems_and_solutions !== storedEntry.problems_and_solutions) {
      merged.problems_and_solutions = `${storedEntry.problems_and_solutions}\n---\n[บันทึกเพิ่มเติม]: ${currentEntry.problems_and_solutions}`;
    }
    merged.updated_at = new Date().toISOString();
    return merged;
  }
}

// Global Singleton Instance
window.SmartGovConflict = new SmartGovConflictManager();
