/**
 * Smart GovReport Hub 2.5 - Audit Log Console Module (12-audit-console.js)
 * จัดการประวัติการเข้าทำงานของระบบหลังบ้าน (Audit Log Console) แบบ Tamper-proof
 * เชื่อมต่อ Docker PostgreSQL (Port 5432) ผ่าน FastAPI (Port 8086)
 * รองรับระเบียบงานสารบรรณ พ.ร.บ.คอมพิวเตอร์ และ PDPA 2562
 * สถาปัตยกรรมโดย: เซียน SA (5.2) & โค้ดเดอร์หลังบ้าน (5.5)
 */

(function () {
  const auditHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '127.0.0.1';
  const AUDIT_API_BASE = `http://${auditHost}:8086/api`;

  let currentAuditLogsCache = [];
  let currentAuditPage = 0;
  const auditPageLimit = 15;

  async function loadAuditStats() {
    try {
      const res = await fetch(`${AUDIT_API_BASE}/audit-logs/stats`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const d = json.data;
        const elTotal = document.getElementById('stat-audit-total');
        const elAlerts = document.getElementById('stat-audit-alerts');
        const elMutations = document.getElementById('stat-audit-mutations');
        const elAuth = document.getElementById('stat-audit-auth');
        const elUsers = document.getElementById('stat-audit-users');

        if (elTotal) elTotal.innerText = (d.total_logs || 0).toLocaleString();
        if (elAlerts) elAlerts.innerText = (d.security_alerts || 0).toLocaleString();
        if (elMutations) elMutations.innerText = (d.data_mutations || 0).toLocaleString();
        if (elAuth) elAuth.innerText = (d.auth_events || 0).toLocaleString();
        if (elUsers) elUsers.innerText = (d.unique_users || 0).toLocaleString();
      }
    } catch (err) {
      console.warn('[Audit Log] Failed to load stats:', err);
    }
  }

  async function loadAuditLogs() {
    let curRole = 'admin';
    if (typeof getActiveSession === 'function') {
      const session = getActiveSession();
      if (session && session.role) curRole = session.role;
    } else {
      curRole = localStorage.getItem('gov_active_role') || 'admin';
    }

    const guardEl = document.getElementById('audit-role-guard');
    const mainEl = document.getElementById('audit-main-content');

    if (curRole === 'trainee') {
      if (guardEl) guardEl.classList.remove('hidden');
      if (mainEl) mainEl.classList.add('opacity-40', 'pointer-events-none');
    } else {
      if (guardEl) guardEl.classList.add('hidden');
      if (mainEl) mainEl.classList.remove('opacity-40', 'pointer-events-none');
    }

    const category = document.getElementById('audit-filter-category')?.value || 'ALL';
    const severity = document.getElementById('audit-filter-severity')?.value || 'ALL';
    const search = document.getElementById('audit-search-keyword')?.value?.trim() || '';

    const tableBody = document.getElementById('audit-table-body');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-lg mb-2 text-indigo-500"></i>
        <div>กำลังดึงประวัติการทำงานจาก Docker PostgreSQL 16...</div>
      </td></tr>`;
    }

    loadAuditStats();

    const params = new URLSearchParams({
      limit: auditPageLimit,
      offset: currentAuditPage * auditPageLimit
    });
    if (category !== 'ALL') params.append('category', category);
    if (severity !== 'ALL') params.append('severity', severity);
    if (search) params.append('search', search);

    try {
      const res = await fetch(`${AUDIT_API_BASE}/audit-logs?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      currentAuditLogsCache = data.data || [];
      renderAuditTable(currentAuditLogsCache);
    } catch (err) {
      console.error('[Audit Log] Fetch error:', err);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-rose-500">
          <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
          <div>ไม่สามารถเชื่อมต่อฐานข้อมูลประวัติหลังบ้านได้ (Port 8086): ${err.message}</div>
          <div class="text-[10px] text-slate-400 mt-1">กรุณาตรวจสอบว่า FastAPI Backend กำลังรันอยู่บนพอร์ต 8086</div>
        </td></tr>`;
      }
    }
  }

  function renderAuditTable(logs) {
    const tableBody = document.getElementById('audit-table-body');
    const countEl = document.getElementById('audit-showing-count');
    const pageInfoEl = document.getElementById('audit-page-info');
    const prevBtn = document.getElementById('btn-audit-prev');
    const nextBtn = document.getElementById('btn-audit-next');

    if (countEl) countEl.innerText = logs.length;
    if (pageInfoEl) pageInfoEl.innerText = `หน้า ${currentAuditPage + 1}`;
    if (prevBtn) prevBtn.disabled = (currentAuditPage === 0);
    if (nextBtn) nextBtn.disabled = (logs.length < auditPageLimit);

    if (!logs || logs.length === 0) {
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-slate-400">
          <i class="fa-solid fa-folder-open text-2xl mb-2 text-slate-300"></i>
          <div>ไม่พบบันทึกประวัติที่ตรงกับเงื่อนไขการค้นหา</div>
        </td></tr>`;
      }
      return;
    }

    const sevBadges = {
      'SUCCESS': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'INFO': 'bg-blue-100 text-blue-800 border-blue-200',
      'WARN': 'bg-amber-100 text-amber-800 border-amber-200',
      'ALERT': 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
      'ERROR': 'bg-rose-200 text-rose-900 border-rose-400'
    };

    const catBadges = {
      'AUTH': 'bg-purple-100 text-purple-700',
      'DATA_MUTATION': 'bg-sky-100 text-sky-700',
      'SIGNATURE': 'bg-emerald-100 text-emerald-700',
      'SECURITY': 'bg-rose-100 text-rose-700 font-bold',
      'EXPORT': 'bg-amber-100 text-amber-700',
      'COMPLIANCE': 'bg-indigo-100 text-indigo-700'
    };

    let rowsHtml = '';
    logs.forEach((item) => {
      const sevCls = sevBadges[item.severity] || 'bg-slate-100 text-slate-700 border-slate-200';
      const catCls = catBadges[item.event_category] || 'bg-slate-100 text-slate-600';
      const dt = new Date(item.timestamp);
      const dateStr = isNaN(dt.getTime()) ? item.timestamp : dt.toLocaleString('th-TH', { hour12: false, dateStyle: 'short', timeStyle: 'medium' });
      const userDisplay = item.username || item.full_name || item.user_id || 'ระบบอัตโนมัติ';
      const roleDisplay = item.user_role ? `<span class="text-[10px] text-slate-400 block">(${item.user_role})</span>` : '';

      rowsHtml += `
        <tr class="hover:bg-indigo-50/30 transition border-b border-slate-100">
          <td class="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">${item.id}</td>
          <td class="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">${dateStr}</td>
          <td class="py-2.5 px-3">
            <strong class="text-slate-800">${userDisplay}</strong>
            ${roleDisplay}
          </td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${catCls}">${item.event_category}</span>
          </td>
          <td class="py-2.5 px-3 font-medium text-slate-800">
            <div>${item.action || item.event_name || '-'}</div>
            <div class="text-[10px] text-slate-500 truncate max-w-xs">${JSON.stringify(item.details || {})}</div>
          </td>
          <td class="py-2.5 px-3 text-slate-600 font-mono text-[11px] truncate max-w-[120px]">${item.target_resource || '-'}</td>
          <td class="py-2.5 px-3 text-center">
            <span class="px-2 py-0.5 rounded border text-[10px] font-bold ${sevCls}">${item.severity}</span>
          </td>
          <td class="py-2.5 px-3 text-center text-slate-500 text-[11px] font-mono whitespace-nowrap">
            <div>${item.ip_address || '127.0.0.1'}</div>
          </td>
          <td class="py-2.5 px-3 text-center">
            <button onclick="inspectAuditLog(${item.id})" class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition cursor-pointer" title="ดู JSON และบริบทการทำงาน">
              <i class="fa-solid fa-magnifying-glass-plus"></i>
            </button>
          </td>
        </tr>
      `;
    });

    if (tableBody) tableBody.innerHTML = rowsHtml;
  }

  function prevAuditPage() {
    if (currentAuditPage > 0) {
      currentAuditPage--;
      loadAuditLogs();
    }
  }

  function nextAuditPage() {
    currentAuditPage++;
    loadAuditLogs();
  }

  function resetAuditFilters() {
    const cat = document.getElementById('audit-filter-category');
    const sev = document.getElementById('audit-filter-severity');
    const kw = document.getElementById('audit-search-keyword');
    if (cat) cat.value = 'ALL';
    if (sev) sev.value = 'ALL';
    if (kw) kw.value = '';
    currentAuditPage = 0;
    loadAuditLogs();
  }

  function inspectAuditLog(id) {
    const log = currentAuditLogsCache.find(x => x.id === id);
    if (!log) return;

    const modal = document.getElementById('audit-detail-modal');
    const title = document.getElementById('audit-modal-title');
    const subtitle = document.getElementById('audit-modal-subtitle');
    const mTime = document.getElementById('modal-audit-time');
    const mUser = document.getElementById('modal-audit-user');
    const mEvent = document.getElementById('modal-audit-event');
    const mIp = document.getElementById('modal-audit-ip');
    const mJson = document.getElementById('modal-audit-json');

    if (title) title.innerText = `ประวัติลำดับที่ #${log.id}: ${log.action || log.event_name || '-'}`;
    if (subtitle) subtitle.innerText = `Category: ${log.event_category} • Severity: ${log.severity}`;
    if (mTime) mTime.innerText = log.timestamp;
    if (mUser) mUser.innerText = `${log.username || log.full_name || log.user_id || 'System'} (${log.user_role || 'N/A'})`;
    if (mEvent) mEvent.innerText = `${log.event_category} / ${log.action || log.event_name || '-'}`;
    if (mIp) mIp.innerText = `${log.ip_address} | ${log.user_agent}`;
    if (mJson) mJson.innerText = JSON.stringify(log, null, 2);

    if (modal) modal.classList.remove('hidden');
  }

  function closeAuditModal() {
    const modal = document.getElementById('audit-detail-modal');
    if (modal) modal.classList.add('hidden');
  }

  function copyAuditJson() {
    const mJson = document.getElementById('modal-audit-json');
    if (mJson) {
      navigator.clipboard.writeText(mJson.innerText).then(() => {
        alert('✓ คัดลอกโครงสร้าง JSON Payload เรียบร้อยแล้ว');
      });
    }
  }

  function exportAudit(format) {
    const category = document.getElementById('audit-filter-category')?.value || 'ALL';
    const severity = document.getElementById('audit-filter-severity')?.value || 'ALL';
    const search = document.getElementById('audit-search-keyword')?.value?.trim() || '';

    const params = new URLSearchParams({ format: format });
    if (category !== 'ALL') params.append('category', category);
    if (severity !== 'ALL') params.append('severity', severity);
    if (search) params.append('search', search);

    window.open(`${AUDIT_API_BASE}/audit-logs/export?${params.toString()}`, '_blank');
  }

  // Export to window for inline HTML onclick handlers
  window.loadAuditStats = loadAuditStats;
  window.loadAuditLogs = loadAuditLogs;
  window.renderAuditTable = renderAuditTable;
  window.prevAuditPage = prevAuditPage;
  window.nextAuditPage = nextAuditPage;
  window.resetAuditFilters = resetAuditFilters;
  window.inspectAuditLog = inspectAuditLog;
  window.closeAuditModal = closeAuditModal;
  window.copyAuditJson = copyAuditJson;
  window.exportAudit = exportAudit;

  // Auto-init on script load
  window.addEventListener('DOMContentLoaded', () => {
    loadAuditStats();
  });
})();
