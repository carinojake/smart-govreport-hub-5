/**
 * 📱 PWA Manager Module (15-pwa-manager.js) - Smart GovReport Hub 2.5
 * ผู้พัฒนา: ทีม AI Agent (5.5 โค้ดเดอร์หลังบ้าน, 5.11 น้องฟ้า เลขาหน้าห้อง, 5.2 เซียน SA)
 * หน้าที่:
 * 1. บริหารจัดการ Service Worker และตรวจจับการอัปเดตเวอร์ชัน
 * 2. ควบคุมปุ่ม "ติดตั้งแอปลงเครื่อง" (beforeinstallprompt + iOS Add to Home Screen)
 * 3. ตรวจจับสถานะเครือข่าย Online / Offline แบบ Real-time
 * 4. จัดเตรียมฟังก์ชันล้างแคช (Force Refresh / Cache Purge) สำหรับผู้ดูแลระบบ
 */

class PwaManager {
  constructor() {
    this.deferredPrompt = null;
    this.isStandalone = false;
    this.swRegistration = null;
    this.isOnline = navigator.onLine;

    this.init();
  }

  init() {
    console.log('📱 [PWA Manager] Initializing PWA & Offline Engine...');

    // ตรวจสอบว่าแอปเปิดในโหมด Standalone อยู่แล้วหรือไม่ (ติดตั้งแล้ว)
    this.checkStandaloneMode();

    // 1. ลงทะเบียน Service Worker
    this.registerServiceWorker();

    // 2. ดักฟัง BeforeInstallPrompt เพื่อแสดงปุ่มติดตั้ง
    this.setupInstallPrompt();

    // 3. ตรวจจับสถานะการเชื่อมต่อ Online / Offline
    this.setupNetworkMonitor();

    // 4. ผูกปุ่มคำสั่งใน UI
    this.bindUI();
  }

  /**
   * ตรวจสอบว่ากำลังรันแบบ Standalone PWA หรือไม่
   */
  checkStandaloneMode() {
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = window.navigator.standalone === true;
    this.isStandalone = isStandaloneDisplay || isIosStandalone;

    if (this.isStandalone) {
      console.log('✨ [PWA Manager] Running in Standalone Mode (Native App Experience)');
      document.body.classList.add('is-pwa-standalone');
    }
  }

  /**
   * ลงทะเบียน Service Worker (sw.js)
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ [PWA Manager] Service Worker is not supported in this browser.');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      this.swRegistration = reg;
      console.log('✅ [PWA Manager] Service Worker registered with scope:', reg.scope);

      // ตรวจสอบกรณีมี Service Worker ตัวใหม่พร้อมทำงาน
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 [PWA Manager] New update available.');
            this.showUpdateNotification();
          }
        });
      });

      // รองรับ Controller Change
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('🔄 [PWA Manager] Controller changed, reloading...');
          window.location.reload();
        }
      });

    } catch (err) {
      console.error('❌ [PWA Manager] Service Worker registration failed:', err);
    }
  }

  /**
   * ดักจับ BeforeInstallPrompt
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // ป้องกัน Chrome แสดง Mini-infobar เริ่มต้น เพื่อให้เราควบคุม UI เอง
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('📥 [PWA Manager] beforeinstallprompt captured. Showing install button.');

      // แสดงปุ่มติดตั้งใน UI
      this.toggleInstallButton(true);
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 [PWA Manager] Smart GovReport Hub 2.5 was installed successfully!');
      this.deferredPrompt = null;
      this.toggleInstallButton(false);
      this.showToast('🎉 ติดตั้ง Smart GovReport Hub ลงเครื่องเรียบร้อยแล้ว!', 'success');
    });
  }

  /**
   * แสดงหรือซ่อนปุ่มติดตั้ง
   */
  toggleInstallButton(show) {
    const installBtn = document.getElementById('btn-pwa-install');
    const installDropdownBtn = document.getElementById('hub-pwa-install-btn');

    if (installBtn) {
      if (show && !this.isStandalone) {
        installBtn.classList.remove('hidden');
      } else {
        installBtn.classList.add('hidden');
      }
    }

    if (installDropdownBtn) {
      if (this.isStandalone) {
        installDropdownBtn.innerHTML = `
          <div class="flex items-center space-x-2 text-emerald-700">
            <i class="fa-solid fa-circle-check text-emerald-500 w-4 text-center"></i>
            <span>ติดตั้งแล้ว (PWA Standalone)</span>
          </div>
          <span class="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">พร้อมใช้</span>
        `;
      } else {
        installDropdownBtn.classList.remove('hidden');
      }
    }
  }

