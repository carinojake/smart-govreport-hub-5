/**
 * Smart GovReport Hub 2.5 - Database & FastAPI Connector Module
 * เชื่อมต่อ Docker PostgreSQL (Port 5432) เต็มรูปแบบ ผ่าน FastAPI (Python 3.12)
 * ออกแบบโดย: เซียน SA (5.2) & โค้ดเดอร์หลังบ้าน (5.5)
 */

export const DB_CONFIG = {
  apiBase: 'http://127.0.0.1:8086/api',
  pollIntervalMs: 5000,
  defaultUserId: 'a0000001-0000-0000-0000-000000000001',
  defaultSupervisorId: 'a0000002-0000-0000-0000-000000000002'
};

export class DbApiClient {
  constructor() {
    this.isConnected = false;
    this.telemetry = null;
  }

  async checkHealth() {
    try {
      const res = await fetch(`${DB_CONFIG.apiBase}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.isConnected = data.status === 'online';
      this.telemetry = data.telemetry;
      this.updateStatusBadge(true, data.database, data.telemetry);
      return data;
    } catch (err) {
      this.isConnected = false;
      this.updateStatusBadge(false, err.message);
      return { status: 'offline', error: err.message };
    }
  }

  updateStatusBadge(online, dbName = '', telemetry = null) {
    const pill = document.getElementById('pg-docker-pill');
    const textSpan = document.getElementById('pg-docker-status-text');
    if (!pill || !textSpan) return;

    pill.classList.remove('hidden');
    if (online) {
      pill.className = 'hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] text-emerald-300 font-medium shadow-inner transition-all';
      const stats = telemetry ? ` (รายงาน: ${telemetry.saved_reports} รายการ)` : '';
      textSpan.textContent = `🟢 Docker PostgreSQL 5432 เชื่อมต่อสมบูรณ์${stats}`;
      pill.title = `เชื่อมต่อกับ ${dbName} เต็มรูปแบบ ผ่าน FastAPI Python 3.12`;
    } else {
      pill.className = 'hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-[11px] text-rose-300 font-medium shadow-inner transition-all';
      textSpan.textContent = `🔴 รอการเชื่อมต่อ Docker PostgreSQL 5432`;
      pill.title = `ไม่สามารถเชื่อมต่อไปยัง ${DB_CONFIG.apiBase}`;
    }
  }

  async fetchFullState() {
    try {
      const res = await fetch(`${DB_CONFIG.apiBase}/sync/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('✅ [DB-API] Hydrated state from Docker PostgreSQL:', data);
      return data;
    } catch (err) {
      console.warn('⚠️ [DB-API] Failed to fetch state from PostgreSQL:', err);
      return null;
    }
  }

  async saveReport(reportItem) {
    try {
      const payload = {
        user_id: reportItem.user_id || DB_CONFIG.defaultUserId,
        week_num: parseInt(reportItem.week_num || 1),
        work_date: reportItem.work_date || reportItem.date,
        hours: parseFloat(reportItem.hours || 4.5),
        tasks: reportItem.tasks || reportItem.title || 'ปฏิบัติงาน OJT',
        knowledge_skills: reportItem.knowledge_skills || reportItem.knowledge || '',
        problems: reportItem.problems || '',
        category: reportItem.category || 'งานบริการสารสนเทศและดูแลระบบ',
        status: reportItem.status || 'draft',
        is_locked: !!reportItem.is_locked,
        data_payload: reportItem.data_payload || { original_id: reportItem.id }
      };

      const res = await fetch(`${DB_CONFIG.apiBase}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      console.log('💾 [DB-API] Report saved to PostgreSQL 5432:', result);
      this.checkHealth(); // update counter
      return result;
    } catch (err) {
      console.error('❌ [DB-API] Error saving report to PostgreSQL:', err);
      return { success: false, error: err.message };
    }
  }

  async saveSignature(weekNum, role, base64ImageData) {
    try {
      const payload = {
        week_num: parseInt(weekNum),
        user_id: role === 'supervisor' ? DB_CONFIG.defaultSupervisorId : DB_CONFIG.defaultUserId,
        role: role,
        signature_image_data: base64ImageData
      };
      const res = await fetch(`${DB_CONFIG.apiBase}/signatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      console.log('✍️ [DB-API] Signature saved to PostgreSQL 5432:', result);
      return result;
    } catch (err) {
      console.error('❌ [DB-API] Error saving signature:', err);
      return { success: false, error: err.message };
    }
  }

  async saveEvaluation(weekNum, scores, grade, comments, batchApproved = false) {
    try {
      const payload = {
        trainee_id: DB_CONFIG.defaultUserId,
        supervisor_id: DB_CONFIG.defaultSupervisorId,
        week_num: parseInt(weekNum),
        scores: scores,
        grade: grade,
        comments: comments,
        batch_approved: batchApproved
      };
      const res = await fetch(`${DB_CONFIG.apiBase}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      console.log('⭐ [DB-API] Evaluation saved to PostgreSQL 5432:', result);
      return result;
    } catch (err) {
      console.error('❌ [DB-API] Error saving evaluation:', err);
      return { success: false, error: err.message };
    }
  }

  async aiSummarize(weekNum, entries) {
    try {
      const res = await fetch(`${DB_CONFIG.apiBase}/ai/summarize-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_num: parseInt(weekNum), entries })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  startPolling() {
    this.checkHealth();
    setInterval(() => this.checkHealth(), DB_CONFIG.pollIntervalMs);
  }
}

export const dbApi = new DbApiClient();
window.dbApi = dbApi;
