/**
 * 🏛️ MODULE 1: LAYOUT & ACCESSIBILITY CONTROLLER
 * จัดการโครงสร้างหน้าจอ เมนูนำทาง แถบสถานะ และระบบสนับสนุนผู้พิการ (WCAG 2.1 AA)
 */

export class LayoutController {
  constructor() {
    this.currentTab = 'logbook';
  }

  init() {
    this.restoreAccessibilityPreferences();
    this.bindGlobalShortcuts();
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`view-${tabId}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('bg-govNavy', 'text-white');
      btn.classList.add('text-slate-600', 'hover:bg-slate-100');
    });
    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeBtn) {
      activeBtn.classList.add('bg-govNavy', 'text-white');
      activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
    }
  }

  setFontSize(sizeClass) {
    const body = document.getElementById('main-body') || document.body;
    body.classList.remove('text-sm', 'text-base', 'text-lg');
    body.classList.add(sizeClass);
    localStorage.setItem('smartgov_font_size_v25', sizeClass);
  }

  toggleHighContrast() {
    const body = document.getElementById('main-body') || document.body;
    body.classList.toggle('high-contrast');
    const isHc = body.classList.contains('high-contrast');
    localStorage.setItem('smartgov_high_contrast_v25', isHc ? '1' : '0');
    this.showToast(isHc ? 'เปิดโหมดคอนทราสต์สูง (High Contrast)' : 'ปิดโหมดคอนทราสต์สูง', 'success');
  }

  restoreAccessibilityPreferences() {
    const savedSize = localStorage.getItem('smartgov_font_size_v25');
    if (savedSize) this.setFontSize(savedSize);
    const savedHc = localStorage.getItem('smartgov_high_contrast_v25');
    if (savedHc === '1') {
      const body = document.getElementById('main-body') || document.body;
      body.classList.add('high-contrast');
    }
  }

  bindGlobalShortcuts() {
    window.changeFontSize = (size) => this.setFontSize(size);
    window.toggleHighContrast = () => this.toggleHighContrast();
  }

  showToast(msg, type = 'success') {
    const existing = document.getElementById('smartgov-toast-v25');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'smartgov-toast-v25';
    toast.className = `fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold transition-all transform translate-y-0 opacity-100 no-print ${
      type === 'success'
        ? 'bg-slate-900/95 text-emerald-300 border border-emerald-500/50 backdrop-blur-md'
        : 'bg-slate-900/95 text-rose-300 border border-rose-500/50 backdrop-blur-md'
    }`;
    toast.innerHTML = `
      <i class="${type === 'success' ? 'fa-solid fa-circle-check text-emerald-400 text-sm' : 'fa-solid fa-triangle-exclamation text-rose-400 text-sm'}"></i>
      <span class="text-white">${msg}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
}

export const layout = new LayoutController();
