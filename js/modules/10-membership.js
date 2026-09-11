// Module: 10-membership.js (Smart GovReport Hub 2.5)
    // =========================================================================
    // TRAINEE ONBOARDING WIZARD CONTROLLER (3 STEPS)
    // =========================================================================
    let currentOnboardingStep = 1;

    function isOnboardingCompleted(username) {
      if (!username) return true;
      if (username.toLowerCase() === 'trainee_jake' || username.toLowerCase() === 'admin_ict' || username.toLowerCase() === 'sup_sarinya') {
        return true; // Pre-seeded users are always complete
      }
      const onboardedKey = getUserStorageKey(STORAGE_KEYS.ONBOARDED, username);
      return localStorage.getItem(onboardedKey) === 'true';
    }

    function setOnboardingCompleted(username) {
      if (!username) return;
      const onboardedKey = getUserStorageKey(STORAGE_KEYS.ONBOARDED, username);
      localStorage.setItem(onboardedKey, 'true');
    }

    function openOnboardingModal() {
      const session = getActiveSession();
      if (!session || session.role !== 'trainee') return;

      currentOnboardingStep = 1;
      updateOnboardingStepUI();

      // Pre-fill Step 1 with user session data
      document.getElementById('ob-org-name').value = profileData.orgName || session.department || 'สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร';
      document.getElementById('ob-org-addr').value = profileData.orgAddr || 'อาคารรัฐประศาสนภักดี ศูนย์ราชการเฉลิมพระเกียรติฯ ถ.แจ้งวัฒนะ กทม. 10210';
      document.getElementById('ob-org-phone').value = profileData.orgPhone || '0 2141 9999';
      document.getElementById('ob-org-fax').value = profileData.orgFax || '0 2143 8888';

      // Supervisor pre-fill
      let supName = profileData.supervisorName || 'นางสาวสรินยา สุวรรณวณิช';
      if (session.supervisor_username) {
        const localUsers = getLocalUsers();
        const supObj = localUsers.find(u => u.username.toLowerCase() === session.supervisor_username.toLowerCase());
        if (supObj && supObj.full_name) supName = supObj.full_name;
      }
      document.getElementById('ob-sup-name').value = supName;
      document.getElementById('ob-sup-pos').value = profileData.supervisorPos || 'ผู้อำนวยการกลุ่มงานสารสนเทศและพัฒนาระบบ';

      // Trainee pre-fill
      document.getElementById('ob-trainee-name').value = session.full_name || session.username;
      document.getElementById('ob-trainee-nick').value = session.nickname || (session.full_name ? session.full_name.split(' ')[0] : session.username);
      document.getElementById('ob-trainee-disability').value = session.disability_type || 'ทางการได้ยินหรือการเคลื่อนไหว (OJT)';
      document.getElementById('ob-trainee-phone').value = session.phone || '08x-xxx-xxxx';
      document.getElementById('ob-trainee-email').value = session.email || '';

      // Reset workdays
      resetOnboardingWorkdays();

      // Step 2 & 3 Pre-fill
      const courseLabel = session.course_no ? `[${session.course_no} - ${session.course_type}] ` : '';
      document.getElementById('ob-pj-title').value = `รายงานผลการดำเนินงานโครงการ OJT ของ ${session.full_name || session.username}`;
      
      let headline = `ผู้เข้ารับการฝึกอบรม OJT เตรียมความพร้อมสำหรับการจ้างงานคนพิการภาครัฐ`;
      if (session.interests) {
        headline = `ผู้เข้าอบรม OJT (${session.course_type || 'ภาครัฐ'}) - ${session.interests.length > 55 ? session.interests.substring(0, 52) + '...' : session.interests}`;
      }
      document.getElementById('ob-pf-headline').value = headline;
      document.getElementById('ob-exp-role-1').value = `ผู้ฝึกปฏิบัติงาน OJT ${courseLabel}`;
      document.getElementById('ob-exp-org-1').value = document.getElementById('ob-org-name').value;
      document.getElementById('ob-exp-period-1').value = `กันยายน 2569 (หลักสูตร OJT 90 ชม.)`;
      document.getElementById('ob-exp-desc-1').value = session.interests 
        ? `ปฏิบัติงานฝึกทักษะ: ${session.interests} พร้อมเรียนรู้ระบบสารบรรณและนวัตกรรมภาครัฐ`
        : `ปฏิบัติงานระบบสารบรรณอิเล็กทรอนิกส์ การจัดการฐานข้อมูล และนวัตกรรมดิจิทัล`;

      document.getElementById('trainee-onboarding-modal').classList.remove('hidden');
    }

    function updateOnboardingStepUI() {
      const stepNumEl = document.getElementById('onboarding-step-num');
      if (stepNumEl) stepNumEl.innerText = currentOnboardingStep;

      [1, 2, 3].forEach(s => {
        const panel = document.getElementById(`onboarding-step-${s}`);
        const ind = document.getElementById(`step-indicator-${s}`);
        if (s === currentOnboardingStep) {
          if (panel) panel.classList.remove('hidden');
          if (ind) {
            ind.className = 'p-2 rounded-xl bg-govNavy text-white transition flex items-center justify-center space-x-1.5 shadow-sm';
          }
        } else if (s < currentOnboardingStep) {
          if (panel) panel.classList.add('hidden');
          if (ind) {
            ind.className = 'p-2 rounded-xl bg-emerald-100 text-emerald-800 transition flex items-center justify-center space-x-1.5 font-bold';
          }
        } else {
          if (panel) panel.classList.add('hidden');
          if (ind) {
            ind.className = 'p-2 rounded-xl bg-slate-100 text-slate-500 transition flex items-center justify-center space-x-1.5';
          }
        }
      });

      const prevBtn = document.getElementById('btn-ob-prev');
      const nextBtn = document.getElementById('btn-ob-next');
      const finishBtn = document.getElementById('btn-ob-finish');

      if (currentOnboardingStep === 1) {
        if (prevBtn) prevBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (finishBtn) finishBtn.classList.add('hidden');
      } else if (currentOnboardingStep === 2) {
        if (prevBtn) prevBtn.classList.remove('hidden');
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (finishBtn) finishBtn.classList.add('hidden');
      } else if (currentOnboardingStep === 3) {
        if (prevBtn) prevBtn.classList.remove('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
        if (finishBtn) finishBtn.classList.remove('hidden');
      }
    }

    function resetOnboardingWorkdays() {
      document.getElementById('ob-cur-w1-dates').value = '1 - 4 ก.ย. 69';
      document.getElementById('ob-cur-w2-dates').value = '7 - 11 ก.ย. 69';
      document.getElementById('ob-cur-w3-dates').value = '14 - 18 ก.ย. 69';
      document.getElementById('ob-cur-w4-dates').value = '21 - 25 ก.ย. 69';
      document.getElementById('ob-cur-w5-dates').value = '28 - 30 ก.ย. 69';
      const w5Enable = document.getElementById('ob-cur-w5-enable');
      if (w5Enable) w5Enable.checked = true;
      document.getElementById('ob-sign-date').value = '30 กันยายน 2569';
    }

    function nextOnboardingStep() {
      if (currentOnboardingStep === 1) {
        const name = document.getElementById('ob-trainee-name').value.trim();
        const org = document.getElementById('ob-org-name').value.trim();
        const sup = document.getElementById('ob-sup-name').value.trim();
        if (!name || !org || !sup) {
          alert('⚠️ กรุณากรอกชื่อ-สกุลผู้ฝึก, หน่วยงานฝึกงาน, และชื่อผู้ควบคุมงานให้ครบถ้วน');
          return;
        }
      }
      if (currentOnboardingStep < 3) {
        currentOnboardingStep++;
        updateOnboardingStepUI();
        document.getElementById('trainee-onboarding-modal').scrollTop = 0;
      }
    }

    function prevOnboardingStep() {
      if (currentOnboardingStep > 1) {
        currentOnboardingStep--;
        updateOnboardingStepUI();
        document.getElementById('trainee-onboarding-modal').scrollTop = 0;
      }
    }

    function saveOnboardingWizard() {
      const session = getActiveSession();
      if (!session) return;

      // 1. Save Profile Data
      profileData.orgName = document.getElementById('ob-org-name').value.trim();
      profileData.orgAddr = document.getElementById('ob-org-addr').value.trim();
      profileData.orgPhone = document.getElementById('ob-org-phone').value.trim();
      profileData.orgFax = document.getElementById('ob-org-fax').value.trim();
      profileData.supervisorName = document.getElementById('ob-sup-name').value.trim();
      profileData.supervisorPos = document.getElementById('ob-sup-pos').value.trim();

      profileData.traineeName = document.getElementById('ob-trainee-name').value.trim();
      profileData.traineeNick = document.getElementById('ob-trainee-nick').value.trim();
      profileData.traineeDisability = document.getElementById('ob-trainee-disability').value.trim();
      profileData.traineePhone = document.getElementById('ob-trainee-phone').value.trim();
      profileData.traineeEmail = document.getElementById('ob-trainee-email').value.trim();

      if (!profileData.curriculum) profileData.curriculum = {};
      profileData.curriculum.w1 = { dates: document.getElementById('ob-cur-w1-dates').value.trim(), title: document.getElementById('ob-cur-w1-title').value.trim(), hours: "22.5 ชม." };
      profileData.curriculum.w2 = { dates: document.getElementById('ob-cur-w2-dates').value.trim(), title: document.getElementById('ob-cur-w2-title').value.trim(), hours: "22.5 ชม." };
      profileData.curriculum.w3 = { dates: document.getElementById('ob-cur-w3-dates').value.trim(), title: document.getElementById('ob-cur-w3-title').value.trim(), hours: "22.5 ชม." };
      profileData.curriculum.w4 = { dates: document.getElementById('ob-cur-w4-dates').value.trim(), title: document.getElementById('ob-cur-w4-title').value.trim(), hours: "22.5 ชม." };
      profileData.curriculum.w5 = {
        enabled: document.getElementById('ob-cur-w5-enable').checked,
        dates: document.getElementById('ob-cur-w5-dates').value.trim(),
        title: document.getElementById('ob-cur-w5-title').value.trim(),
        hours: "13.5 ชม."
      };
      profileData.signDateCover = document.getElementById('ob-sign-date').value.trim();

      // 2. Save Project Summary Data
      projectSummaryData.projectTitle = document.getElementById('ob-pj-title').value.trim();
      projectSummaryData.orgResponsible = document.getElementById('ob-pj-org').value.trim();
      projectSummaryData.reporterName = profileData.traineeName;
      projectSummaryData.reporterPos = document.getElementById('ob-pj-pos').value.trim();
      projectSummaryData.statusBadge = document.getElementById('ob-pj-status').value.trim();
      projectSummaryData.execSummary = document.getElementById('ob-pj-exec').value.trim();

      if (!projectSummaryData.canvas) projectSummaryData.canvas = {};
      projectSummaryData.canvas.problem = document.getElementById('ob-cv-prob').value.trim();
      projectSummaryData.canvas.objective = document.getElementById('ob-cv-obj').value.trim();
      projectSummaryData.canvas.target = document.getElementById('ob-cv-tgt').value.trim();
      projectSummaryData.canvas.activities = document.getElementById('ob-cv-act').value.trim();
      projectSummaryData.canvas.kpis = document.getElementById('ob-cv-kpi').value.trim();
      projectSummaryData.canvas.raci = document.getElementById('ob-cv-raci').value.trim();

      // 3. Save Official Memo Data
      officialMemoData.orgName = profileData.orgName;
      officialMemoData.signName = profileData.traineeName;
      officialMemoData.origin = `ตามที่ข้าพเจ้า ${profileData.traineeName} ได้รับมอบหมายให้เข้ารับการฝึกปฏิบัติงานในหลักสูตรเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ รุ่นที่ 1 และได้รับมอบหมายภารกิจในการปฏิบัติงานตามมาตรฐาน OJT นั้น`;

      // 4. Save Portfolio Data
      portfolioData.traineeName = profileData.traineeName;
      portfolioData.headline = document.getElementById('ob-pf-headline').value.trim() || `ผู้เข้ารับการฝึกอบรม OJT เตรียมความพร้อมสำหรับการจ้างงานคนพิการภาครัฐ`;
      portfolioData.trackBadge = `✓ Standard OJT Track`;
      portfolioData.hoursBadge = `⏳ OJT กำลังบันทึก`;
      portfolioData.experiences = [
        {
          role: document.getElementById('ob-exp-role-1').value.trim() || 'ผู้ฝึกปฏิบัติงาน OJT',
          org: document.getElementById('ob-exp-org-1').value.trim() || profileData.orgName,
          period: document.getElementById('ob-exp-period-1').value.trim() || 'กันยายน 2569',
          desc: document.getElementById('ob-exp-desc-1').value.trim() || 'ปฏิบัติงาน OJT'
        }
      ];
      portfolioData.skills = {
        data: document.getElementById('ob-skill-1').value.trim(),
        code: document.getElementById('ob-skill-2').value.trim(),
        gov: document.getElementById('ob-skill-3').value.trim(),
        ai: document.getElementById('ob-skill-4').value.trim()
      };
      portfolioData.vision = document.getElementById('ob-pf-vision').value.trim();

      // Set Onboarded Flag
      setOnboardingCompleted(session.username);

      // Persist to LocalStorage
      saveToLocalStorage();

      // Re-render views
      renderProfile();
      renderProfileHeader();
      renderProjectSummary();
      renderOfficialMemo();
      renderPortfolio();
      changeOjtWeek();
      renderChart();

      document.getElementById('trainee-onboarding-modal').classList.add('hidden');
      alert(`🎉 ตั้งค่าข้อมูลส่วนบุคคลสำเร็จ!\n\nระบบได้สร้างสมุดบันทึก OJT และแฟ้มสะสมผลงาน 1:1 ของคุณ [${profileData.traineeName}] เรียบร้อยแล้ว`);
    }

    function updateStorageUIIndicators(timeStr) {
      // Calculate total entries & hours
      let count = 0;
      let totalH = 0;
      Object.keys(liveOjtData).forEach(w => {
        if (liveOjtData[w]) {
          count += liveOjtData[w].length;
          liveOjtData[w].forEach(r => { totalH += (parseFloat(r.hours) || 0); });
        }
      });

      const headerLabel = document.getElementById('header-sync-label');
      if (headerLabel) {
        headerLabel.innerText = timeStr.startsWith('Cloud:') ? timeStr : `บันทึก: ${timeStr} น.`;
      }

      const localCount = document.getElementById('local-count-entries');
      if (localCount) localCount.innerText = `${count} รายการ (${totalH.toFixed(1)} ชม.)`;

      const localLastSave = document.getElementById('local-last-save');
      if (localLastSave) localLastSave.innerText = `${timeStr} น.`;

      const sidebarStatus = document.getElementById('sidebar-db-status');
      if (sidebarStatus) sidebarStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> ${timeStr}`;
    }

    /**
     * 🔔 Modern Floating Toast Notification
     */
    function showQuickNotification(msg, type = 'success') {
      const existing = document.getElementById('smartgov-toast-notification');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'smartgov-toast-notification';
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

    /**
     * 📥 1-Click JSON Complete Emergency Backup (ทุกคนกดได้ใน 1 วินาที)
     * ไม่จำกัดสิทธิ์ เพื่อให้พี่แจ็ค น้องๆ เด็กฝึกงาน และพี่เลี้ยงทุกคนสำรองข้อมูลของตนเองได้ทันที
     */
    function downloadCompleteBackupJSON() {
      try {
        const session = (typeof getActiveSession === 'function') ? getActiveSession() : null;
        const traineeName = (profileData && profileData.traineeName) 
          ? profileData.traineeName.replace(/[\s\(\)\/]+/g, '_') 
          : 'Trainee';
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');

        const payload = {
          app: "Smart GovReport Hub 2.5",
          version: "2.5.0",
          backupType: "COMPLETE_EMERGENCY_BACKUP",
          exportedAt: now.toISOString(),
          exportedBy: session ? (session.full_name || session.username) : traineeName,
          userRole: session ? session.role : 'trainee',
          profile: profileData,
          projectSummary: (typeof projectSummaryData !== 'undefined') ? projectSummaryData : null,
          officialMemo: (typeof officialMemoData !== 'undefined') ? officialMemoData : null,
          ojtWeeklyData: liveOjtData,
          security: (typeof securityState !== 'undefined') ? securityState : null,
          apiConfig: (typeof apiConfig !== 'undefined') ? {
            endpointUrl: apiConfig.endpointUrl,
            autoSync: apiConfig.autoSync,
            geminiModel: apiConfig.geminiModel
          } : null
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchor = document.createElement('a');
        const filename = `SmartGov_OJT_Complete_Backup_${traineeName}_${dateStr}_${timeStr}.json`;
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        showQuickNotification(`✅ สำรองข้อมูลทั้งหมดเรียบร้อยแล้ว (${filename})`, 'success');
      } catch (err) {
        console.error('Backup JSON error:', err);
        alert('เกิดข้อผิดพลาดในการสำรองข้อมูล: ' + err.message);
      }
    }

    // JSON Export (Staff / Admin Only)
    function exportDataJSON() {
      const session = getActiveSession();
      if (!session || session.role !== 'staff') {
        alert('🚫 สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin/Staff) เท่านั้นที่สามารถสำรองฐานข้อมูลได้');
        return;
      }
      const payload = {
        app: "Smart GovReport Hub 2.5",
        version: "2.5.0",
        exportedAt: new Date().toISOString(),
        profile: profileData,
        projectSummary: projectSummaryData,
        ojtWeeklyData: liveOjtData,
        apiConfig: {
          endpointUrl: apiConfig.endpointUrl,
          autoSync: apiConfig.autoSync,
          geminiModel: apiConfig.geminiModel
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `SmartGov_OJT_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    // JSON Import (Staff / Admin Only)
    function triggerImportJSON() {
      const session = getActiveSession();
      if (!session || session.role !== 'staff') {
        alert('🚫 สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin/Staff) เท่านั้นที่สามารถนำเข้าฐานข้อมูลได้');
        return;
      }
      document.getElementById('json-file-input').click();
    }

    function handleImportJSON(event) {
      const session = getActiveSession();
      if (!session || session.role !== 'staff') {
        alert('🚫 สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin/Staff) เท่านั้นที่สามารถนำเข้าฐานข้อมูลได้');
        return;
      }
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported.ojtWeeklyData) {
            liveOjtData = imported.ojtWeeklyData;
          }
          if (imported.profile) {
            profileData = Object.assign(profileData, imported.profile);
          }
          if (imported.projectSummary) {
            projectSummaryData = Object.assign(projectSummaryData, imported.projectSummary);
          }
          saveToLocalStorage();
          renderProfile();
          renderProjectSummary();
          changeOjtWeek();
          alert("นำเข้าข้อมูลจากไฟล์ JSON สำเร็จเรียบร้อยแล้ว!");
          if (document.getElementById('api-sync-modal').classList.contains('hidden') === false) {
            updateStorageUIIndicators(localStorage.getItem(STORAGE_KEYS.LAST_SAVED));
          }
        } catch (err) {
          alert("ไฟล์ JSON ไม่ถูกต้องหรือรูปแบบไม่สมบูรณ์: " + err.message);
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // reset input
    }

    // =========================================================================
    // 🏛️ MEMBERSHIP & REGISTRATION ENGINE (DUAL-LAYER HASH & TWO-TIER APPROVAL)
    // =========================================================================

    const MEMBER_STORAGE_KEYS = {
      SESSION: 'govhub_v2_session',
      LOCAL_USERS: 'govhub_v2_mock_users',
      REMEMBERED_USER: 'govhub_v2_remembered_username'
    };

    // Master Cohort Participants Data (37 Trainees from OJT Batch 1)
    const COHORT_PARTICIPANTS = [
      {
            "id": 1,
            "cardNo": "CARD-001",
            "courseType": "Advanced Course",
            "courseNo": "ADV-01",
            "name": "สุริยา ชูวิลัย",
            "nickname": "อาร์ม",
            "province": "สุราษฎร์ธานี",
            "interests": "พัฒนาทักษะดิจิทัลและการปฏิบัติงานสำนักงานอย่างมืออาชีพ เพื่อความมั่นคงในอาชีพ",
            "categories": [
                  "งานราชการ/ความมั่นคง",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 2,
            "cardNo": "CARD-002",
            "courseType": "Foundation Course",
            "courseNo": "FND-01",
            "name": "ยศกร บุญจันทร์",
            "nickname": "แม็ก / โนอาห์",
            "province": "กทม.",
            "interests": "คอสเพลย์, รถเมล์/รถไฟ, สเกิลขนส่งมวลชน",
            "categories": [
                  "ความบันเทิง/งานอดิเรก",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 3,
            "cardNo": "CARD-003",
            "courseType": "Advanced Course",
            "courseNo": "ADV-02",
            "name": "สุรสิทธิ์ ปานทอง",
            "nickname": "ตั๊ก",
            "province": "น่าน",
            "interests": "ทำอาหาร, เกม, หางานทำมั่นคง",
            "categories": [
                  "เกม/ไอที",
                  "งานราชการ/ความมั่นคง"
            ]
      },
      {
            "id": 4,
            "cardNo": "CARD-004",
            "courseType": "Advanced Course",
            "courseNo": "ADV-03",
            "name": "ธนภัทร จาดดี",
            "nickname": "แคท / ต๊าก",
            "province": "ไม่ระบุ",
            "interests": "คอมพิวเตอร์, ทำอาหาร, งานผู้ช่วยเภสัช",
            "categories": [
                  "คอมพิวเตอร์/AI",
                  "งานธุรการ/เอกสาร"
            ]
      },
      {
            "id": 5,
            "cardNo": "CARD-005",
            "courseType": "Advanced Course",
            "courseNo": "ADV-04",
            "name": "ชัยยุทธ ผอมมี",
            "nickname": "ต้อม",
            "province": "ขอนแก่น",
            "interests": "เกมคอมพิวเตอร์, งานราชการเพื่อครอบครัว",
            "categories": [
                  "เกม/ไอที",
                  "งานราชการ/ความมั่นคง"
            ]
      },
      {
            "id": 6,
            "cardNo": "CARD-006",
            "courseType": "Foundation Course",
            "courseNo": "FND-02",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "นิว",
            "province": "นครปฐม",
            "interests": "อ่านหนังสือ, รัฐศาสตร์, พัฒนาบุคลากร",
            "categories": [
                  "งานราชการ/ความมั่นคง",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 7,
            "cardNo": "CARD-007",
            "courseType": "Foundation Course",
            "courseNo": "FND-03",
            "name": "พัชรกาย์ หงษ์นพพัทธ์",
            "nickname": "นิว",
            "province": "กทม. (หนองจอก)",
            "interests": "นายหน้าติดต่อ, งานที่มั่นคง",
            "categories": [
                  "งานราชการ/ความมั่นคง",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 8,
            "cardNo": "CARD-008",
            "courseType": "Foundation Course",
            "courseNo": "FND-04",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "จ๋า",
            "province": "นนทบุรี",
            "interests": "ฟังเพลง, สกิลใหม่ๆ ไปประกอบอาชีพ",
            "categories": [
                  "ศิลปะ/ดนตรี/นิยาย",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 9,
            "cardNo": "CARD-009",
            "courseType": "Advanced Course",
            "courseNo": "ADV-05",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "จั๊ม",
            "province": "กทม.",
            "interests": "คอมพิวเตอร์, หางานทำ",
            "categories": [
                  "คอมพิวเตอร์/AI",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 10,
            "cardNo": "CARD-010",
            "courseType": "Foundation Course",
            "courseNo": "FND-05",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "น้ำเพชร",
            "province": "นนทบุรี",
            "interests": "ฟังเพลง, พอดแคสต์พัฒนาตนเอง, เรียนต่อ",
            "categories": [
                  "ศิลปะ/ดนตรี/นิยาย",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 11,
            "cardNo": "CARD-011",
            "courseType": "Foundation Course",
            "courseNo": "FND-06",
            "name": "ว่าที่ร้อยตรี ปึ้มจิต นิสสราพงศ์",
            "nickname": "ปึ้ม",
            "province": "กทม.",
            "interests": "วาดรูป, งานระยะยาวเลี้ยงชีพ",
            "categories": [
                  "ศิลปะ/ดนตรี/นิยาย",
                  "งานราชการ/ความมั่นคง"
            ]
      },
      {
            "id": 12,
            "cardNo": "CARD-012",
            "courseType": "Foundation Course",
            "courseNo": "FND-07",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "นัท",
            "province": "กทม.",
            "interests": "กีฬา, ความแข็งแรง, แนวคิดใหม่ๆ",
            "categories": [
                  "กีฬา/สุขภาพ",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 13,
            "cardNo": "CARD-013",
            "courseType": "Advanced Course",
            "courseNo": "ADV-06",
            "name": "ภรณี ปัญญาแจ่ม",
            "nickname": "พี่แอ๋น",
            "province": "นนทบุรี",
            "interests": "เจ้าแม่อีเวนต์กีฬา, เรียนรู้ระบบราชการ",
            "categories": [
                  "กีฬา/สุขภาพ",
                  "งานราชการ/ความมั่นคง"
            ]
      },
      {
            "id": 14,
            "cardNo": "CARD-014",
            "courseType": "Advanced Course",
            "courseNo": "ADV-07",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "เมย์",
            "province": "เชียงใหม่",
            "interests": "เทคโนโลยีใหม่ๆ, นำทักษะไปใช้ทำงาน",
            "categories": [
                  "คอมพิวเตอร์/AI",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 15,
            "cardNo": "CARD-015",
            "courseType": "Foundation Course",
            "courseNo": "FND-08",
            "name": "เสริฐพงษ์",
            "nickname": "เจ",
            "province": "กทม.",
            "interests": "เลี้ยงปลาสวยงาม, สกิลการทำงาน",
            "categories": [
                  "ความบันเทิง/งานอดิเรก",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 16,
            "cardNo": "CARD-016",
            "courseType": "Foundation Course",
            "courseNo": "FND-09",
            "name": "อัครโชติ ชูประดิษฐ์",
            "nickname": "เอ็ม",
            "province": "ไม่ระบุ",
            "interests": "ทำเพลง, เล่นดนตรี, ทำคลิปวิดีโอ",
            "categories": [
                  "ศิลปะ/ดนตรี/นิยาย",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 17,
            "cardNo": "CARD-017",
            "courseType": "Foundation Course",
            "courseNo": "FND-10",
            "name": "ยศสิริ คำชั่งข้าว",
            "nickname": "เกื้อ",
            "province": "ลำพูน",
            "interests": "พัฒนาตนเอง, งานราชการและเอกชน",
            "categories": [
                  "พัฒนาตนเอง",
                  "งานราชการ/ความมั่นคง"
            ]
      },
      {
            "id": 18,
            "cardNo": "CARD-018",
            "courseType": "Advanced Course",
            "courseNo": "ADV-08",
            "name": "ก้าน ชยานันท์ ยะติ๊บ",
            "nickname": "ก้าน",
            "province": "ฉะเชิงเทรา",
            "interests": "เล่นเกม, ขายของ, ความมั่นคงช่วยครอบครัว",
            "categories": [
                  "เกม/ไอที",
                  "งานราชการ/ความมั่นคง"
            ]
      },
      {
            "id": 19,
            "cardNo": "CARD-019",
            "courseType": "Advanced Course",
            "courseNo": "ADV-09",
            "name": "จิรวรรณ สินพรหมเทศ",
            "nickname": "พลอย",
            "province": "ไม่ระบุ",
            "interests": "เล่นเกม, นิยาย, ฟังเพลง, สกิลใหม่ๆ",
            "categories": [
                  "เกม/ไอที",
                  "ศิลปะ/ดนตรี/นิยาย"
            ]
      },
      {
            "id": 20,
            "cardNo": "CARD-020",
            "courseType": "Foundation Course",
            "courseNo": "FND-11",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "นิว",
            "province": "ไม่ระบุ",
            "interests": "อ่านหนังสือภาษาต่างประเทศ",
            "categories": [
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 21,
            "cardNo": "CARD-021",
            "courseType": "Foundation Course",
            "courseNo": "FND-12",
            "name": "ณัชพล สุขสงวน",
            "nickname": "พจน์",
            "province": "ไม่ระบุ",
            "interests": "การเมือง, ทำเพจ/อินฟลูเอนเซอร์",
            "categories": [
                  "พัฒนาตนเอง",
                  "ศิลปะ/ดนตรี/นิยาย"
            ]
      },
      {
            "id": 22,
            "cardNo": "CARD-022",
            "courseType": "Advanced Course",
            "courseNo": "ADV-10",
            "name": "กัญจิรา กิจเชง",
            "nickname": "เจน",
            "province": "กทม.",
            "interests": "นิยายออนไลน์, เกม, เทคโนโลยี AI",
            "categories": [
                  "คอมพิวเตอร์/AI",
                  "เกม/ไอที",
                  "ศิลปะ/ดนตรี/นิยาย"
            ]
      },
      {
            "id": 23,
            "cardNo": "CARD-023",
            "courseType": "Foundation Course",
            "courseNo": "FND-13",
            "name": "ภควัต เดชะอุดม",
            "nickname": "ไพ",
            "province": "กทม.",
            "interests": "งานเอกสาร, งานธุรการ, รายได้ดูแลตนเอง",
            "categories": [
                  "งานธุรการ/เอกสาร",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 24,
            "cardNo": "CARD-024",
            "courseType": "Foundation Course",
            "courseNo": "FND-14",
            "name": "อ้น ลาภเกียรติศิริ",
            "nickname": "อ้น",
            "province": "กทม. (พระราม 2)",
            "interests": "ท่องเที่ยว, ดูหนัง, ทักษะอาชีพใหม่",
            "categories": [
                  "ความบันเทิง/งานอดิเรก",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 25,
            "cardNo": "CARD-025",
            "courseType": "Advanced Course",
            "courseNo": "ADV-11",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "นุก",
            "province": "นครราชสีมา",
            "interests": "เขียนโปรแกรม, โค้ดดิ้ง, สร้าง AI",
            "categories": [
                  "คอมพิวเตอร์/AI"
            ]
      },
      {
            "id": 26,
            "cardNo": "CARD-026",
            "courseType": "Foundation Course",
            "courseNo": "FND-15",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "พลอย",
            "province": "กทม.",
            "interests": "วาดรูป, แต่งนิยายขาย, ออกแบบคาแรกเตอร์",
            "categories": [
                  "ศิลปะ/ดนตรี/นิยาย"
            ]
      },
      {
            "id": 27,
            "cardNo": "CARD-027",
            "courseType": "Advanced Course",
            "courseNo": "ADV-12",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "ปลื้ม",
            "province": "กทม.",
            "interests": "คอมพิวเตอร์, ฟังเพลง, พัฒนาทักษะ",
            "categories": [
                  "คอมพิวเตอร์/AI",
                  "ศิลปะ/ดนตรี/นิยาย"
            ]
      },
      {
            "id": 28,
            "cardNo": "CARD-028",
            "courseType": "Foundation Course",
            "courseNo": "FND-16",
            "name": "ภูวดล สุวรรณธาดา",
            "nickname": "ไอ้โต้ง",
            "province": "ไม่ระบุ",
            "interests": "ด้านพัฒนาสังคม, ทักษะงานภาครัฐ",
            "categories": [
                  "งานราชการ/ความมั่นคง",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 29,
            "cardNo": "CARD-029",
            "courseType": "Foundation Course",
            "courseNo": "FND-17",
            "name": "พัชรดนัย",
            "nickname": "แบม",
            "province": "ไม่ระบุ",
            "interests": "ดูหนัง, ฟังเพลง, รายได้ช่วยครอบครัว",
            "categories": [
                  "ความบันเทิง/งานอดิเรก",
                  "ศิลปะ/ดนตรี/นิยาย"
            ]
      },
      {
            "id": 30,
            "cardNo": "CARD-030",
            "courseType": "Advanced Course",
            "courseNo": "ADV-13",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "ไฮ้",
            "province": "ไม่ระบุ",
            "interests": "เล่นเกม, งานหารายได้ช่วยพ่อแม่",
            "categories": [
                  "เกม/ไอที",
                  "พัฒนาตนเอง"
            ]
      },
      {
            "id": 31,
            "cardNo": "CARD-031",
            "courseType": "Foundation Course",
            "courseNo": "FND-18",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "ซิง",
            "province": "กทม.",
            "interests": "ท่องเที่ยว, ดูบอล, ทำคลิปท่องเที่ยว",
            "categories": [
                  "ความบันเทิง/งานอดิเรก",
                  "กีฬา/สุขภาพ"
            ]
      },
      {
            "id": 32,
            "cardNo": "CARD-032",
            "courseType": "Advanced Course",
            "courseNo": "ADV-14",
            "name": "นงชุดา ศิริโชควัฒนานันท์",
            "nickname": "ไม่ระบุ",
            "province": "กทม.",
            "interests": "คอมพิวเตอร์, กีฬา, รับราชการ",
            "categories": [
                  "คอมพิวเตอร์/AI",
                  "งานราชการ/ความมั่นคง",
                  "กีฬา/สุขภาพ"
            ]
      },
      {
            "id": 33,
            "cardNo": "CARD-033",
            "courseType": "Advanced Course",
            "courseNo": "ADV-15",
            "name": "พิมลพรรณ บุญแก้ว",
            "nickname": "พิม",
            "province": "ไม่ระบุ",
            "interests": "คอมพิวเตอร์, เทคโนโลยีใหม่ๆ",
            "categories": [
                  "คอมพิวเตอร์/AI"
            ]
      },
      {
            "id": 34,
            "cardNo": "CARD-034",
            "courseType": "Advanced Course",
            "courseNo": "ADV-16",
            "name": "ศุภกร สุขหน้า",
            "nickname": "ติ๊ก",
            "province": "นครสวรรค์",
            "interests": "เทคโนโลยี AI, ความรู้อนาคต",
            "categories": [
                  "คอมพิวเตอร์/AI"
            ]
      },
      {
            "id": 35,
            "cardNo": "CARD-035",
            "courseType": "Foundation Course",
            "courseNo": "FND-19",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "เอ๋",
            "province": "ศรีสะเกษ",
            "interests": "จัดการเอกสาร, บรรจุข้อมูล, งานภาครัฐ",
            "categories": [
                  "งานธุรการ/เอกสาร",
                  "งานราชการ/ความมั่นคง"
            ]
      },
      {
            "id": 36,
            "cardNo": "CARD-036",
            "courseType": "Foundation Course",
            "courseNo": "FND-20",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "ม่อน",
            "province": "นนทบุรี",
            "interests": "ท่องเที่ยว, กีฬา, มุมมองงานราชการ",
            "categories": [
                  "ความบันเทิง/งานอดิเรก",
                  "กีฬา/สุขภาพ",
                  "งานราชการ/ความมั่นคง"
            ]
      },
      {
            "id": 37,
            "cardNo": "CARD-037",
            "courseType": "Foundation Course",
            "courseNo": "FND-21",
            "name": "ไม่ระบุชื่อ-นามสกุล",
            "nickname": "อ๋อม",
            "province": "กทม.",
            "interests": "อ่านหนังสือแนวลึกลับ, หางานทำ",
            "categories": [
                  "พัฒนาตนเอง",
                  "ความบันเทิง/งานอดิเรก"
            ]
      }
];

    // Transform into SmartGov Trainee Accounts (Pre-computed SHA-256 Hashes)
    const COHORT_SEED_USERS = COHORT_PARTICIPANTS.map((p) => {
      const padIndex = String(p.id).padStart(3, "0");
      const pad2 = String(p.id).padStart(2, "0");
      let displayName = p.name;
      if (displayName === "ไม่ระบุชื่อ-นามสกุล") {
        displayName = "ผู้เข้าอบรม (" + p.nickname + ")";
      } else if (p.nickname && p.nickname !== "ไม่ระบุ") {
        displayName = p.name + " (" + p.nickname + ")";
      }
      return {
        id: "usr-card-" + pad2,
        username: "card_" + padIndex,
        client_hash: "bd1230d06d9da6fa26d96ab22f71887f504cc876cecee2d9b97ec60f12e8acb2",
        full_name: displayName,
        nickname: (p.nickname && p.nickname !== "ไม่ระบุ") ? p.nickname : displayName,
        email: "card" + padIndex + "@moj.go.th",
        role: "trainee",
        department: "สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร",
        disability_type: "ทางการได้ยินหรือการเคลื่อนไหว (OJT)",
        supervisor_username: "-",
        card_no: p.cardNo,
        course_no: p.courseNo,
        course_type: p.courseType,
        province: p.province,
        interests: p.interests,
        categories: p.categories,
        is_approved: true,
        created_at: new Date().toISOString()
      };
    });

    // Default Seed Users for High-Fidelity Local / Offline Engine
    const DEFAULT_SEED_USERS = [
      {
        id: 'usr-admin-01',
        username: 'admin_ict',
        client_hash: 'a36aef5a11c4073fbe60314fc9df530a9d5f986533594d1f5190742ff9e0e408',
        full_name: 'เจ้าหน้าที่ผู้ดูแลระบบ (Admin ICT)',
        email: 'ict_admin@moj.go.th',
        role: 'staff',
        department: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สป.ยธ.',
        disability_type: '-',
        supervisor_username: '-',
        is_approved: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'usr-sup-01',
        username: 'sup_sarinya',
        client_hash: 'e890e1a545c52ab0a0e292935266cbde22483c00d2b425bade134134145ef3cd',
        full_name: 'นางสาวสรินยา สุวรรณวณิช',
        email: 'sarinya.s@moj.go.th',
        role: 'supervisor',
        department: 'กลุ่มงานสารสนเทศและพัฒนาระบบ ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
        disability_type: '-',
        supervisor_username: '-',
        is_approved: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'usr-trainee-01',
        username: 'trainee_jake',
        client_hash: 'bd1230d06d9da6fa26d96ab22f71887f504cc876cecee2d9b97ec60f12e8acb2',
        full_name: 'นายเจค (นิติพัฒน์ คุ้มวงษ์)',
        email: 'carinojake@gmail.com',
        role: 'trainee',
        department: 'สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
        disability_type: 'ทางการเคลื่อนไหวหรือทางร่างกาย',
        supervisor_username: 'sup_sarinya',
        is_approved: true,
        created_at: new Date().toISOString()
      },
      ...COHORT_SEED_USERS
    ];

    function getLocalUsers() {
      try {
        const stored = localStorage.getItem(MEMBER_STORAGE_KEYS.LOCAL_USERS);
        if (!stored) {
          localStorage.setItem(MEMBER_STORAGE_KEYS.LOCAL_USERS, JSON.stringify(DEFAULT_SEED_USERS));
          return [...DEFAULT_SEED_USERS];
        }
        const parsed = JSON.parse(stored);
        let hasNew = false;
        DEFAULT_SEED_USERS.forEach(seed => {
          if (!parsed.some(u => u.username && u.username.toLowerCase() === seed.username.toLowerCase())) {
            parsed.push(seed);
            hasNew = true;
          }
        });
        if (hasNew) {
          localStorage.setItem(MEMBER_STORAGE_KEYS.LOCAL_USERS, JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        return [...DEFAULT_SEED_USERS];
      }
    }


    // =========================================================================
    // COHORT ACCOUNTS PICKER MODAL (37 TRAINEES)
    // =========================================================================
    function openCohortAccountsModal() {
      const modal = document.getElementById('cohort-accounts-modal');
      if (!modal) return;
      const searchInput = document.getElementById('cohort-search-input');
      const courseFilter = document.getElementById('cohort-course-filter');
      if (searchInput) searchInput.value = '';
      if (courseFilter) courseFilter.value = 'ALL';
      renderCohortAccountsList();
      modal.classList.remove('hidden');
    }

    function closeCohortAccountsModal() {
      const modal = document.getElementById('cohort-accounts-modal');
      if (modal) modal.classList.add('hidden');
    }

    function renderCohortAccountsList(filterQuery = '', courseFilter = 'ALL') {
      const container = document.getElementById('cohort-accounts-list');
      const countEl = document.getElementById('cohort-visible-count');
      if (!container) return;

      const q = filterQuery.toLowerCase().trim();
      const filtered = COHORT_SEED_USERS.filter(u => {
        const matchCourse = courseFilter === 'ALL' || u.course_type === courseFilter;
        const matchQuery = !q || 
          u.username.toLowerCase().includes(q) ||
          u.full_name.toLowerCase().includes(q) ||
          u.nickname.toLowerCase().includes(q) ||
          (u.card_no && u.card_no.toLowerCase().includes(q)) ||
          (u.course_no && u.course_no.toLowerCase().includes(q)) ||
          (u.province && u.province.toLowerCase().includes(q)) ||
          (u.interests && u.interests.toLowerCase().includes(q));
        return matchCourse && matchQuery;
      });

      if (countEl) countEl.innerText = `แสดง ${filtered.length} จาก ${COHORT_SEED_USERS.length} บัญชี`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="py-8 text-center text-slate-400">
            <i class="fa-solid fa-user-slash text-2xl mb-1 text-slate-300"></i>
            <p class="text-xs">ไม่พบบัญชีผู้เข้าอบรมที่ตรงกับคำค้นหา</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(u => {
        const isAdv = u.course_type === 'Advanced Course';
        const badgeBg = isAdv ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200';
        const icon = isAdv ? 'fa-rocket text-purple-600' : 'fa-book text-blue-600';
        
        return `
          <div class="p-3 bg-white hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 transition flex items-center justify-between gap-3 shadow-2xs">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-9 h-9 rounded-xl ${isAdv ? 'bg-purple-600' : 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                ${u.card_no ? u.card_no.replace('CARD-', '') : '00'}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-slate-800 text-xs truncate">${sanitizeHTML(u.full_name)}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badgeBg} flex items-center gap-1">
                    <i class="fa-solid ${icon}"></i> ${u.course_no} (${isAdv ? 'Advanced' : 'Foundation'})
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono">@${u.username}</span>
                </div>
                <p class="text-[11px] text-slate-500 truncate mt-0.5">
                  <i class="fa-solid fa-location-dot text-rose-500 mr-0.5"></i> ${u.province || 'ไม่ระบุจังหวัด'} 
                  ${u.interests ? `• <span class="text-slate-600">${sanitizeHTML(u.interests)}</span>` : ''}
                </p>
              </div>
            </div>
            <button type="button" onclick="selectCohortAccount('${u.username}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1 shadow-xs">
              <i class="fa-solid fa-arrow-right-to-bracket"></i>
              <span>เลือก</span>
            </button>
          </div>
        `;
      }).join('');
    }

    function filterCohortAccountsList() {
      const q = document.getElementById('cohort-search-input')?.value || '';
      const course = document.getElementById('cohort-course-filter')?.value || 'ALL';
      renderCohortAccountsList(q, course);
    }

    function selectCohortAccount(username) {
      const userInput = document.getElementById('login-username');
      const passInput = document.getElementById('login-password');
      if (userInput) userInput.value = username;
      if (passInput) passInput.value = 'Trainee@2026';
      closeCohortAccountsModal();
      
      const form = document.getElementById('login-form');
      if (form) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    }
    window.selectCohortAccount = selectCohortAccount;

    function quickDemoLogin(role) {
      const userInput = document.getElementById('login-username');
      const passInput = document.getElementById('login-password');
      if (!userInput || !passInput) return;

      if (role === 'admin') {
        userInput.value = 'admin_ict';
        passInput.value = 'Admin@2026';
      } else if (role === 'supervisor') {
        userInput.value = 'sup_sarinya';
        passInput.value = 'Sup@2026';
      } else if (role === 'trainee') {
        userInput.value = 'trainee_jake';
        passInput.value = 'Trainee@2026';
      }

      const form = document.getElementById('login-form');
      if (form) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    }
    window.quickDemoLogin = quickDemoLogin;

    function initDemoSandboxMode() {
      const box = document.getElementById('demo-credentials-box');
      if (!box) return;
      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' || host === '0.0.0.0';
      const hasDemoParam = new URLSearchParams(window.location.search).get('demo') === '1';

      if (isLocal || hasDemoParam) {
        box.classList.remove('hidden');
      } else {
        box.classList.add('hidden');
      }
    }
    window.initDemoSandboxMode = initDemoSandboxMode;


    function saveLocalUsers(users) {
      try {
        localStorage.setItem(MEMBER_STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
      } catch (e) {
        console.error('Error saving local users:', e);
      }
    }

    // SHA-256 Web Crypto Client Hashing
    async function computeClientSha256(text) {
      if (!text) return '';
      const encoder = new TextEncoder();
      const data = encoder.encode(String(text).trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function getActiveSession() {
      try {
        const s = sessionStorage.getItem(MEMBER_STORAGE_KEYS.SESSION);
        return s ? JSON.parse(s) : null;
      } catch (e) {
        return null;
      }
    }

    function checkAuthGuard() {
      const session = getActiveSession();
      const portal = document.getElementById('auth-portal');
      const app = document.getElementById('authenticated-app');
      
      if (!session || !session.is_approved) {
        // Not authenticated
        const m1 = document.getElementById('member-management-modal');
        if (m1) m1.classList.add('hidden');
        const m2 = document.getElementById('security-modal');
        if (m2) m2.classList.add('hidden');
        const m3 = document.getElementById('trainee-onboarding-modal');
        if (m3) m3.classList.add('hidden');
        const m4 = document.getElementById('cohort-accounts-modal');
        if (m4) m4.classList.add('hidden');
        if (portal) portal.classList.remove('hidden');
        if (app) app.classList.add('hidden');
        
        // Auto-fill remembered username
        const remembered = localStorage.getItem(MEMBER_STORAGE_KEYS.REMEMBERED_USER);
        const loginUserInput = document.getElementById('login-username');
        if (remembered && loginUserInput) {
          loginUserInput.value = remembered;
          const remCheckbox = document.getElementById('remember-me-checkbox');
          if (remCheckbox) remCheckbox.checked = true;
        }
        return false;
      }

      // Authenticated!
      if (portal) portal.classList.add('hidden');
      if (app) app.classList.remove('hidden');

      // Update UI for logged-in user
      applyUserSessionToUI(session);
      return true;
    }

    function applyUserSessionToUI(session) {
      // 1. Header Badges
      const userDisplayContainer = document.getElementById('user-display-container');
      const userNameElem = document.getElementById('user-display-name');
      const userRoleElem = document.getElementById('user-display-role');
      const memberMgmtBtn = document.getElementById('btn-member-mgmt');
      const securityRoleBtn = document.getElementById('security-role-btn');

      if (userDisplayContainer) userDisplayContainer.classList.remove('hidden');
      if (userNameElem) userNameElem.innerText = session.full_name || session.username;
      
      const roleThaiMap = {
        trainee: 'ผู้ฝึกงาน',
        supervisor: 'ผู้ควบคุมงาน',
        advisor: 'อาจารย์นิเทศก์',
        staff: 'Admin / เจ้าหน้าที่'
      };
      if (userRoleElem) userRoleElem.innerText = roleThaiMap[session.role] || session.role;

      // 2. Member Management Button (Supervisor & Staff)
      if (session.role === 'supervisor' || session.role === 'staff') {
        if (memberMgmtBtn) memberMgmtBtn.classList.remove('hidden');
        updatePendingCountBadge();
      } else {
        if (memberMgmtBtn) memberMgmtBtn.classList.add('hidden');
      }

      // 3. Security Role Button (Strictly hidden for Trainee)
      if (securityRoleBtn) {
        if (session.role === 'trainee') {
          securityRoleBtn.classList.add('hidden');
        } else {
          securityRoleBtn.classList.remove('hidden');
        }
      }

      // 3.1 Database & API Cloud Hub Widget (Strictly Staff / Admin Only)
      const sidebarDbHub = document.getElementById('sidebar-db-hub');
      if (sidebarDbHub) {
        if (session.role === 'staff') {
          sidebarDbHub.classList.remove('hidden');
        } else {
          sidebarDbHub.classList.add('hidden');
        }
      }

      // 3.2 Executive Dashboard Quick Switch & Sidebar Tab (Supervisor, Advisor, Staff Only - Strictly Hidden for Trainee)
      const headerExecBtn = document.getElementById('header-executive-btn');
      const sidebarExecTab = document.getElementById('btn-tab-executive-overview');
      const canAccessExecutive = (session.role === 'supervisor' || session.role === 'staff' || session.role === 'advisor');

      if (headerExecBtn) {
        if (canAccessExecutive) {
          headerExecBtn.classList.remove('hidden');
        } else {
          headerExecBtn.classList.add('hidden');
        }
      }

      if (sidebarExecTab) {
        if (canAccessExecutive) {
          sidebarExecTab.classList.remove('hidden');
        } else {
          sidebarExecTab.classList.add('hidden');
        }
      }

      // Dynamic RBAC Loading
      if (window.RBACManager) {
        RBACManager.loadPermissions(session.role);
      }

      // If a trainee is somehow viewing the Executive Dashboard tab, redirect to ojt-log
      if (!canAccessExecutive) {
        const execView = document.getElementById('view-executive-overview');
        if (execView && !execView.classList.contains('hidden')) {
          switchTab('ojt-log');
        }
      }

      // 4. Update Sidebar Profile
      const sidebarName = document.getElementById('sidebar-user-fullname');
      const sidebarRole = document.getElementById('sidebar-user-role');
      const sidebarDept = document.getElementById('sidebar-user-dept');
      const sidebarAvatar = document.getElementById('sidebar-user-avatar');
      const sidebarAvatarIcon = document.getElementById('sidebar-user-avatar-icon');

      if (sidebarName) {
        sidebarName.innerText = session.full_name || session.username;
        sidebarName.title = session.full_name || session.username;
      }
      if (sidebarRole) {
        sidebarRole.innerText = `${roleThaiMap[session.role] || session.role}`;
        sidebarRole.title = `${roleThaiMap[session.role] || session.role} (@${session.username})`;
      }
      if (sidebarDept) {
        sidebarDept.innerText = session.department || 'สำนักงานปลัดกระทรวงยุติธรรม';
        sidebarDept.title = session.department || 'สำนักงานปลัดกระทรวงยุติธรรม';
      }

      if (sidebarAvatar && sidebarAvatarIcon) {
        if (session.role === 'supervisor') {
          sidebarAvatar.className = 'w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow flex-shrink-0';
          sidebarAvatarIcon.className = 'fa-solid fa-user-tie text-amber-200';
        } else if (session.role === 'staff') {
          sidebarAvatar.className = 'w-12 h-12 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-lg shadow flex-shrink-0';
          sidebarAvatarIcon.className = 'fa-solid fa-user-shield text-purple-200';
        } else if (session.role === 'advisor') {
          sidebarAvatar.className = 'w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow flex-shrink-0';
          sidebarAvatarIcon.className = 'fa-solid fa-chalkboard-user text-indigo-200';
        } else {
          sidebarAvatar.className = 'w-12 h-12 rounded-full bg-govNavy text-white flex items-center justify-center font-bold text-lg shadow flex-shrink-0';
          sidebarAvatarIcon.className = 'fa-solid fa-user-graduate text-blue-300';
        }
      }

      // 5. Establish Active Trainee Scope
      if (session.role === 'trainee') {
        currentViewTrainee = session.username;
      } else if (!currentViewTrainee) {
        currentViewTrainee = 'trainee_jake';
      }

      // 6. Reload Data for Current User Scope
      loadSecurityState();
      loadFromLocalStorage();
      renderProfile();
      renderProjectSummary();
      renderOfficialMemo();
      renderPortfolio();
      changeOjtWeek();
      renderChart();

      // 7. Update UI Elements for Roles
      updateSupervisorActiveTraineeUI();
      renderRoleDashboard(session.role);

      // 8. Sync with Security Controller
      if (window.securityState) {
        window.securityState.activeRole = (session.role === 'supervisor' || session.role === 'staff') ? 'supervisor' : 'trainee';
        updateSecurityUI();
      }

      // 9. Trainee Onboarding Wizard Trigger (First Login Setup)
      if (session.role === 'trainee' && !isOnboardingCompleted(session.username)) {
        setTimeout(() => {
          openOnboardingModal();
        }, 500);
      } else {
        const obModal = document.getElementById('trainee-onboarding-modal');
        if (obModal) obModal.classList.add('hidden');
      }
    }

    // Toggle Password Visibility
    function togglePasswordVisibility(inputId, eyeId) {
      const input = document.getElementById(inputId);
      const eye = document.getElementById(eyeId);
      if (!input || !eye) return;
      if (input.type === 'password') {
        input.type = 'text';
        eye.className = 'fa-solid fa-eye-slash text-xs text-govNavy';
      } else {
        input.type = 'password';
        eye.className = 'fa-solid fa-eye text-xs text-slate-400';
      }
    }

    // Password Strength & Match Analyzer
    function checkPasswordStrength() {
      const pwd = document.getElementById('reg-password').value;
      const bar = document.getElementById('pwd-strength-bar');
      const text = document.getElementById('pwd-strength-text');
      if (!bar || !text) return;

      let score = 0;
      if (pwd.length >= 6) score += 25;
      if (pwd.length >= 8) score += 15;
      if (/[A-Z]/.test(pwd)) score += 20;
      if (/[a-z]/.test(pwd)) score += 15;
      if (/[0-9]/.test(pwd)) score += 15;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 10;

      if (score === 0) {
        bar.style.width = '0%';
        bar.className = 'bg-slate-300 h-full transition-all duration-300';
        text.innerText = 'ระบุรหัสผ่าน';
        text.className = 'font-bold text-slate-400';
      } else if (score < 40) {
        bar.style.width = '30%';
        bar.className = 'bg-red-500 h-full transition-all duration-300';
        text.innerText = 'เปราะบาง (ไม่แนะนำ)';
        text.className = 'font-bold text-red-500';
      } else if (score < 70) {
        bar.style.width = '65%';
        bar.className = 'bg-amber-500 h-full transition-all duration-300';
        text.innerText = 'ปานกลาง (ผ่านเกณฑ์ NIST)';
        text.className = 'font-bold text-amber-600';
      } else {
        bar.style.width = '100%';
        bar.className = 'bg-emerald-500 h-full transition-all duration-300';
        text.innerText = 'รัดกุมสูง (ดีเยี่ยม)';
        text.className = 'font-bold text-emerald-600';
      }
      checkPasswordMatch();
    }

    function checkPasswordMatch() {
      const pwd = document.getElementById('reg-password').value;
      const cpwd = document.getElementById('reg-confirm-password').value;
      const matchText = document.getElementById('pwd-match-text');
      if (!matchText) return;

      if (!cpwd) {
        matchText.innerText = '';
        return;
      }
      if (pwd === cpwd) {
        matchText.innerText = '✓ รหัสผ่านตรงกันสมบูรณ์';
        matchText.className = 'text-[10px] text-emerald-600 font-semibold';
      } else {
        matchText.innerText = '✗ รหัสผ่านยังไม่ตรงกัน';
        matchText.className = 'text-[10px] text-red-500 font-semibold';
      }
    }

    // Role switcher inside Register Modal
    function onRoleChange() {
      const selected = document.querySelector('input[name="reg-role"]:checked')?.value || 'trainee';
      const traineeGroup = document.getElementById('field-trainee-group');
      const genGroup = document.getElementById('field-general-group');

      if (selected === 'trainee') {
        if (traineeGroup) traineeGroup.classList.remove('hidden');
        if (genGroup) genGroup.classList.add('hidden');
      } else {
        if (traineeGroup) traineeGroup.classList.add('hidden');
        if (genGroup) genGroup.classList.remove('hidden');
      }
    }

    function openRegisterModal() {
      refreshSupervisorDropdown();
      document.getElementById('register-modal').classList.remove('hidden');
    }

    function closeRegisterModal() {
      document.getElementById('register-modal').classList.add('hidden');
    }

    function refreshSupervisorDropdown() {
      const select = document.getElementById('reg-supervisor-select');
      if (!select) return;

      // Fetch from local or GAS API
      const localUsers = getLocalUsers();
      const approvedSups = localUsers.filter(u => u.role === 'supervisor' && u.is_approved);

      select.innerHTML = '';
      if (approvedSups.length === 0) {
        const opt = document.createElement('option');
        opt.value = 'sup_sarinya';
        opt.text = 'นางสาวสรินยา สุวรรณวณิช (ผอ.กลุ่มงานสารสนเทศ ศทส.)';
        select.appendChild(opt);
      } else {
        approvedSups.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.username;
          opt.text = `${s.full_name} (${s.department || 'ผู้ควบคุมงาน'})`;
          select.appendChild(opt);
        });
      }
    }

    // Handle Login Submission
    async function handleLoginSubmit(e) {
      e.preventDefault();
      const usernameInput = document.getElementById('login-username').value.trim();
      const passwordInput = document.getElementById('login-password').value;
      const rememberMe = document.getElementById('remember-me-checkbox')?.checked;
      const btn = document.getElementById('btn-login-submit');
      const btnText = document.getElementById('btn-login-text');

      if (!usernameInput || !passwordInput) {
        alert('⚠️ กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน');
        return;
      }

      if (btn) btn.disabled = true;
      if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> กำลังตรวจสอบ...';

      try {
        const clientHash = await computeClientSha256(passwordInput);

        // 1. Try Google Apps Script if URL is configured
        let gasSuccess = false;
        const gasUrl = (window.apiConfig && window.apiConfig.endpointUrl && !window.apiConfig.endpointUrl.includes('AKfycbybyzm')) 
          ? window.apiConfig.endpointUrl : null;

        if (gasUrl && window.navigator.onLine) {
          try {
            const resp = await fetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'login',
                username: usernameInput,
                client_hash: clientHash
              })
            });
            const data = await resp.json();
            if (data.success && data.user) {
              sessionStorage.setItem(MEMBER_STORAGE_KEYS.SESSION, JSON.stringify(data.user));
              gasSuccess = true;
            } else if (data.error) {
              alert(`❌ ${data.error}`);
              if (btn) btn.disabled = false;
              if (btnText) btnText.innerText = 'เข้าสู่ระบบ';
              return;
            }
          } catch (netErr) {
            console.warn('GAS login failed, falling back to local database:', netErr);
          }
        }

        // 2. Fallback to Local Engine if GAS not configured or offline
        if (!gasSuccess) {
          const localUsers = getLocalUsers();
          const cleanUser = usernameInput.toLowerCase();
          const matched = localUsers.find(u => 
            u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
          );

          if (!matched) {
            alert('❌ ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = 'เข้าสู่ระบบ';
            return;
          }

          if (matched.client_hash !== clientHash) {
            alert('❌ ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = 'เข้าสู่ระบบ';
            return;
          }

          if (matched.is_approved !== true) {
            alert('⏳ บัญชีของคุณอยู่ระหว่างรอการอนุมัติสิทธิ์จากผู้ควบคุมงาน หรือ Admin');
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = 'เข้าสู่ระบบ';
            return;
          }

          if (matched.is_suspended === true || matched.status === 'suspended') {
            alert('🚫 บัญชีผู้ใช้งานนี้ถูกระงับสิทธิ์การใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ (Admin)');
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = 'เข้าสู่ระบบ';
            return;
          }

          sessionStorage.setItem(MEMBER_STORAGE_KEYS.SESSION, JSON.stringify(matched));
        }

        // Remember Me
        if (rememberMe) {
          localStorage.setItem(MEMBER_STORAGE_KEYS.REMEMBERED_USER, usernameInput);
        } else {
          localStorage.removeItem(MEMBER_STORAGE_KEYS.REMEMBERED_USER);
        }

        // Switch to App
        checkAuthGuard();

      } catch (err) {
        alert('❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + err.message);
      } finally {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = 'เข้าสู่ระบบ';
      }
    }

    // Handle Registration Submission
    async function handleRegisterSubmit(e) {
      e.preventDefault();
      const role = document.querySelector('input[name="reg-role"]:checked')?.value || 'trainee';
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const fullName = document.getElementById('reg-fullname').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      const supervisor = document.getElementById('reg-supervisor-select')?.value || '-';
      const disability = document.getElementById('reg-disability-select')?.value || '-';
      const institution = document.getElementById('reg-institution')?.value.trim() || '';
      const departmentInput = document.getElementById('reg-department')?.value.trim() || '';
      const pdpaConsent = document.getElementById('reg-pdpa-consent')?.checked;

      if (!pdpaConsent) {
        alert('⚠️ กรุณากดยอมรับเงื่อนไขความคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อนดำเนินการสมัคร');
        return;
      }

      if (password.length < 6) {
        alert('⚠️ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรขึ้นไปตามมาตรฐาน NIST');
        return;
      }

      if (password !== confirmPassword) {
        alert('⚠️ รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
        return;
      }

      const btn = document.getElementById('btn-register-submit');
      const btnText = document.getElementById('btn-reg-text');
      if (btn) btn.disabled = true;
      if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> กำลังลงทะเบียน...';

      try {
        const clientHash = await computeClientSha256(password);
        const departmentFinal = (role === 'trainee') 
          ? (institution || 'โครงการเตรียมความพร้อมคนพิการภาครัฐ') 
          : (departmentInput || 'สำนักงานปลัดกระทรวงยุติธรรม');

        const newUserPayload = {
          action: 'register',
          id: 'usr-' + Date.now(),
          username: username.toLowerCase(),
          client_hash: clientHash,
          full_name: fullName,
          email: email.toLowerCase(),
          role: role,
          department: departmentFinal,
          disability_type: (role === 'trainee') ? disability : '-',
          supervisor_username: (role === 'trainee') ? supervisor : '-',
          is_approved: false, // Default: Pending approval!
          created_at: new Date().toISOString()
        };

        // 1. Send to Google Apps Script if URL configured
        let gasDone = false;
        const gasUrl = (window.apiConfig && window.apiConfig.endpointUrl && !window.apiConfig.endpointUrl.includes('AKfycbybyzm')) 
          ? window.apiConfig.endpointUrl : null;

        if (gasUrl && window.navigator.onLine) {
          try {
            const resp = await fetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(newUserPayload)
            });
            const data = await resp.json();
            if (data.success) {
              gasDone = true;
            } else if (data.error) {
              alert(`❌ ไม่สามารถลงทะเบียนได้: ${data.error}`);
              if (btn) btn.disabled = false;
              if (btnText) btnText.innerText = 'ยืนยันการสมัครสมาชิก';
              return;
            }
          } catch (netErr) {
            console.warn('GAS register failed, saving locally:', netErr);
          }
        }

        // 2. Save into Local Database
        const localUsers = getLocalUsers();
        if (localUsers.some(u => u.username.toLowerCase() === newUserPayload.username)) {
          alert('⚠️ ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น');
          if (btn) btn.disabled = false;
          if (btnText) btnText.innerText = 'ยืนยันการสมัครสมาชิก';
          return;
        }

        localUsers.push(newUserPayload);
        saveLocalUsers(localUsers);

        closeRegisterModal();
        alert(`🎉 ลงทะเบียนสำเร็จ!\n\nบัญชี [${username}] อยู่ในสถานะรอการอนุมัติสิทธิ์ (is_approved = FALSE)\n- หากเป็นผู้ฝึกงาน: ให้ผู้ควบคุมงาน [${supervisor}] กดยืนยันในระบบ\n- หากเป็นผู้ควบคุมงาน/อาจารย์: ให้ Admin กดยืนยันก่อนจึงจะเข้าสู่ระบบได้`);

        // Pre-fill username into login form
        const loginUser = document.getElementById('login-username');
        if (loginUser) loginUser.value = username;

      } catch (err) {
        alert('❌ เกิดข้อผิดพลาดในการลงทะเบียน: ' + err.message);
      } finally {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = 'ยืนยันการสมัครสมาชิก';
      }
    }

    // Handle Logout
    function handleLogout() {
      if (confirm('ยืนยันการออกจากระบบ Smart GovReport Hub 2.5?')) {
        const m1 = document.getElementById('member-management-modal');
        if (m1) m1.classList.add('hidden');
        const m2 = document.getElementById('security-modal');
        if (m2) m2.classList.add('hidden');
        sessionStorage.removeItem(MEMBER_STORAGE_KEYS.SESSION);
        currentViewTrainee = 'trainee_jake';
        liveOjtData = JSON.parse(JSON.stringify(initialOjtWeeklyData));
        profileData = JSON.parse(JSON.stringify(defaultProfileData));
        checkAuthGuard();
      }
    }

    function openForgotPwdAlert() {
      alert('ℹ️ หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ (Admin) หรือผู้ควบคุมงานของคุณ เพื่อทำการตรวจสอบและรีเซ็ตรหัสผ่านในฐานข้อมูล Google Sheets');
    }

    // =========================================================================
    // 🛡️ MEMBER MANAGEMENT & TWO-TIER APPROVAL MODAL CONTROLLER
    // =========================================================================
    
    // =========================================================================
    // 🏛️ ADMIN TABS & SUPERVISOR ASSIGNMENT CONTROLLER
    // =========================================================================
    let currentMgmtTab = 'pending';
    let selectedPendingUsernames = new Set();

    function switchMgmtTab(tab) {
      currentMgmtTab = tab;
      const btnPending = document.getElementById('tab-btn-mgmt-pending');
      const btnAll = document.getElementById('tab-btn-mgmt-all');
      const panelPending = document.getElementById('mgmt-panel-pending');
      const panelAll = document.getElementById('mgmt-panel-all');
      const desc = document.getElementById('mgmt-tab-desc');
      const batchContainer = document.getElementById('batch-actions-container');
      const session = getActiveSession();

      if (tab === 'pending') {
        if (btnPending) { btnPending.className = 'px-3.5 py-1.5 rounded-xl font-bold bg-govNavy text-white shadow-xs transition flex items-center space-x-1.5'; }
        if (btnAll) { btnAll.className = 'px-3.5 py-1.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition flex items-center space-x-1.5'; }
        if (panelPending) panelPending.classList.remove('hidden');
        if (panelAll) panelAll.classList.add('hidden');
        if (desc) desc.innerText = 'รายการคำขอสมัครสมาชิกใหม่ที่รอการอนุมัติ';
        refreshPendingMemberList();
      } else {
        if (btnPending) { btnPending.className = 'px-3.5 py-1.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition flex items-center space-x-1.5'; }
        if (btnAll) { btnAll.className = 'px-3.5 py-1.5 rounded-xl font-bold bg-govNavy text-white shadow-xs transition flex items-center space-x-1.5'; }
        if (panelPending) panelPending.classList.add('hidden');
        if (panelAll) panelAll.classList.remove('hidden');
        if (batchContainer) batchContainer.classList.add('hidden');
        if (desc) {
          desc.innerText = (session && session.role === 'supervisor')
            ? 'รายชื่อสมาชิกและเด็กฝึกงานที่อยู่ภายใต้การดูแลของคุณ'
            : 'รายชื่อสมาชิกที่เปิดใช้งานแล้ว และการมอบหมาย/เปลี่ยนตัวพี่เลี้ยงผู้ดูแล';
        }
        renderAllMembersList();
      }
    }

    function refreshCurrentMgmtTab() {
      if (currentMgmtTab === 'pending') {
        refreshPendingMemberList();
      } else {
        renderAllMembersList();
      }
    }

    // =========================================================================
    // 🔍 SEARCH & FILTER CONTROLLER
    // =========================================================================
    function filterMembersTable() {
      const searchVal = (document.getElementById('mgmt-search-input')?.value || '').trim().toLowerCase();
      const roleVal = document.getElementById('mgmt-role-filter')?.value || 'all';

      const tbodyId = (currentMgmtTab === 'pending') ? 'pending-members-tbody' : 'all-members-tbody';
      const tbody = document.getElementById(tbodyId);
      if (!tbody) return;

      const rows = tbody.querySelectorAll('tr[data-user]');
      rows.forEach(tr => {
        const text = (tr.getAttribute('data-search') || '').toLowerCase();
        const role = tr.getAttribute('data-role') || '';
        
        const matchSearch = !searchVal || text.includes(searchVal);
        const matchRole = (roleVal === 'all') || (role === roleVal);

        if (matchSearch && matchRole) {
          tr.style.display = '';
        } else {
          tr.style.display = 'none';
        }
      });
    }

    // =========================================================================
    // 👥 TAB 2: ALL ACTIVE MEMBERS (ADMIN & SUPERVISOR VIEW)
    // =========================================================================
    function renderAllMembersList() {
      const session = getActiveSession();
      const tbody = document.getElementById('all-members-tbody');
      if (!tbody || !session) return;

      const localUsers = getLocalUsers();
      let activeUsers = localUsers.filter(u => u.is_approved === true);
      const supervisors = localUsers.filter(u => u.role === 'supervisor' && u.is_approved === true);

      // สำหรับผู้ควบคุมงาน (Supervisor) ให้เห็นเฉพาะตนเอง และเด็กฝึกงานที่ได้รับมอบหมายจริงเท่านั้น
      if (session.role === 'supervisor') {
        const myUsername = String(session.username || '').toLowerCase();
        activeUsers = activeUsers.filter(u => 
          u.username.toLowerCase() === myUsername ||
          (u.role === 'trainee' && String(u.supervisor_username || '').toLowerCase() === myUsername)
        );
      }

      tbody.innerHTML = '';
      if (activeUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400">ไม่พบสมาชิกในสังกัดของคุณ</td></tr>';
        return;
      }

      const roleBadgeMap = {
        trainee: '<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">ผู้ฝึกงาน</span>',
        supervisor: '<span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">ผู้ควบคุมงาน</span>',
        advisor: '<span class="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">อาจารย์นิเทศก์</span>',
        staff: '<span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">Admin</span>'
      };

      activeUsers.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.setAttribute('data-user', u.username);
        tr.setAttribute('data-role', u.role);
        tr.setAttribute('data-search', `${u.full_name} ${u.username} ${u.email} ${u.department || ''}`.toLowerCase());

        let supervisorCell = '';
        if (u.role === 'trainee') {
          // If admin, can assign/change supervisor
          if (session.role === 'staff') {
            let optionsHtml = '<option value="-">-- ยังไม่ได้มอบหมาย --</option>';
            supervisors.forEach(s => {
              const selected = (String(u.supervisor_username).toLowerCase() === String(s.username).toLowerCase()) ? 'selected' : '';
              optionsHtml += `<option value="${s.username}" ${selected}>${s.full_name} (@${s.username})</option>`;
            });
            supervisorCell = `
              <div class="flex items-center space-x-1.5">
                <select id="assign-sup-${u.username}" class="p-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 max-w-[190px]">
                  ${optionsHtml}
                </select>
                <button onclick="saveSupervisorAssignment('${u.username}')" class="px-2.5 py-1.5 bg-govNavy hover:bg-govNavyLight text-white rounded-lg font-semibold text-[11px] shadow-xs transition" title="บันทึกการมอบหมายพี่เลี้ยง">
                  <i class="fa-solid fa-floppy-disk"></i>
                </button>
              </div>
            `;
          } else {
            const supName = supervisors.find(s => s.username === u.supervisor_username)?.full_name || u.supervisor_username || '-';
            supervisorCell = `<span class="font-medium text-slate-700">${supName}</span>`;
          }
        } else {
          supervisorCell = `<span class="text-slate-400">-</span>`;
        }

        const isSuspended = (u.is_suspended === true || u.status === 'suspended');
        const statusBadge = isSuspended 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200"><i class="fa-solid fa-ban mr-1"></i>ระงับสิทธิ์</span>'
          : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-circle-check mr-1"></i>ใช้งานปกติ</span>';

        let actionButtons = '';
        if (session.role === 'staff') {
          const isSelf = (u.username.toLowerCase() === session.username.toLowerCase());
          const toggleIcon = isSuspended ? 'fa-lock-open text-emerald-600' : 'fa-ban text-amber-600';
          const toggleTitle = isSuspended ? 'ปลดล็อกสิทธิ์ใช้งาน' : 'ระงับสิทธิ์ชั่วคราว';

          actionButtons = `
            <div class="flex items-center justify-center space-x-1">
              <button onclick="openEditMemberModal('${sanitizeHTML(u.username)}')" class="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition" title="แก้ไขข้อมูลโปรไฟล์">
                <i class="fa-solid fa-user-pen text-xs"></i>
              </button>
              ${!isSelf ? `
                <button onclick="toggleUserStatus('${sanitizeHTML(u.username)}')" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition" title="${toggleTitle}">
                  <i class="fa-solid ${toggleIcon} text-xs"></i>
                </button>
                <button onclick="resetUserPassword('${sanitizeHTML(u.username)}')" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition" title="รีเซ็ตรหัสผ่าน">
                  <i class="fa-solid fa-key text-xs text-amber-600"></i>
                </button>
                <button onclick="deleteUserAccount('${sanitizeHTML(u.username)}')" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition" title="ลบบัญชีถาวร">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              ` : `
                <button onclick="resetUserPassword('${sanitizeHTML(u.username)}')" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition" title="รีเซ็ตรหัสผ่าน">
                  <i class="fa-solid fa-key text-xs text-amber-600"></i>
                </button>
              `}
            </div>
          `;
        } else {
          actionButtons = '<span class="text-slate-300 text-xs">-</span>';
        }

        tr.innerHTML = `
          <td class="p-3">
            <p class="font-bold text-slate-800 text-xs">${sanitizeHTML(u.full_name)}</p>
            <p class="text-[10px] text-slate-400 font-mono">@${sanitizeHTML(u.username)} | ${sanitizeHTML(u.email)}</p>
          </td>
          <td class="p-3">
            ${roleBadgeMap[u.role] || u.role}
          </td>
          <td class="p-3">
            <p class="text-xs text-slate-700">${sanitizeHTML(u.department || '-')}</p>
            ${u.disability_type && u.disability_type !== '-' ? `<p class="text-[10px] text-govTeal">${sanitizeHTML(u.disability_type)}</p>` : ''}
          </td>
          <td class="p-3">
            ${supervisorCell}
          </td>
          <td class="p-3 text-center whitespace-nowrap">
            ${statusBadge}
          </td>
          <td class="p-3 text-center whitespace-nowrap">
            ${actionButtons}
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Filter search if query exists
      filterMembersTable();
    }

    function saveSupervisorAssignment(traineeUsername) {
      const select = document.getElementById(`assign-sup-${traineeUsername}`);
      if (!select) return;
      const newSup = select.value;

      const localUsers = getLocalUsers();
      const idx = localUsers.findIndex(u => u.username.toLowerCase() === traineeUsername.toLowerCase());
      if (idx !== -1) {
        localUsers[idx].supervisor_username = newSup;
        saveLocalUsers(localUsers);
        alert(`🎉 บันทึกการมอบหมายผู้ควบคุมงานให้ [${traineeUsername}] เป็น [@${newSup}] เรียบร้อยแล้ว!`);
        renderAllMembersList();
        updateSupervisorDashboardStats();
        updateSupervisorActiveTraineeUI();
      }
    }

    function resetUserPassword(username) {
      const newPass = prompt(`ระบุรหัสผ่านใหม่สำหรับผู้ใช้ [${username}]:`, 'NewPass@2026');
      if (!newPass) return;
      if (newPass.length < 6) {
        alert('⚠️ รหัสผ่านต้องมีความยาว 6 หลักขึ้นไป');
        return;
      }
      computeClientSha256(newPass).then(hash => {
        const localUsers = getLocalUsers();
        const idx = localUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
        if (idx !== -1) {
          localUsers[idx].client_hash = hash;
          saveLocalUsers(localUsers);
          alert(`✅ รีเซ็ตรหัสผ่านสำหรับ [${username}] เรียบร้อยแล้วเป็น: ${newPass}`);
        }
      });
    }

    // =========================================================================
    // 🚫 USER LIFECYCLE: SUSPEND / ACTIVATE / DELETE
    // =========================================================================
    async function toggleUserStatus(username) {
      const session = getActiveSession();
      if (!session || session.role !== 'staff') {
        alert('⚠️ อนุญาตเฉพาะ Admin / เจ้าหน้าที่เท่านั้น');
        return;
      }

      const localUsers = getLocalUsers();
      const idx = localUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      if (idx === -1) {
        alert('❌ ไม่พบผู้ใช้งาน');
        return;
      }

      const user = localUsers[idx];
      const willSuspend = !(user.is_suspended === true || user.status === 'suspended');
      const actionText = willSuspend ? 'ระงับสิทธิ์การใช้งานชั่วคราว' : 'ปลดล็อกสิทธิ์ให้ใช้งานตามปกติ';

      if (!confirm(`ยืนยันการ${actionText} สำหรับบัญชี [${user.full_name} (@${user.username})] หรือไม่?`)) {
        return;
      }

      user.is_suspended = willSuspend;
      user.status = willSuspend ? 'suspended' : 'active';
      saveLocalUsers(localUsers);

      // Backend sync if GAS configured
      const gasUrl = (window.apiConfig && window.apiConfig.endpointUrl && !window.apiConfig.endpointUrl.includes('AKfycbybyzm')) 
        ? window.apiConfig.endpointUrl : null;
      if (gasUrl && window.navigator.onLine) {
        try {
          await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'toggle_member_status',
              target_username: user.username,
              is_suspended: willSuspend,
              requester_username: session.username,
              requester_role: session.role
            })
          });
        } catch (e) {
          console.warn('GAS toggle status failed, saved locally:', e);
        }
      }

      alert(`✅ ${actionText} เรียบร้อยแล้ว!`);
      renderAllMembersList();
    }

    async function deleteUserAccount(username) {
      const session = getActiveSession();
      if (!session || session.role !== 'staff') {
        alert('⚠️ อนุญาตเฉพาะ Admin / เจ้าหน้าที่เท่านั้น');
        return;
      }

      if (username.toLowerCase() === session.username.toLowerCase()) {
        alert('⚠️ คุณไม่สามารถลบบัญชีของตนเองได้');
        return;
      }

      if (!confirm(`⚠️ ยืนยันการ "ลบบัญชีถาวร" สำหรับ [${username}] หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้!`)) {
        return;
      }

      const localUsers = getLocalUsers();
      const idx = localUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      if (idx !== -1) {
        localUsers.splice(idx, 1);
        saveLocalUsers(localUsers);
      }

      // Backend sync
      const gasUrl = (window.apiConfig && window.apiConfig.endpointUrl && !window.apiConfig.endpointUrl.includes('AKfycbybyzm')) 
        ? window.apiConfig.endpointUrl : null;
      if (gasUrl && window.navigator.onLine) {
        try {
          await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'delete_member',
              target_username: username,
              requester_username: session.username,
              requester_role: session.role
            })
          });
        } catch (e) {
          console.warn('GAS delete user failed, saved locally:', e);
        }
      }

      alert(`🗑️ ลบบัญชีผู้ใช้ [${username}] ถาวรเรียบร้อยแล้ว`);
      renderAllMembersList();
    }

    // =========================================================================
    // ✏️ EDIT MEMBER PROFILE MODAL CONTROLLER
    // =========================================================================
    function openEditMemberModal(username) {
      const session = getActiveSession();
      if (!session || session.role !== 'staff') {
        alert('⚠️ เฉพาะ Admin / เจ้าหน้าที่เท่านั้นที่สามารถแก้ไขข้อมูลสมาชิกได้');
        return;
      }

      const localUsers = getLocalUsers();
      const user = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!user) {
        alert('❌ ไม่พบข้อมูลสมาชิก');
        return;
      }

      document.getElementById('edit-member-username-hidden').value = user.username;
      document.getElementById('edit-member-username').value = `@${user.username}`;
      document.getElementById('edit-member-fullname').value = user.full_name || '';
      document.getElementById('edit-member-email').value = user.email || '';
      document.getElementById('edit-member-role').value = user.role || 'trainee';
      document.getElementById('edit-member-department').value = user.department || '';
      document.getElementById('edit-member-disability').value = user.disability_type || '-';
      
      const isSuspended = (user.is_suspended === true || user.status === 'suspended');
      document.getElementById('edit-member-status').value = isSuspended ? 'suspended' : 'active';

      document.getElementById('edit-member-subtitle').innerText = `แก้ไขข้อมูลสำหรับ @${user.username}`;
      const modal = document.getElementById('edit-member-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeEditMemberModal() {
      const modal = document.getElementById('edit-member-modal');
      if (modal) modal.classList.add('hidden');
    }

    async function saveEditMemberProfile(e) {
      e.preventDefault();
      const session = getActiveSession();
      if (!session || session.role !== 'staff') return;

      const username = document.getElementById('edit-member-username-hidden').value;
      const fullName = document.getElementById('edit-member-fullname').value.trim();
      const email = document.getElementById('edit-member-email').value.trim();
      const role = document.getElementById('edit-member-role').value;
      const department = document.getElementById('edit-member-department').value.trim();
      const disability = document.getElementById('edit-member-disability').value;
      const statusVal = document.getElementById('edit-member-status').value;
      const isSuspended = (statusVal === 'suspended');

      if (!fullName || !email) {
        alert('⚠️ กรุณากรอกชื่อ-นามสกุล และอีเมลให้ครบถ้วน');
        return;
      }

      const localUsers = getLocalUsers();
      const idx = localUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      if (idx === -1) {
        alert('❌ ไม่พบสมาชิก');
        return;
      }

      // Update Local
      localUsers[idx].full_name = fullName;
      localUsers[idx].email = email;
      localUsers[idx].role = role;
      localUsers[idx].department = department;
      localUsers[idx].disability_type = disability;
      localUsers[idx].is_suspended = isSuspended;
      localUsers[idx].status = isSuspended ? 'suspended' : 'active';
      saveLocalUsers(localUsers);

      // Backend sync
      const gasUrl = (window.apiConfig && window.apiConfig.endpointUrl && !window.apiConfig.endpointUrl.includes('AKfycbybyzm')) 
        ? window.apiConfig.endpointUrl : null;
      if (gasUrl && window.navigator.onLine) {
        try {
          await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'update_member_profile',
              target_username: username,
              full_name: fullName,
              email: email,
              role: role,
              department: department,
              disability_type: disability,
              is_suspended: isSuspended,
              requester_username: session.username,
              requester_role: session.role
            })
          });
        } catch (err) {
          console.warn('GAS update profile failed, saved locally:', err);
        }
      }

      closeEditMemberModal();
      alert(`🎉 บันทึกการแก้ไขข้อมูลของ [${fullName}] เรียบร้อยแล้ว!`);
      renderAllMembersList();
    }

    // =========================================================================
    // 🛡️ MODAL ENTRYPOINTS & BATCH SELECTION
    // =========================================================================
    function openMemberManagementModal() {
      const session = getActiveSession();
      if (!session || (session.role !== 'supervisor' && session.role !== 'staff')) {
        alert('⚠️ คุณไม่มีสิทธิ์เข้าถึงศูนย์จัดการสมาชิก');
        return;
      }

      const modal = document.getElementById('member-management-modal');
      const badge = document.getElementById('mgmt-view-badge');
      const subtitle = document.getElementById('member-mgmt-subtitle');

      if (session.role === 'staff') {
        if (badge) badge.innerText = 'Admin / เจ้าหน้าที่ (คุมได้ทุกคน)';
        if (subtitle) subtitle.innerText = 'ตรวจสอบและอนุมัติสมาชิกทุกบทบาทในระบบราชการ';
      } else {
        if (badge) badge.innerText = `ผู้ควบคุมงาน: ${session.full_name || session.username}`;
        if (subtitle) subtitle.innerText = 'ตรวจสอบและอนุมัติเด็กฝึกงานที่ขออยู่ภายใต้การดูแลของคุณ';
      }

      selectedPendingUsernames.clear();
      updateBatchUI();
      refreshPendingMemberList();
      if (modal) modal.classList.remove('hidden');
    }

    function closeMemberManagementModal() {
      const modal = document.getElementById('member-management-modal');
      if (modal) modal.classList.add('hidden');
    }

    function toggleSelectAllPending(masterCheckbox) {
      const tbody = document.getElementById('pending-members-tbody');
      if (!tbody) return;
      const checkboxes = tbody.querySelectorAll('input.pending-item-checkbox');
      checkboxes.forEach(cb => {
        // Only select visible ones (matching search filter)
        const tr = cb.closest('tr');
        if (tr && tr.style.display !== 'none') {
          cb.checked = masterCheckbox.checked;
          const u = cb.getAttribute('data-username');
          if (masterCheckbox.checked) {
            selectedPendingUsernames.add(u);
          } else {
            selectedPendingUsernames.delete(u);
          }
        }
      });
      updateBatchUI();
    }

    function onPendingItemCheck(cb) {
      const username = cb.getAttribute('data-username');
      if (cb.checked) {
        selectedPendingUsernames.add(username);
      } else {
        selectedPendingUsernames.delete(username);
        const master = document.getElementById('master-select-pending');
        if (master) master.checked = false;
      }
      updateBatchUI();
    }

    function updateBatchUI() {
      const container = document.getElementById('batch-actions-container');
      const countSpan = document.getElementById('batch-selected-count');
      if (!container || !countSpan) return;

      const count = selectedPendingUsernames.size;
      countSpan.innerText = `เลือก ${count} รายการ`;

      if (count > 0 && currentMgmtTab === 'pending') {
        container.classList.remove('hidden');
        container.classList.add('flex');
      } else {
        container.classList.add('hidden');
        container.classList.remove('flex');
      }
    }

    async function batchApproveMembers(action) {
      const session = getActiveSession();
      if (!session) return;

      const usernames = Array.from(selectedPendingUsernames);
      if (usernames.length === 0) {
        alert('⚠️ กรุณาเลือกรายการที่ต้องการดำเนินการอย่างน้อย 1 รายการ');
        return;
      }

      const actionText = (action === 'approve') ? 'อนุมัติ' : 'ปฏิเสธและลบ';
      if (!confirm(`ยืนยันการ${actionText} สมาชิกที่เลือกทั้งหมด ${usernames.length} รายการ หรือไม่?`)) {
        return;
      }

      // 1. Google Apps Script Batch Call
      const gasUrl = (window.apiConfig && window.apiConfig.endpointUrl && !window.apiConfig.endpointUrl.includes('AKfycbybyzm')) 
        ? window.apiConfig.endpointUrl : null;

      if (gasUrl && window.navigator.onLine) {
        try {
          await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'batch_approve_members',
              target_usernames: usernames,
              approve_action: action,
              requester_username: session.username,
              requester_role: session.role
            })
          });
        } catch (e) {
          console.warn('GAS batch approval failed, processing locally:', e);
        }
      }

      // 2. Update local database
      const localUsers = getLocalUsers();
      const now = new Date().toISOString();

      usernames.forEach(uname => {
        const idx = localUsers.findIndex(u => u.username.toLowerCase() === uname.toLowerCase());
        if (idx !== -1) {
          if (action === 'approve') {
            localUsers[idx].is_approved = true;
            localUsers[idx].approved_by = session.username;
            localUsers[idx].approved_at = now;
          } else {
            localUsers.splice(idx, 1);
          }
        }
      });
      saveLocalUsers(localUsers);

      selectedPendingUsernames.clear();
      const master = document.getElementById('master-select-pending');
      if (master) master.checked = false;
      updateBatchUI();

      alert(`✅ ดำเนินการ${actionText} สมาชิกทั้งหมด ${usernames.length} รายการ เรียบร้อยแล้ว!`);
      refreshPendingMemberList();
      updatePendingCountBadge();
    }

    // =========================================================================
    // 📋 TAB 1: PENDING MEMBERS
    // =========================================================================
    async function refreshPendingMemberList() {
      const session = getActiveSession();
      const tbody = document.getElementById('pending-members-tbody');
      if (!tbody || !session) return;

      tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400"><i class="fa-solid fa-spinner animate-spin mr-1"></i> กำลังโหลดข้อมูลสมาชิก...</td></tr>';

      let pendingList = [];
      const localUsers = getLocalUsers();

      // Filter Two-Tier:
      if (session.role === 'staff') {
        // Staff sees all pending
        pendingList = localUsers.filter(u => u.is_approved !== true);
      } else if (session.role === 'supervisor') {
        // Supervisor sees only trainees who selected them
        const myUser = session.username.toLowerCase();
        pendingList = localUsers.filter(u => 
          u.is_approved !== true && 
          u.role === 'trainee' && 
          String(u.supervisor_username).toLowerCase() === myUser
        );
      }

      tbody.innerHTML = '';
      if (pendingList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400"><i class="fa-solid fa-circle-check text-emerald-500 text-lg mb-1 block"></i>ไม่มีสมาชิกที่รอการอนุมัติในสังกัดของคุณในขณะนี้</td></tr>';
        updatePendingCountBadge(0);
        updateBatchUI();
        return;
      }

      updatePendingCountBadge(pendingList.length);

      const roleBadgeMap = {
        trainee: '<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">ผู้ฝึกงาน</span>',
        supervisor: '<span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">ผู้ควบคุมงาน</span>',
        advisor: '<span class="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">อาจารย์นิเทศก์</span>',
        staff: '<span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">Admin</span>'
      };

      pendingList.forEach(m => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.setAttribute('data-user', m.username);
        tr.setAttribute('data-role', m.role);
        tr.setAttribute('data-search', `${m.full_name} ${m.username} ${m.email} ${m.department || ''}`.toLowerCase());

        const isChecked = selectedPendingUsernames.has(m.username) ? 'checked' : '';

        tr.innerHTML = `
          <td class="p-3 w-10 text-center">
            <input type="checkbox" onchange="onPendingItemCheck(this)" data-username="${sanitizeHTML(m.username)}" ${isChecked} class="pending-item-checkbox rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer">
          </td>
          <td class="p-3">
            <p class="font-bold text-slate-800 text-xs">${sanitizeHTML(m.full_name)}</p>
            <p class="text-[10px] text-slate-400 font-mono">@${sanitizeHTML(m.username)} | ${sanitizeHTML(m.email)}</p>
          </td>
          <td class="p-3">
            ${roleBadgeMap[m.role] || m.role}
          </td>
          <td class="p-3">
            <p class="text-xs text-slate-700">${sanitizeHTML(m.department || '-')}</p>
            ${m.disability_type && m.disability_type !== '-' ? `<p class="text-[10px] text-govTeal">${sanitizeHTML(m.disability_type)}</p>` : ''}
          </td>
          <td class="p-3 font-mono text-[11px] text-slate-600">
            ${sanitizeHTML(m.supervisor_username || '-')}
          </td>
          <td class="p-3 text-center space-x-1.5 whitespace-nowrap">
            <button onclick="approveMember('${sanitizeHTML(m.username)}', 'approve')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-xs transition">
              <i class="fa-solid fa-check mr-0.5"></i> อนุมัติ
            </button>
            <button onclick="approveMember('${sanitizeHTML(m.username)}', 'reject')" class="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-xs transition">
              <i class="fa-solid fa-xmark mr-0.5"></i> ปฏิเสธ
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      filterMembersTable();
      updateBatchUI();
    }

    function updatePendingCountBadge(count) {
      const badge = document.getElementById('pending-count-badge');
      if (!badge) return;
      if (count === undefined) {
        const session = getActiveSession();
        if (!session) return;
        const localUsers = getLocalUsers();
        let list = [];
        if (session.role === 'staff') {
          list = localUsers.filter(u => u.is_approved !== true);
        } else if (session.role === 'supervisor') {
          const myUser = session.username.toLowerCase();
          list = localUsers.filter(u => u.is_approved !== true && u.role === 'trainee' && String(u.supervisor_username).toLowerCase() === myUser);
        }
        count = list.length;
      }

      if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    async function approveMember(targetUsername, action) {
      const session = getActiveSession();
      if (!session) return;

      const actionText = action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธและลบ';
      if (!confirm(`ยืนยันการ${actionText} บัญชีผู้ใช้ [${targetUsername}] หรือไม่?`)) {
        return;
      }

      // 1. Google Apps Script call if URL configured
      const gasUrl = (window.apiConfig && window.apiConfig.endpointUrl && !window.apiConfig.endpointUrl.includes('AKfycbybyzm')) 
        ? window.apiConfig.endpointUrl : null;

      if (gasUrl && window.navigator.onLine) {
        try {
          await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'approve_member',
              target_username: targetUsername,
              approve_action: action,
              requester_username: session.username,
              requester_role: session.role
            })
          });
        } catch (e) {
          console.warn('GAS approve call failed, applying locally:', e);
        }
      }

      // 2. Update local database
      const localUsers = getLocalUsers();
      const targetIdx = localUsers.findIndex(u => u.username.toLowerCase() === targetUsername.toLowerCase());
      if (targetIdx !== -1) {
        if (action === 'approve') {
          localUsers[targetIdx].is_approved = true;
          localUsers[targetIdx].approved_by = session.username;
          localUsers[targetIdx].approved_at = new Date().toISOString();
        } else {
          localUsers.splice(targetIdx, 1);
        }
        saveLocalUsers(localUsers);
      }

      selectedPendingUsernames.delete(targetUsername);
      alert(`✅ ดำเนินการ${actionText} บัญชี [${targetUsername}] เรียบร้อยแล้ว`);
      refreshPendingMemberList();
      updatePendingCountBadge();
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadSecurityState();
      loadFromLocalStorage();
      checkIncomingBeamSync();

      // Detect incoming QR Code sync trigger (?sync=1)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('sync') === '1') {
        const workingEndpoint = 'https://script.google.com/macros/s/AKfycbxuis78gea-uZjPKtgGg3hQ1an-jLRPrCNYSmVBoJTzVoUtzff8aXgHCPtXmAPrHxBJmw/exec';
        apiConfig.endpointUrl = workingEndpoint;
        apiConfig.autoSync = true;
        localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(apiConfig));

        pullDataFromApi(true).then(() => {
          history.replaceState(null, '', window.location.pathname);
          alert("🎉 ซิงค์ข้อมูลข้ามเครื่องสำเร็จ! ข้อมูลทั้งหมด (ตาราง OJT, ชั่วโมงสะสม 24 ชม., ผลงาน และลายเซ็น) ปรากฏบน iPad เรียบร้อยแล้วครับ");
        });
      }
      updateSecurityUI();

      // Cloud Auto-Sync: Auto-pull on load if autoSync is active
      if (apiConfig && apiConfig.autoSync && apiConfig.endpointUrl) {
        pullDataFromApi(true);
      }

      // Cloud Auto-Sync: Auto-pull when switching back to this browser tab (Mac ↔ iPad)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && apiConfig && apiConfig.autoSync && apiConfig.endpointUrl) {
          pullDataFromApi(true);
        }
      });
      renderProfile();
      renderProjectSummary();
      changeOjtWeek();
      renderChart();
      checkAuthGuard();
      initDemoSandboxMode();
    });
  
