// Module: 07-signature.js (Smart GovReport Hub 2.5)
// =========================================================================
    // SECURITY CONTROLLER, DUAL-ROLE PIN, PDPA MASKING & DIGITAL SIGNATURE
    // =========================================================================
    let isPdpaEnabled = false;
    let selectedRoleForUnlock = 'trainee';
    let targetWeekForSignature = null;
    let sigCanvas = null;
    let sigCtx = null;
    let isDrawingSig = false;

    const defaultSecurityState = {
      isLocked: false,
      activeRole: 'trainee', // 'trainee' or 'supervisor'
      traineePinHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // default '123456'
      supervisorPinHash: '937377f056160fc4b15e0b770c67136a5f03c15205b4d3bf918268fefa2c6d0a', // default '999999'
      signatures: {}, // weekNum -> { image: base64, timestamp: string, supervisorName: string }
      traineeSignatures: {} // weekNum -> { image: base64, timestamp: string, traineeName: string }
    };

    let securityState = JSON.parse(JSON.stringify(defaultSecurityState));

    async function hashPin(pin) {
      if (!pin) return '';
      const encoder = new TextEncoder();
      const data = encoder.encode(String(pin).trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function sanitizeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

        function formatTraineeNameWithTitle(name) {
      if (!name) return '...................................................';
      const clean = name.trim();
      if (clean.startsWith('นาย') || clean.startsWith('นางสาว') || clean.startsWith('นาง')) {
        return clean;
      }
      return 'นาย' + clean;
    }

    function maskText(str) {
      if (!str || !isPdpaEnabled) return str;
      return String(str).replace(/([ก-๙a-zA-Z]{1})[ก-๙a-zA-Z]+/g, '$1***');
    }

    function maskPhone(str) {
      if (!str || !isPdpaEnabled) return str;
      return String(str).replace(/(\d{2,3})[\s-]?\d{3,4}[\s-]?\d{3,4}/, '$1-***-****');
    }

    function togglePdpaMode() {
      isPdpaEnabled = !isPdpaEnabled;
      const btn = document.getElementById('pdpa-toggle-btn');
      const label = document.getElementById('pdpa-status-label');
      if (isPdpaEnabled) {
        if (btn) btn.className = 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition animate-pulse whitespace-nowrap flex-shrink-0';
        if (label) {
          label.innerText = 'เปิดใช้งาน';
          label.className = 'text-[10px] px-1.5 py-0.5 rounded bg-emerald-800/80 border border-emerald-300 text-white font-bold';
        }
      } else {
        if (btn) btn.className = 'bg-blue-950/70 hover:bg-blue-900 text-blue-200 border border-blue-500/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition whitespace-nowrap flex-shrink-0';
        if (label) {
          label.innerText = 'ปิด';
          label.className = 'text-[10px] px-1.5 py-0.5 rounded bg-blue-900/80 border border-blue-500/30 text-slate-200';
        }
      }
      renderOjtPages();
      renderProfileHeader();
      renderProjectSummary();
    }

    function updateSecurityUI() {
      const roleLabel = document.getElementById('security-role-label');
      const icon = document.getElementById('security-icon');
      const roleBtn = document.getElementById('security-role-btn');
      const modalRole = document.getElementById('sec-modal-current-role');
      const modalLockBtn = document.getElementById('sec-modal-lock-btn');

      if (securityState.isLocked) {
        if (roleLabel) roleLabel.innerText = 'ล็อคระบบ';
        if (icon) icon.className = 'fa-solid fa-lock text-red-400';
        if (roleBtn) roleBtn.className = 'bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition whitespace-nowrap flex-shrink-0';
        if (modalRole) modalRole.innerText = 'ล็อคระบบ (Read-Only)';
        if (modalLockBtn) {
          modalLockBtn.className = 'px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-semibold border border-emerald-300 transition flex items-center space-x-1.5 shadow-2xs';
          modalLockBtn.innerHTML = '<i class="fa-solid fa-lock-open text-emerald-600"></i><span>ปลดล็อค</span>';
        }
      } else {
        const roleText = securityState.activeRole === 'supervisor' ? 'ผู้ควบคุมงาน' : 'ผู้ฝึกงาน';
        if (roleLabel) roleLabel.innerText = roleText;
        if (icon) icon.className = 'fa-solid fa-lock-open text-emerald-400';
        if (roleBtn) roleBtn.className = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition whitespace-nowrap flex-shrink-0';
        if (modalRole) modalRole.innerText = `${roleText} (แก้ไขได้)`;
        if (modalLockBtn) {
          modalLockBtn.className = 'px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-semibold border border-amber-300 transition flex items-center space-x-1.5 shadow-2xs';
          modalLockBtn.innerHTML = '<i class="fa-solid fa-lock text-amber-600"></i><span>ล็อคระบบทันที</span>';
        }
      }

      // Hide or disable edit buttons across system if locked
      const editButtons = document.querySelectorAll('button[onclick*="openEditEntryModal"], button[onclick*="openAddEntryModal"], button[onclick*="openProfileEditModal"], button[onclick*="openPhotoModal"], button[onclick*="openProjectSummaryEditModal"]');
      editButtons.forEach(btn => {
        if (securityState.isLocked) {
          btn.classList.add('opacity-40', 'pointer-events-none');
          btn.setAttribute('title', 'ระบบถูกล็อคอยู่ กรุณากรอก PIN เพื่อปลดล็อค');
        } else {
          btn.classList.remove('opacity-40', 'pointer-events-none');
          btn.removeAttribute('title');
        }
      });
    }

    function openSecurityModal() {
      const session = getActiveSession();
      if (session && session.role === 'trainee') {
        openDirectPinChangeModal('trainee');
        return;
      }
      updateSecurityUI();
      const pinIn = document.getElementById('sec-unlock-pin');
      if (pinIn) pinIn.value = '';
      selectRoleToUnlock(securityState.activeRole);
      const modal = document.getElementById('security-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeSecurityModal() {
      const modal = document.getElementById('security-modal');
      if (modal) modal.classList.add('hidden');
    }

    function toggleScreenLock() {
      securityState.isLocked = !securityState.isLocked;
      saveSecurityState();
      updateSecurityUI();
      if (securityState.isLocked) {
        closeSecurityModal();
        alert('🔒 ล็อคระบบเรียบร้อยแล้ว (โหมดอ่านอย่างเดียว)');
      }
    }

    function selectRoleToUnlock(role) {
      selectedRoleForUnlock = role;
      const btnTrainee = document.getElementById('btn-role-trainee');
      const btnSuper = document.getElementById('btn-role-supervisor');
      if (role === 'trainee') {
        if (btnTrainee) btnTrainee.className = 'p-2.5 rounded-xl border text-center font-semibold text-xs transition border-govNavy bg-govNavy/5 text-govNavy shadow-2xs';
        if (btnSuper) btnSuper.className = 'p-2.5 rounded-xl border text-center font-semibold text-xs transition border-slate-200 hover:border-govNavy text-slate-700';
      } else {
        if (btnTrainee) btnTrainee.className = 'p-2.5 rounded-xl border text-center font-semibold text-xs transition border-slate-200 hover:border-govNavy text-slate-700';
        if (btnSuper) btnSuper.className = 'p-2.5 rounded-xl border text-center font-semibold text-xs transition border-govGold bg-amber-50/50 text-govNavy shadow-2xs';
      }
    }

    async function confirmUnlockRole() {
      const pinInput = document.getElementById('sec-unlock-pin');
      const pin = pinInput ? pinInput.value.trim() : '';

      if (pin.length < 6) {
        alert('⚠️ รหัส PIN ต้องมีความยาวมากกว่าหรือเท่ากับ 6 หลักขึ้นไปตามมาตรฐานความปลอดภัย');
        return;
      }

      const inputHash = await hashPin(pin);
      const targetHash = selectedRoleForUnlock === 'supervisor' ? securityState.supervisorPinHash : securityState.traineePinHash;

      if (inputHash === targetHash) {
        securityState.activeRole = selectedRoleForUnlock;
        securityState.isLocked = false;
        saveSecurityState();
        updateSecurityUI();
        closeSecurityModal();
        alert(`✅ ปลดล็อคสำเร็จ! เข้าสู่บทบาท: ${selectedRoleForUnlock === 'supervisor' ? 'ผู้ควบคุมงาน' : 'ผู้ฝึกภาคปฏิบัติ'}`);
      } else {
        alert('❌ รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        if (pinInput) { pinInput.value = ''; pinInput.focus(); }
      }
    }

    function toggleChangePinSection() {
      const sec = document.getElementById('change-pin-section');
      const icon = document.getElementById('change-pin-chevron');
      if (sec) {
        sec.classList.toggle('hidden');
        if (icon) icon.className = sec.classList.contains('hidden') ? 'fa-solid fa-chevron-down text-xs' : 'fa-solid fa-chevron-up text-xs';
      }
    }

    async function saveNewPin() {
      const targetRole = document.getElementById('change-pin-target-role').value;
      const currentPin = document.getElementById('current-pin-input').value.trim();
      const newPin = document.getElementById('new-pin-input').value.trim();
      const confirmPin = document.getElementById('confirm-new-pin-input').value.trim();

      if (newPin.length < 6) {
        alert('⚠️ รหัส PIN ใหม่ต้องมีความยาวมากกว่าหรือเท่ากับ 6 หลักขึ้นไปตามข้อกำหนดความปลอดภัย');
        return;
      }

      if (newPin !== confirmPin) {
        alert('⚠️ รหัส PIN ใหม่และการยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
        return;
      }

      const currentHash = await hashPin(currentPin);
      const expectedHash = targetRole === 'supervisor' ? securityState.supervisorPinHash : securityState.traineePinHash;

      if (currentHash !== expectedHash) {
        alert('❌ รหัส PIN ปัจจุบันไม่ถูกต้อง ไม่สามารถเปลี่ยนรหัสได้');
        return;
      }

      const newHash = await hashPin(newPin);
      if (targetRole === 'supervisor') {
        securityState.supervisorPinHash = newHash;
      } else {
        securityState.traineePinHash = newHash;
      }

      saveSecurityState();
      alert(`🎉 เปลี่ยนรหัส PIN สำหรับบทบาท [${targetRole === 'supervisor' ? 'ผู้ควบคุมงาน' : 'ผู้ฝึกงาน'}] เรียบร้อยแล้ว!`);
      document.getElementById('current-pin-input').value = '';
      document.getElementById('new-pin-input').value = '';
      document.getElementById('confirm-new-pin-input').value = '';
      toggleChangePinSection();
    }

    function openDirectPinChangeModal(role = null) {
      const session = getActiveSession();
      let targetRole = role;
      if (!targetRole) {
        targetRole = (session && session.role === 'trainee') ? 'trainee' : 'supervisor';
      }
      
      const modal = document.getElementById('direct-pin-change-modal');
      const roleSelect = document.getElementById('direct-pin-role');
      const roleBadge = document.getElementById('direct-pin-role-badge');
      const roleNotice = document.getElementById('direct-pin-role-notice');
      const currentPinIn = document.getElementById('direct-current-pin');
      const newPinIn = document.getElementById('direct-new-pin');
      const confirmPinIn = document.getElementById('direct-confirm-pin');
      const curHint = document.getElementById('direct-cur-pin-hint');
      
      if (roleSelect) {
        roleSelect.value = targetRole;
        if (session && session.role === 'trainee') {
          roleSelect.disabled = true;
          if (roleBadge) roleBadge.innerText = 'ผู้ฝึกภาคปฏิบัติ (คนพิการ)';
          if (curHint) curHint.innerText = 'PIN ค่าเริ่มต้นคือ 123456';
        } else {
          roleSelect.disabled = false;
          if (roleBadge) roleBadge.innerText = targetRole === 'supervisor' ? 'ผู้ควบคุมการฝึกงาน (Supervisor)' : 'ผู้ฝึกภาคปฏิบัติ (คนพิการ)';
          if (curHint) curHint.innerText = targetRole === 'supervisor' ? 'PIN ค่าเริ่มต้นคือ 999999' : 'PIN ค่าเริ่มต้นคือ 123456';
        }
      }
      
      if (currentPinIn) currentPinIn.value = '';
      if (newPinIn) newPinIn.value = '';
      if (confirmPinIn) confirmPinIn.value = '';
      
      if (modal) modal.classList.remove('hidden');
    }

    function onDirectPinRoleChange() {
      const roleSelect = document.getElementById('direct-pin-role');
      const curHint = document.getElementById('direct-cur-pin-hint');
      const roleBadge = document.getElementById('direct-pin-role-badge');
      if (roleSelect) {
        const val = roleSelect.value;
        if (roleBadge) roleBadge.innerText = val === 'supervisor' ? 'ผู้ควบคุมการฝึกงาน (Supervisor)' : 'ผู้ฝึกภาคปฏิบัติ (คนพิการ)';
        if (curHint) curHint.innerText = val === 'supervisor' ? 'PIN ค่าเริ่มต้นคือ 999999' : 'PIN ค่าเริ่มต้นคือ 123456';
      }
    }

    function closeDirectPinChangeModal() {
      const modal = document.getElementById('direct-pin-change-modal');
      if (modal) modal.classList.add('hidden');
    }

    async function submitDirectPinChange() {
      const session = getActiveSession();
      const roleSelect = document.getElementById('direct-pin-role');
      const targetRole = (session && session.role === 'trainee') ? 'trainee' : (roleSelect ? roleSelect.value : 'trainee');
      
      const currentPin = (document.getElementById('direct-current-pin')?.value || '').trim();
      const newPin = (document.getElementById('direct-new-pin')?.value || '').trim();
      const confirmPin = (document.getElementById('direct-confirm-pin')?.value || '').trim();

      if (!currentPin) {
        alert('⚠️ กรุณาระบุ PIN ปัจจุบัน (ค่าเริ่มต้น: ผู้ฝึกงานใช้ 123456 | ผู้ควบคุมงานใช้ 999999)');
        return;
      }

      if (newPin.length < 6) {
        alert('⚠️ รหัส PIN ใหม่ต้องมีความยาวอย่างน้อย 6 หลักขึ้นไปตามมาตรฐานความปลอดภัย');
        return;
      }

      if (newPin !== confirmPin) {
        alert('⚠️ รหัส PIN ใหม่ และการยืนยัน PIN ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
        return;
      }

      const currentHash = await hashPin(currentPin);
      const expectedHash = targetRole === 'supervisor' ? securityState.supervisorPinHash : securityState.traineePinHash;

      if (currentHash !== expectedHash) {
        alert(`❌ รหัส PIN ปัจจุบันไม่ถูกต้อง (PIN ค่าเริ่มต้นคือ: ${targetRole === 'supervisor' ? '999999' : '123456'})`);
        return;
      }

      const newHash = await hashPin(newPin);
      if (targetRole === 'supervisor') {
        securityState.supervisorPinHash = newHash;
      } else {
        securityState.traineePinHash = newHash;
      }

      saveSecurityState();
      closeDirectPinChangeModal();
      alert(`🎉 เปลี่ยนรหัส PIN ส่วนตัวสำหรับ [${targetRole === 'supervisor' ? 'ผู้ควบคุมงาน' : 'ผู้ฝึกภาคปฏิบัติ (คนพิการ)'}] เรียบร้อยแล้ว!\nสามารถใช้รหัสใหม่ (${newPin}) ในการลงนามดิจิทัลได้ทันทีครับ`);
    }

    // Export to window for global access
    window.openDirectPinChangeModal = openDirectPinChangeModal;
    window.closeDirectPinChangeModal = closeDirectPinChangeModal;
    window.submitDirectPinChange = submitDirectPinChange;
    window.onDirectPinRoleChange = onDirectPinRoleChange;

    function saveSecurityState() {
      try {
        const secKey = getUserStorageKey('smartgov_security_state_v2_0');
        localStorage.setItem(secKey, JSON.stringify(securityState));
      } catch (err) {
        console.error('Error saving security state:', err);
      }
    }

    function loadSecurityState() {
      try {
        const session = getActiveSession();
        let targetUser = 'trainee_jake';
        if (session && session.role === 'trainee') {
          targetUser = session.username;
        } else if (currentViewTrainee) {
          targetUser = currentViewTrainee;
        }
        const secKey = getUserStorageKey('smartgov_security_state_v2_0', targetUser);
        
        // Backward compatibility migration for trainee_jake
        if (targetUser.toLowerCase() === 'trainee_jake') {
          if (!localStorage.getItem(secKey) && localStorage.getItem('smartgov_security_state_v2_0')) {
            localStorage.setItem(secKey, localStorage.getItem('smartgov_security_state_v2_0'));
          }
        }

        const saved = localStorage.getItem(secKey);
        if (saved) {
          securityState = Object.assign(JSON.parse(JSON.stringify(defaultSecurityState)), JSON.parse(saved));
        } else {
          securityState = JSON.parse(JSON.stringify(defaultSecurityState));
        }
        if (!securityState.traineeSignatures) {
          securityState.traineeSignatures = {};
        }
        if (!securityState.signatures) {
          securityState.signatures = {};
        }
      } catch (err) {
        console.error('Error loading security state:', err);
      }
    }

    function initSignatureCanvas() {
      sigCanvas = document.getElementById('signature-canvas');
      if (!sigCanvas) return;
      sigCtx = sigCanvas.getContext('2d');
      sigCtx.strokeStyle = '#0f172a';
      sigCtx.lineWidth = 2.5;
      sigCtx.lineCap = 'round';
      sigCtx.lineJoin = 'round';

      function getPos(e) {
        const rect = sigCanvas.getBoundingClientRect();
        const scaleX = sigCanvas.width / (rect.width || 1);
        const scaleY = sigCanvas.height / (rect.height || 1);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      }

      function startDraw(e) {
        e.preventDefault();
        isDrawingSig = true;
        if (e.pointerId && sigCanvas.setPointerCapture) {
          try { sigCanvas.setPointerCapture(e.pointerId); } catch(err) {}
        }
        const p = getPos(e);
        sigCtx.beginPath();
        sigCtx.moveTo(p.x, p.y);
        const hint = document.getElementById('sig-canvas-hint');
        if (hint) hint.classList.add('hidden');
      }

      function draw(e) {
        if (!isDrawingSig) return;
        e.preventDefault();
        const p = getPos(e);
        sigCtx.lineTo(p.x, p.y);
        sigCtx.stroke();
      }

      function endDraw(e) {
        isDrawingSig = false;
        if (e && e.pointerId && sigCanvas.releasePointerCapture) {
          try { sigCanvas.releasePointerCapture(e.pointerId); } catch(err) {}
        }
      }

      // Avoid adding duplicate listeners
      if (!sigCanvas.dataset.sigBound) {
        sigCanvas.dataset.sigBound = 'true';
        
        // Pointer Events (Apple Pencil, iPad touch, Mac trackpad/mouse)
        if (window.PointerEvent) {
          sigCanvas.addEventListener('pointerdown', startDraw);
          sigCanvas.addEventListener('pointermove', draw);
          window.addEventListener('pointerup', endDraw);
          window.addEventListener('pointercancel', endDraw);
        } else {
          sigCanvas.addEventListener('mousedown', startDraw);
          sigCanvas.addEventListener('mousemove', draw);
          window.addEventListener('mouseup', endDraw);

          sigCanvas.addEventListener('touchstart', startDraw, { passive: false });
          sigCanvas.addEventListener('touchmove', draw, { passive: false });
          window.addEventListener('touchend', endDraw);
        }
      }
    }

    function clearSignatureCanvas() {
      if (sigCtx && sigCanvas) {
        sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        const hint = document.getElementById('sig-canvas-hint');
        if (hint) hint.classList.remove('hidden');
      }
    }

    let currentSigningRole = 'supervisor'; // 'supervisor' or 'trainee'

    function openSignatureModal(weekNum, role = 'supervisor') {
      const session = getActiveSession();
      if (role === 'supervisor' && session && session.role === 'trainee') {
        alert('🚫 ผู้ฝึกงานไม่มีสิทธิ์ลงนามอนุมัติรายงานในฐานะผู้ควบคุมงาน');
        return;
      }
      targetWeekForSignature = weekNum;
      currentSigningRole = role;

      const title = document.getElementById('signature-modal-title');
      const subtitle = document.getElementById('signature-modal-subtitle');
      const pinLabel = document.getElementById('sig-pin-label');
      const pinInput = document.getElementById('sig-supervisor-pin');
      const pinNote = document.getElementById('sig-pin-note');
      const submitBtnText = document.getElementById('sig-submit-btn-text');

      if (role === 'trainee') {
        if (title) title.innerText = 'ลงนามดิจิทัล (ผู้ฝึกภาคปฏิบัติ / คนพิการ)';
        if (subtitle) subtitle.innerText = `สัปดาห์ที่ ${toThaiNum(weekNum)} • รับรองรายงานผลการปฏิบัติงาน`;
        if (pinLabel) pinLabel.innerHTML = '<i class="fa-solid fa-key mr-1 text-govGold"></i> ระบุ PIN ผู้ฝึกภาคปฏิบัติ (คนพิการ):';
        if (pinInput) pinInput.placeholder = 'ป้อน PIN ผู้ฝึกปฏิบัติ (ค่าเริ่มต้น: 123456)';
        if (pinNote) pinNote.innerText = 'เฉพาะผู้ฝึกภาคปฏิบัติที่มีรหัสผ่านเพื่อยืนยันความถูกต้องของรายงาน';
        if (submitBtnText) submitBtnText.innerText = 'บันทึกลายมือชื่อคนพิการ';
      } else {
        if (title) title.innerText = 'ลงนามรับรองดิจิทัล (ผู้ควบคุมงาน / Supervisor)';
        if (subtitle) subtitle.innerText = `สัปดาห์ที่ ${toThaiNum(weekNum)} • ยืนยันการตรวจและล็อคชั่วโมงสะสม`;
        if (pinLabel) pinLabel.innerHTML = '<i class="fa-solid fa-key mr-1 text-govGold"></i> ระบุ PIN ผู้ควบคุมงาน (มากกว่า 6 หลัก):';
        if (pinInput) pinInput.placeholder = 'ป้อน PIN ผู้ควบคุมงาน (ค่าเริ่มต้น: 999999)';
        if (pinNote) pinNote.innerText = 'เฉพาะผู้ควบคุมงานที่มีรหัสผ่านเท่านั้นที่สามารถอนุมัติและประทับตรารับรองได้';
        if (submitBtnText) submitBtnText.innerText = 'อนุมัติและล็อคข้อมูลสัปดาห์นี้';
      }

      if (pinInput) pinInput.value = '';
      clearSignatureCanvas();

      const modal = document.getElementById('signature-modal');
      if (modal) {
        modal.classList.remove('hidden');
        setTimeout(initSignatureCanvas, 100);
      }
    }

    function closeSignatureModal() {
      const modal = document.getElementById('signature-modal');
      if (modal) modal.classList.add('hidden');
      targetWeekForSignature = null;
    }

    async function submitSupervisorSignature() {
      if (!targetWeekForSignature) return;

      const pinInput = document.getElementById('sig-supervisor-pin');
      const pin = pinInput ? pinInput.value.trim() : '';

      if (pin.length < 6) {
        alert('⚠️ รหัส PIN ต้องมีความยาวอย่างน้อย 6 หลักขึ้นไป');
        return;
      }

      const hash = await hashPin(pin);
      const targetHash = currentSigningRole === 'trainee' ? securityState.traineePinHash : securityState.supervisorPinHash;

      if (hash !== targetHash) {
        alert(`❌ รหัส PIN ${currentSigningRole === 'trainee' ? 'ผู้ฝึกภาคปฏิบัติ' : 'ผู้ควบคุมงาน'} ไม่ถูกต้อง กรุณาระบุรหัสที่ถูกต้อง`);
        return;
      }

      if (!sigCanvas) return;
      const sigDataURL = sigCanvas.toDataURL('image/png');

      const now = new Date();
      const thaiMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
      const dateStr = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543} เวลา ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} น.`;
      const dateOnlyStr = `${toThaiNum(now.getDate())}  ${thaiMonths[now.getMonth()]}  ${toThaiNum(now.getFullYear() + 543)}`;

      if (currentSigningRole === 'trainee') {
        if (!securityState.traineeSignatures) securityState.traineeSignatures = {};
        securityState.traineeSignatures[targetWeekForSignature] = {
          image: sigDataURL,
          timestamp: dateStr,
          dateOnly: dateOnlyStr,
          traineeName: profileData.traineeName || 'นายนิติพัฒน์ คุ้มวงษ์'
        };
      } else {
        if (!securityState.signatures) securityState.signatures = {};
        securityState.signatures[targetWeekForSignature] = {
          image: sigDataURL,
          timestamp: dateStr,
          dateOnly: dateOnlyStr,
          supervisorName: profileData.supervisorName || 'นางสาวสรินยา สุวรรณวณิช',
          supervisorPos: profileData.supervisorPos || 'ผู้อำนวยการกลุ่มงานสารสนเทศ'
        };
      }

      saveSecurityState();
      renderOjtPages();
      const signedWeek = targetWeekForSignature;
      const signedRole = currentSigningRole;
      closeSignatureModal();

      if (signedRole === 'trainee') {
        alert(`🎉 คนพิการลงนามรับรองสัปดาห์ที่ ${toThaiNum(signedWeek)} สำเร็จแล้ว!`);
      } else {
        alert(`🎉 ผู้ควบคุมงานลงนามรับรองสัปดาห์ที่ ${toThaiNum(signedWeek)} สำเร็จแล้ว!
ระบบได้ทำการล็อคตารางสัปดาห์นี้เพื่อป้องกันการแก้ไขย้อนหลังเรียบร้อยครับ`);
      }
    }

    function unlockWeekSignature(weekNum, role = 'supervisor') {
      const session = getActiveSession();
      if (role === 'supervisor' && session && session.role === 'trainee') {
        alert('🚫 ผู้ฝึกงานไม่มีสิทธิ์ยกเลิกหรือปลดล็อคลายมือชื่อการอนุมัติของผู้ควบคุมงาน');
        return;
      }
      if (role === 'trainee' && securityState.signatures && securityState.signatures[weekNum]) {
        alert('🔒 สัปดาห์นี้ได้รับการอนุมัติและลงนามรับรองจากผู้ควบคุมงานแล้ว ไม่สามารถยกเลิกลายเซ็นได้');
        return;
      }
      const roleText = role === 'trainee' ? 'คนพิการ' : 'ผู้ควบคุมงาน';
      if (confirm(`ต้องการยกเลิกลายเซ็นดิจิทัลของ${roleText} สัปดาห์ที่ ${toThaiNum(weekNum)} ใช่หรือไม่?`)) {
        if (role === 'trainee') {
          if (securityState.traineeSignatures && securityState.traineeSignatures[weekNum]) {
            delete securityState.traineeSignatures[weekNum];
          }
        } else {
          if (securityState.signatures && securityState.signatures[weekNum]) {
            delete securityState.signatures[weekNum];
          }
        }
        saveSecurityState();
        renderOjtPages();
        alert(`ยกเลิกลายเซ็นดิจิทัล${roleText} สัปดาห์ที่ ${toThaiNum(weekNum)} เรียบร้อยแล้ว`);
      }
    }

    // API URL Format Inspector
    function checkApiUrlFormat(input) {
      const warn = document.getElementById('api-url-warning');
      if (!warn) return;
      if (input.value.includes('/edit')) {
        warn.classList.remove('hidden');
      } else {
        warn.classList.add('hidden');
      }
    }

    // QR Code & Beam Sync Engine (Staff / Admin Only)
    async function openQrSyncModal() {
      const session = getActiveSession();
      if (!session || session.role !== 'staff') {
        alert('🚫 สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin/Staff) เท่านั้นที่สามารถใช้งานการซิงค์ผ่าน QR Code ได้');
        return;
      }
      saveToLocalStorage(true);
      const workingEndpoint = 'https://script.google.com/macros/s/AKfycbxuis78gea-uZjPKtgGg3hQ1an-jLRPrCNYSmVBoJTzVoUtzff8aXgHCPtXmAPrHxBJmw/exec';
      apiConfig.endpointUrl = workingEndpoint;
      apiConfig.autoSync = true;
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(apiConfig));

      const qrModal = document.getElementById('qr-sync-modal');
      const qrImg = document.getElementById('qr-sync-img');
      const qrStatus = document.getElementById('qr-sync-status');

      qrModal.classList.remove('hidden');
      if (qrStatus) qrStatus.innerHTML = '<span class="text-amber-600 font-bold animate-pulse">☁️ กำลังเตรียมข้อมูลขึ้น Cloud ก่อนสร้าง QR Code...</span>';

      // Push latest data to cloud in background
      await pushDataToApi(true);

      // Generate ultra-short clean QR code
      const currentOrigin = window.location.origin + window.location.pathname;
      const targetSyncUrl = `${currentOrigin}?sync=1&ts=${Date.now()}`;
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetSyncUrl)}`;
      window.lastSyncBeamUrl = targetSyncUrl;

      if (qrStatus) {
        qrStatus.innerHTML = '<span class="text-emerald-700 font-bold">✓ ข้อมูลล่าสุดพร้อมแล้ว!</span> ใช้กล้อง iPad สแกน QR Code ได้ทันที<br><span class="text-[10px] text-slate-400">ข้อมูลตาราง OJT, ชั่วโมงสะสม 24 ชม., และลายเซ็นจะถูกโคลนไปทันที</span>';
      }
    }

    function closeQrSyncModal() {
      document.getElementById('qr-sync-modal').classList.add('hidden');
    }

    function copyAirDropLink() {
      if (window.lastSyncBeamUrl) {
        navigator.clipboard.writeText(window.lastSyncBeamUrl).then(() => {
          alert("📋 คัดลอกลิงก์ซิงค์เรียบร้อยแล้ว! สามารถส่งเข้า LINE หรือ AirDrop เปิดบน iPad ข้อมูลจะมาครบ 100% ทันทีครับ");
        });
      }
    }

    // Incoming Beam Sync Detector (Auto-pull from URL hash on iPad)
    function checkIncomingBeamSync() {
      try {
        const hash = window.location.hash;
        if (hash && hash.includes('beam=')) {
          const rawEncoded = hash.split('beam=')[1];
          if (rawEncoded) {
            const decodedStr = decodeURIComponent(escape(atob(decodeURIComponent(rawEncoded))));
            const bundle = JSON.parse(decodedStr);
            if (bundle && (bundle.ojt || bundle.profile)) {
              if (bundle.ojt) liveOjtData = bundle.ojt;
              if (bundle.profile) profileData = Object.assign(profileData, bundle.profile);
              if (bundle.project) projectSummaryData = Object.assign(projectSummaryData, bundle.project);
              if (bundle.security) securityState = Object.assign(securityState, bundle.security);

              saveToLocalStorage(true);
              renderOjtPages();
              renderProfile();
              renderProfileHeader();
              renderProjectSummary();
              updateDashboardKPI();
              updateSecurityUI();

              // Clear hash cleanly
              history.replaceState(null, '', window.location.pathname);
              alert("🎉 ซิงค์ข้อมูลข้ามเครื่องสำเร็จ! ข้อมูลทั้งหมด (ตาราง OJT, ผลงาน, รูปภาพ และลายเซ็น) ปรากฏบน iPad เรียบร้อยแล้วครับ");
            }
          }
        }
      } catch (err) {
        console.error('Beam Sync parse error:', err);
      }
    }

