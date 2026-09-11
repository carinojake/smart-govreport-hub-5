/**
 * Smart GovReport Hub 2.5 - Master Application Entrypoint
 * เชื่อมต่อ Docker PostgreSQL (Port 5432) และบริหารจัดการ Modular Architecture
 * ผู้พัฒนา: ทีม AI Agent (5.11 น้องฟ้า, 5.2 เซียน SA, 5.5 โค้ดเดอร์หลังบ้าน, 5.1 พี่ใหญ่ PM)
 */

import { dbApi } from './modules/02-db-api.js';

console.log('🚀 [Smart GovReport Hub 2.5] Initializing Modular Application...');

// 1. ตรวจสอบการเชื่อมต่อ Docker PostgreSQL 5432 ทันทีที่โหลด
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🏛️ [App] DOM Loaded - Starting PostgreSQL 5432 telemetry...');
  
  // เริ่ม Polling เช็กสุขภาพของ Docker PostgreSQL 5432 ผ่าน FastAPI
  dbApi.startPolling();

  // ดึงข้อมูล State สมบูรณ์จาก PostgreSQL เพื่อทำ Client Hydration
  try {
    const pgState = await dbApi.fetchFullState();
    if (pgState && pgState.reports && pgState.reports.length > 0) {
      console.log(`📦 [App] Hydrating ${pgState.reports.length} reports from PostgreSQL 5432 into local memory...`);
      
      // ผสานข้อมูลเข้ากับ liveOjtData
      if (typeof window.liveOjtData !== 'undefined') {
        pgState.reports.forEach(r => {
          const key = `w${r.week_num}_d${r.work_date}`;
          window.liveOjtData[key] = {
            id: key,
            weekNum: r.week_num,
            date: r.work_date,
            hours: r.hours,
            title: r.tasks,
            desc: r.tasks,
            knowledge: r.knowledge_skills,
            problems: r.problems,
            category: r.category,
            status: r.status,
            isLocked: r.is_locked
          };
        });
        
        // สั่งให้อัปเดต UI หน้าจอ
        if (typeof window.renderRoleDashboard === 'function') {
          window.renderRoleDashboard();
        }
        if (typeof window.renderOjtLog === 'function') {
          window.renderOjtLog();
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ [App] Hydration warning:', e);
  }

  // Hook ระบบ Auto-Save เข้าสู่ Docker PostgreSQL
  setupPostgresAutoSync();

  // ตั้งค่าการวางหน้า PDF เริ่มต้น (Landscape/Portrait) ตามที่บันทึกไว้
  if (typeof window.applyPdfOrientationStyle === 'function') {
    const savedOrient = localStorage.getItem('ojt_pdf_orientation') || 'landscape';
    if (typeof window.setPdfOrientation === 'function') {
      window.setPdfOrientation(savedOrient);
    } else {
      window.applyPdfOrientationStyle();
    }
  }
});

/**
 * ติดตั้ง Interceptor ดักฟังเหตุการณ์การบันทึกข้อมูลเพื่อส่งเข้า PostgreSQL 5432
 */
function setupPostgresAutoSync() {
  // ดักการบันทึก OJT Entry
  const originalSaveEntry = window.saveOjtEntry;
  if (typeof originalSaveEntry === 'function') {
    window.saveOjtEntry = async function(...args) {
      const result = originalSaveEntry.apply(this, args);
      try {
        // ดึงรายการที่เพิ่งบันทึกล่าสุดส่งเข้า PostgreSQL 5432
        const daySelect = document.getElementById('entry-day-select');
        const selectedId = daySelect ? daySelect.value : null;
        if (selectedId && window.liveOjtData && window.liveOjtData[selectedId]) {
          const entry = window.liveOjtData[selectedId];
          await dbApi.saveReport(entry);
        }
      } catch (err) {
        console.error('Error syncing to PostgreSQL:', err);
      }
      return result;
    };
  }

  // ดักการบันทึก Signature Pad
  const originalSaveSig = window.saveSignaturePad;
  if (typeof originalSaveSig === 'function') {
    window.saveSignaturePad = async function(...args) {
      const result = originalSaveSig.apply(this, args);
      try {
        const weekNum = window.currentOjtWeek || 1;
        const role = window.activeSignatureRole || 'trainee';
        const canvas = document.getElementById('signature-pad');
        if (canvas) {
          const imgData = canvas.toDataURL('image/png');
          await dbApi.saveSignature(weekNum, role, imgData);
        }
      } catch (err) {
        console.error('Error syncing signature to PostgreSQL:', err);
      }
      return result;
    };
  }

  // ดักการส่งประเมินผลโดยพี่เลี้ยง
  const originalSubmitDecision = window.submitSupervisorDecision;
  if (typeof originalSubmitDecision === 'function') {
    window.submitSupervisorDecision = async function(...args) {
      const result = originalSubmitDecision.apply(this, args);
      try {
        const weekNum = window.currentOjtWeek || 1;
        const scores = {
          discipline: parseInt(document.getElementById('score-discipline')?.value || 5),
          quality: parseInt(document.getElementById('score-quality')?.value || 5),
          creativity: parseInt(document.getElementById('score-creativity')?.value || 5),
          communication: parseInt(document.getElementById('score-communication')?.value || 5),
          ethics: parseInt(document.getElementById('score-ethics')?.value || 5)
        };
        const grade = document.getElementById('eval-grade-select')?.value || 'A';
        const comments = document.getElementById('eval-comments-text')?.value || 'ผ่านเกณฑ์ดีเยี่ยม';
        await dbApi.saveEvaluation(weekNum, scores, grade, comments, true);
      } catch (err) {
        console.error('Error syncing evaluation to PostgreSQL:', err);
      }
      return result;
    };
  }
}

// =========================================================================
// AUTO-FONT SCALING GUARDRAIL FOR STRICT A4 PRINT (1 สัปดาห์ 1 หน้า A4 100%)
// =========================================================================
window.addEventListener('beforeprint', () => {
  console.log('🖨️ [Print Guardrail] Inspecting OJT weekly tables height before printing...');
  for (let w = 1; w <= 5; w++) {
    const pageEl = document.getElementById(`ojt-weekly-page-${w}`);
    if (pageEl) {
      const rect = pageEl.getBoundingClientRect();
      const tableEl = pageEl.querySelector('table');
      const tableHeight = tableEl ? tableEl.offsetHeight : 0;
      if (rect.height > 1080 || tableHeight > 750) {
        console.warn(`⚠️ [Print Guardrail] Week ${w} table height (${tableHeight}px / total ${rect.height}px) exceeds safe boundary. Applying soft .print-condensed guardrail.`);
        pageEl.classList.add('print-condensed');
      }
    }
  }
});

window.addEventListener('afterprint', () => {
  document.querySelectorAll('[id^="ojt-weekly-page-"].print-condensed').forEach(el => {
    el.classList.remove('print-condensed');
  });
});

console.log('✅ [Smart GovReport Hub 5] Modular Loader Ready & Docker PostgreSQL hooks active.');