  /**
   * คำสั่งเริ่มการติดตั้งแอปลงเครื่อง
   */
  async promptInstall() {
    if (this.deferredPrompt) {
      // สำหรับ Chromium browsers (Chrome, Edge, Brave บน Mac/PC/Android)
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      console.log('User choice:', choiceResult.outcome);
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      } else {
        console.log('User dismissed the PWA install prompt');
      }
      this.deferredPrompt = null;
      this.toggleInstallButton(false);
    } else {
      // สำหรับ Safari / iOS หรือเบราว์เซอร์ที่ไม่รองรับ beforeinstallprompt ตรงๆ
      this.showIosOrManualInstallModal();
    }
  }

  /**
   * แสดงคำแนะนำการติดตั้งสำหรับ iOS / Safari
   */
  showIosOrManualInstallModal() {
    const modal = document.getElementById('pwa-install-guide-modal');
    if (modal) {
      modal.classList.remove('hidden');
    } else {
      alert('📱 วิธีติดตั้ง Smart GovReport Hub ลงเครื่อง:\n1. บน Safari: คลิกปุ่มแชร์ (Share icon) ด้านบน/ล่าง\n2. เลือก "Add to Home Screen" หรือ "Add to Dock"');
    }
  }

  closeInstallGuideModal() {
    const modal = document.getElementById('pwa-install-guide-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /**
   * เฝ้าระวังสถานะเครือข่าย Online / Offline
   */
  setupNetworkMonitor() {
    const updateStatus = () => {
      this.isOnline = navigator.onLine;
      console.log(`🌐 [PWA Network] Connectivity changed: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
      this.updateNetworkBadge();

      if (this.isOnline) {
        this.showToast('🟢 ออนไลน์: เชื่อมต่ออินเทอร์เน็ตแล้ว พร้อมซิงค์ข้อมูลอัตโนมัติ', 'info');
        // กระตุ้นให้ DB API ลองซิงค์ข้อมูลที่ค้างไว้
        if (window.dbApi && typeof window.dbApi.fetchFullState === 'function') {
          window.dbApi.fetchFullState().catch(() => {});
        }
      } else {
        this.showToast('⚡ ออฟไลน์: กำลังใช้งานแบบออฟไลน์ บันทึกข้อมูลในเครื่องได้ปกติ', 'warning');
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // ตั้งค่าเริ่มต้น
    this.updateNetworkBadge();
  }

  /**
   * อัปเดต Network Badge ใน Header
   */
  updateNetworkBadge() {
    const badge = document.getElementById('pwa-network-badge');
    if (!badge) return;

    if (this.isOnline) {
      badge.className = 'flex items-center space-x-1.5 px-2 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 font-medium shadow-xs';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span class="text-[10px] font-bold text-white hidden md:inline">Online</span>
      `;
      badge.title = 'สถานะ: ออนไลน์ (เชื่อมต่อ PostgreSQL 5432 และ Cloud สมบูรณ์)';
    } else {
      badge.className = 'flex items-center space-x-1.5 px-2 py-1 rounded-full bg-amber-950/70 border border-amber-500/50 text-[11px] text-amber-300 font-medium shadow-xs animate-pulse';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span class="text-[10px] font-bold text-amber-200 hidden md:inline">Offline (โหมดพกพา)</span>
      `;
      badge.title = 'สถานะ: ออฟไลน์ (ระบบกำลังทำงานบนหน่วยความจำของเครื่อง ข้อมูลไม่สูญหาย)';
    }
  }

  /**
   * แจ้งเตือนเมื่อมีอัปเดตเวอร์ชันใหม่
   */
  showUpdateNotification() {
    const banner = document.getElementById('pwa-update-banner');
    if (banner) {
      banner.classList.remove('hidden');
    } else {
      this.showToast('🚀 มีระบบเวอร์ชันใหม่ คลิกเพื่อรีเฟรชอัปเดต', 'info', () => {
        this.applyUpdate();
      });
    }
  }

  /**
   * บังคับสั่ง Service Worker ใช้เวอร์ชันใหม่
   */
  applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ action: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }

  /**
   * คำสั่งล้างแคช PWA ทั้งหมด (สำหรับแก้ปัญหาเมื่อต้องการโหลดสดใหม่)
   */
  async clearCacheAndReload() {
    const confirmed = confirm('ยืนยันการล้างแคช PWA ของระบบและโหลดใหม่ทั้งหมด? (ข้อมูล OJT และลายเซ็นจะไม่สูญหาย)');
    if (!confirmed) return;

    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 [PWA Manager] All caches deleted.');
      }
      if (this.swRegistration) {
        await this.swRegistration.unregister();
        console.log('🧹 [PWA Manager] Service worker unregistered.');
      }
      this.showToast('✅ ล้างแคชเรียบร้อย กำลังโหลดระบบใหม่...', 'success');
      setTimeout(() => {
        window.location.reload(true);
      }, 800);
    } catch (e) {
      console.error('Error clearing cache:', e);
      window.location.reload();
    }
  }

  /**
   * แสดง Toast Notification สำหรับ PWA
   */
  showToast(message, type = 'info', onClickAction = null) {
    let container = document.getElementById('pwa-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'pwa-toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colorClasses = {
      success: 'bg-slate-900/95 border-emerald-500/50 text-emerald-300',
      warning: 'bg-slate-900/95 border-amber-500/50 text-amber-300',
      info: 'bg-slate-900/95 border-blue-500/50 text-blue-300'
    }[type] || 'bg-slate-900/95 border-slate-600 text-white';

    toast.className = `pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs transition-all duration-300 transform translate-y-2 opacity-0 cursor-pointer ${colorClasses}`;
    toast.innerHTML = `
      <div class="flex-1 font-medium">${message}</div>
      <button class="text-slate-400 hover:text-white text-xs">&times;</button>
    `;

    if (onClickAction) {
      toast.addEventListener('click', onClickAction);
    }

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toast.remove();
    });

    container.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 350);
    }, 5000);
  }

  bindUI() {
    // ผูกคำสั่งปุ่มติดตั้ง
    const installBtn = document.getElementById('btn-pwa-install');
    if (installBtn) {
      installBtn.addEventListener('click', () => this.promptInstall());
    }

    const installDropdownBtn = document.getElementById('hub-pwa-install-btn');
    if (installDropdownBtn) {
      installDropdownBtn.addEventListener('click', () => {
        if (typeof window.toggleSystemHubDropdown === 'function') {
          window.toggleSystemHubDropdown();
        }
        this.promptInstall();
      });
    }

    // ตรวจสอบว่าควรแสดงปุ่มติดตั้งบน Safari/iOS หรือไม่
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if ((isIos || isSafari) && !this.isStandalone) {
      this.toggleInstallButton(true);
    }
  }
}

// สร้าง Instance และผูกเข้าสู่ระดับ Global
window.pwaManager = new PwaManager();

export { PwaManager };
