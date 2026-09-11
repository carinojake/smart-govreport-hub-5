/**
 * Smart GovReport Hub 2.5 - Dynamic RBAC Manager
 * เชื่อมโยง Docker PostgreSQL (Port 5432) และ FastAPI Backend (Port 8086)
 * รองรับการควบคุมสิทธิ์ Sidebar, Toolbar และเปิด/ปิดสิทธิ์ Real-time ผ่าน Matrix Modal
 */

(function(window) {
  'use strict';

  const apiHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
  const isProxiedOrTunnel = typeof window !== 'undefined' && (
    window.location.protocol === 'https:' ||
    window.location.port === '8085' ||
    !window.location.port ||
    window.location.hostname.includes('trycloudflare')
  );
  const BACKEND_API_BASE = isProxiedOrTunnel ? '' : `http://${apiHost}:8086`;

  const RBACManager = {
    userPermissions: null,
    currentRole: 'trainee',
    fallbackRoleMap: {
      trainee: {
        'dashboard': false,
        'ojt-log': true,
        'project-summary': true,
        'official-memo': true,
        'executive-overview': false,
        'portfolio-report': true,
        'audit-console': false,
        'knowledge-base': true,
        'photo-gallery': true,
        'ai-polish': true
      },
      supervisor: {
        'dashboard': true,
        'ojt-log': true,
        'project-summary': true,
        'official-memo': true,
        'executive-overview': true,
        'portfolio-report': true,
        'audit-console': true,
        'knowledge-base': true,
        'photo-gallery': true,
        'ai-polish': true
      },
      advisor: {
        'dashboard': true,
        'ojt-log': true,
        'project-summary': true,
        'official-memo': true,
        'executive-overview': true,
        'portfolio-report': true,
        'audit-console': true,
        'knowledge-base': true,
        'photo-gallery': true,
        'ai-polish': true
      },
      staff: {
        'dashboard': true,
        'ojt-log': true,
        'project-summary': true,
        'official-memo': true,
        'executive-overview': true,
        'portfolio-report': true,
        'audit-console': true,
        'knowledge-base': true,
        'photo-gallery': true,
        'ai-polish': true
      }
    },

    async loadPermissions(role) {
      this.currentRole = role || 'trainee';
      try {
        const res = await fetch(`${BACKEND_API_BASE}/api/v1/rbac/my-permissions?role=${encodeURIComponent(this.currentRole)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.can_view_map) {
            this.userPermissions = data.can_view_map;
          }
        }
      } catch (e) {
        console.warn('[RBAC 2.5] API unreachable, using fallback matrix:', e);
      }

      if (!this.userPermissions) {
        this.userPermissions = this.fallbackRoleMap[this.currentRole] || this.fallbackRoleMap.trainee;
      }

      this.applyVisibility();
    },

    canView(moduleKey) {
      if (!this.userPermissions) {
        const fallback = this.fallbackRoleMap[this.currentRole] || this.fallbackRoleMap.trainee;
        return fallback[moduleKey] !== false;
      }
      return this.userPermissions[moduleKey] !== false;
    },

    applyVisibility() {
      // 1. Sidebar Tab Buttons
      const tabMap = {
        'dashboard': document.getElementById('btn-tab-dashboard'),
        'ojt-log': document.getElementById('btn-tab-ojt-log'),
        'project-summary': document.getElementById('btn-tab-project-summary'),
        'official-memo': document.getElementById('btn-tab-official-memo'),
        'executive-overview': document.getElementById('btn-tab-executive-overview'),
        'portfolio-report': document.getElementById('btn-tab-portfolio-report'),
        'audit-console': document.getElementById('btn-tab-audit-console'),
        'knowledge-base': document.getElementById('btn-tab-knowledge-base'),
        'photo-gallery': document.getElementById('btn-tab-photo-gallery')
      };

      for (const [key, btn] of Object.entries(tabMap)) {
        if (btn) {
          if (this.canView(key)) {
            btn.classList.remove('hidden');
          } else {
            btn.classList.add('hidden');
          }
        }
      }

      // 2. Toolbar Executive Quick Button & Audit Log Button
      const headerExecBtn = document.getElementById('header-executive-btn');
      if (headerExecBtn) {
        if (this.canView('executive-overview')) headerExecBtn.classList.remove('hidden');
        else headerExecBtn.classList.add('hidden');
      }

      const headerAuditBtn = document.getElementById('header-audit-btn');
      if (headerAuditBtn) {
        if (this.canView('audit-console')) headerAuditBtn.classList.remove('hidden');
        else headerAuditBtn.classList.add('hidden');
      }

      // 3. Admin RBAC Matrix Button in Header
      const adminRbacBtn = document.getElementById('btn-admin-rbac');
      const isAdmin = (this.currentRole === 'staff' || this.currentRole === 'admin');
      if (adminRbacBtn) {
        if (isAdmin) adminRbacBtn.classList.remove('hidden');
        else adminRbacBtn.classList.add('hidden');
      }

      // 4. Redirect if currently in unauthorized tab
      const views = ['dashboard', 'ojt-log', 'project-summary', 'official-memo', 'portfolio-report', 'executive-overview', 'audit-console', 'knowledge-base', 'photo-gallery'];
      for (const v of views) {
        const viewEl = document.getElementById('view-' + v);
        if (viewEl && !viewEl.classList.contains('hidden')) {
          if (!this.canView(v)) {
            console.warn(`[RBAC 2.5] View ${v} is restricted for role ${this.currentRole}, redirecting to ojt-log`);
            if (typeof switchTab === 'function') switchTab('ojt-log');
            break;
          }
        }
      }
    },

    async openMatrixModal() {
      const modal = document.getElementById('rbacMatrixModal');
      if (!modal) return;
      modal.classList.remove('hidden');
      const loadingEl = document.getElementById('rbacModalLoading');
      const contentEl = document.getElementById('rbacModalContent');
      if (loadingEl) loadingEl.classList.remove('hidden');
      if (contentEl) contentEl.classList.add('hidden');

      try {
        const res = await fetch(`${BACKEND_API_BASE}/api/v1/rbac/matrix`, {
          headers: {
            'X-User-Role': this.currentRole || 'supervisor'
          }
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        this.renderMatrixTable(data);
      } catch (err) {
        alert('❌ เกิดข้อผิดพลาดในการโหลดเมทริกซ์สิทธิ์: ' + err.message);
        this.closeMatrixModal();
      }
    },

    closeMatrixModal() {
      const modal = document.getElementById('rbacMatrixModal');
      if (modal) modal.classList.add('hidden');
    },

    renderMatrixTable(data) {
      const loadingEl = document.getElementById('rbacModalLoading');
      const contentEl = document.getElementById('rbacModalContent');
      if (loadingEl) loadingEl.classList.add('hidden');
      if (contentEl) contentEl.classList.remove('hidden');

      const tbody = document.getElementById('rbacMatrixTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      const roles = data.roles || [];
      const menus = data.menus || [];
      const matrix = data.matrix || {};

      menus.forEach(menu => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition';

        let tdMenu = `
          <td class="px-4 py-3 text-left">
            <div class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <i class="${menu.menu_icon || 'fa-solid fa-folder'} text-govNavy w-4 text-center"></i>
              <span>${menu.menu_label}</span>
            </div>
            <div class="text-[10px] text-slate-400 font-mono">${menu.module_key} (${menu.menu_category})</div>
          </td>
        `;

        let roleCols = '';
        roles.forEach(role => {
          const perm = (matrix[role.role_id] && matrix[role.role_id][menu.menu_id]) || { can_view: 0, can_edit: 0 };
          roleCols += `
            <td class="px-3 py-3 text-center border-l border-slate-100">
              <div class="flex items-center justify-center gap-3">
                <label class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" data-role="${role.role_id}" data-menu="${menu.menu_id}" data-type="can_view"
                    ${perm.can_view === 1 ? 'checked' : ''} class="rounded text-govNavy focus:ring-govNavy h-3.5 w-3.5">
                  <span>ดู</span>
                </label>
                <label class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" data-role="${role.role_id}" data-menu="${menu.menu_id}" data-type="can_edit"
                    ${perm.can_edit === 1 ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-600 h-3.5 w-3.5">
                  <span>แก้</span>
                </label>
              </div>
            </td>
          `;
        });

        tr.innerHTML = tdMenu + roleCols;
        tbody.appendChild(tr);
      });
    },

    async saveMatrixChanges() {
      const checkboxes = document.querySelectorAll('#rbacMatrixTableBody input[type="checkbox"]');
      const permMap = {};

      checkboxes.forEach(cb => {
        const roleId = cb.dataset.role;
        const menuId = cb.dataset.menu;
        const type = cb.dataset.type;
        const key = `${roleId}___${menuId}`;

        if (!permMap[key]) {
          permMap[key] = { role_id: roleId, menu_id: menuId, can_view: 0, can_edit: 0 };
        }
        permMap[key][type] = cb.checked ? 1 : 0;
      });

      const permissions = Object.values(permMap);
      const saveBtn = document.getElementById('btnSaveRbacMatrix');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'กำลังบันทึก...';
      }

      try {
        const res = await fetch(`${BACKEND_API_BASE}/api/v1/rbac/matrix`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': this.currentRole || 'supervisor'
          },
          body: JSON.stringify({ permissions })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.detail || `HTTP ${res.status}`);
        }

        alert('✓ บันทึกสิทธิ์ Dynamic RBAC Matrix ลงใน PostgreSQL สำเร็จ 100%!');
        this.closeMatrixModal();
        this.userPermissions = null;
        await this.loadPermissions(this.currentRole);
      } catch (err) {
        alert('❌ บันทึกสิทธิ์ไม่สำเร็จ: ' + err.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerText = 'บันทึกการเปลี่ยนแปลงสิทธิ์';
        }
      }
    }
  };

  window.RBACManager = RBACManager;

  // Auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const session = (typeof getActiveSession === 'function') ? getActiveSession() : null;
    const role = session ? session.role : 'trainee';
    RBACManager.loadPermissions(role);
  });

})(window);
