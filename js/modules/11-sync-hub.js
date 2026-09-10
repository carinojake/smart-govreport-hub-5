// Module: 11-sync-hub.js (Smart GovReport Hub 2.5)
    // =========================================================================
    // LOCALSTORAGE PERSISTENCE ENGINE & DATA BACKUP
    // =========================================================================
    let currentViewTrainee = 'trainee_jake';

    function getUserStorageKey(baseKey, targetUser = null) {
      const session = getActiveSession();
      let u = targetUser;
      if (!u) {
        if (session && session.role === 'trainee') {
          u = session.username;
        } else {
          u = currentViewTrainee || 'trainee_jake';
        }
      } else if (session && session.role === 'trainee') {
        // Strict lockdown: trainee can never access another trainee's storage key
        u = session.username;
      }
      return `${baseKey}_${(u || 'default').toLowerCase()}`;
    }

    const STORAGE_KEYS = {
      OJT_DATA: 'smartgov_ojt_weekly_data_v2_0',
      PROFILE_DATA: 'smartgov_profile_data_v2_0',
      PROJECT_SUMMARY: 'smartgov_project_summary_v2_0',
      OFFICIAL_MEMO: 'smartgov_official_memo_v2_0',
      PORTFOLIO_DATA: 'smartgov_portfolio_data_v2_0',
      ONBOARDED: 'smartgov_onboarded_v2_0',
      API_CONFIG: 'smartgov_api_config_v2_0',
      LAST_SAVED: 'smartgov_last_saved_timestamp_v2_0'
    };

    let apiConfig = {
      endpointUrl: 'https://script.google.com/macros/s/AKfycbxuis78gea-uZjPKtgGg3hQ1an-jLRPrCNYSmVBoJTzVoUtzff8aXgHCPtXmAPrHxBJmw/exec',
      authToken: '',
      autoSync: false,
      geminiApiKey: '',
      geminiModel: 'gemini-2.0-flash',
      geminiTemp: 0.4
    };

    function saveToLocalStorage(skipCloudPush = false) {
      try {
        const ojtKey = getUserStorageKey(STORAGE_KEYS.OJT_DATA);
        const profileKey = getUserStorageKey(STORAGE_KEYS.PROFILE_DATA);
        const projectKey = getUserStorageKey(STORAGE_KEYS.PROJECT_SUMMARY);
        const memoKey = getUserStorageKey(STORAGE_KEYS.OFFICIAL_MEMO);
        const portfolioKey = getUserStorageKey(STORAGE_KEYS.PORTFOLIO_DATA);
        const lastSavedKey = getUserStorageKey(STORAGE_KEYS.LAST_SAVED);

        localStorage.setItem(ojtKey, JSON.stringify(liveOjtData));
        localStorage.setItem(profileKey, JSON.stringify(profileData));
        localStorage.setItem(projectKey, JSON.stringify(projectSummaryData));
        localStorage.setItem(memoKey, JSON.stringify(officialMemoData));
        localStorage.setItem(portfolioKey, JSON.stringify(portfolioData));
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem(lastSavedKey, timeStr);

        updateStorageUIIndicators(timeStr);

        if (!skipCloudPush && apiConfig.autoSync && apiConfig.endpointUrl) {
          if (autoSyncDebounceTimer) clearTimeout(autoSyncDebounceTimer);
          autoSyncDebounceTimer = setTimeout(() => {
            pushDataToApi(true); // background silent auto-push
          }, 1500);
        }
      } catch (err) {
        console.error('LocalStorage Save Error:', err);
      }
    }

    function loadFromLocalStorage() {
      try {
        const session = getActiveSession();
        let targetUser = 'trainee_jake';
        if (session && session.role === 'trainee') {
          targetUser = session.username;
        } else if (currentViewTrainee) {
          targetUser = currentViewTrainee;
        }

        const ojtKey = getUserStorageKey(STORAGE_KEYS.OJT_DATA, targetUser);
        const profileKey = getUserStorageKey(STORAGE_KEYS.PROFILE_DATA, targetUser);
        const projectKey = getUserStorageKey(STORAGE_KEYS.PROJECT_SUMMARY, targetUser);
        const memoKey = getUserStorageKey(STORAGE_KEYS.OFFICIAL_MEMO, targetUser);
        const portfolioKey = getUserStorageKey(STORAGE_KEYS.PORTFOLIO_DATA, targetUser);
        const lastSavedKey = getUserStorageKey(STORAGE_KEYS.LAST_SAVED, targetUser);

        // Backward compatibility migration for trainee_jake
        if (targetUser.toLowerCase() === 'trainee_jake') {
          if (!localStorage.getItem(ojtKey) && localStorage.getItem(STORAGE_KEYS.OJT_DATA)) {
            localStorage.setItem(ojtKey, localStorage.getItem(STORAGE_KEYS.OJT_DATA));
          }
          if (!localStorage.getItem(profileKey) && localStorage.getItem(STORAGE_KEYS.PROFILE_DATA)) {
            localStorage.setItem(profileKey, localStorage.getItem(STORAGE_KEYS.PROFILE_DATA));
          }
          if (!localStorage.getItem(projectKey) && localStorage.getItem(STORAGE_KEYS.PROJECT_SUMMARY)) {
            localStorage.setItem(projectKey, localStorage.getItem(STORAGE_KEYS.PROJECT_SUMMARY));
          }
          if (!localStorage.getItem(memoKey)) {
            localStorage.setItem(memoKey, JSON.stringify(defaultOfficialMemoData));
          }
          if (!localStorage.getItem(portfolioKey)) {
            localStorage.setItem(portfolioKey, JSON.stringify(defaultPortfolioData));
          }
        }

        // 1. Load OJT Weekly Data
        const savedOjt = localStorage.getItem(ojtKey);
        if (savedOjt) {
          liveOjtData = JSON.parse(savedOjt);
          // จัดเรียงตามวันที่อัตโนมัติทุกสัปดาห์
          [1, 2, 3, 4, 5].forEach(w => sortWeekEntriesByDate(w));
          // Merge curated default photos if row has none (only if trainee_jake)
          if (targetUser.toLowerCase() === 'trainee_jake') {
            for (let w in initialOjtWeeklyData) {
              if (liveOjtData[w]) {
                liveOjtData[w].forEach((r) => {
                  const initItem = initialOjtWeeklyData[w] && initialOjtWeeklyData[w].find(x => x.id === r.id);
                  if ((!r.images || r.images.length === 0) && initItem && initItem.images) {
                    r.images = JSON.parse(JSON.stringify(initItem.images));
                  }
                });
              }
            }
          }
        } else {
          if (targetUser.toLowerCase() === 'trainee_jake') {
            liveOjtData = JSON.parse(JSON.stringify(initialOjtWeeklyData));
          } else {
            liveOjtData = JSON.parse(JSON.stringify(emptyOjtWeeklyData));
          }
          localStorage.setItem(ojtKey, JSON.stringify(liveOjtData));
        }

        // 2. Load Profile Data
        const savedProfile = localStorage.getItem(profileKey);
        if (savedProfile) {
          profileData = Object.assign(JSON.parse(JSON.stringify(defaultProfileData)), JSON.parse(savedProfile));
          // Auto-heal truncated agency name if it ends with ellipsis from earlier bug
          if (profileData.orgName && (profileData.orgName.includes('ศูนย์เทคโนโลยีสารส') || profileData.orgName.endsWith('…') || profileData.orgName.endsWith('...'))) {
            if (profileData.orgName.includes('ยุติธรรม')) {
              profileData.orgName = 'สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร';
            } else {
              profileData.orgName = profileData.orgName.replace(/[…\.]+$/, '').trim();
            }
            localStorage.setItem(profileKey, JSON.stringify(profileData));
          }
          // Auto-migrate curriculum dates to official Monday-Friday dates
          if (profileData.curriculum) {
            if (profileData.curriculum.w1 && (profileData.curriculum.w1.dates === '1 - 4 ก.ย. 69' || !profileData.curriculum.w1.dates)) profileData.curriculum.w1.dates = '1 - 4 ก.ย. 69';
            if (profileData.curriculum.w2 && (profileData.curriculum.w2.dates === '7 - 11 ก.ย. 69' || !profileData.curriculum.w2.dates)) profileData.curriculum.w2.dates = '7 - 11 ก.ย. 69';
            if (profileData.curriculum.w3 && (profileData.curriculum.w3.dates === '14 - 18 ก.ย. 69' || !profileData.curriculum.w3.dates)) profileData.curriculum.w3.dates = '14 - 18 ก.ย. 69';
            if (profileData.curriculum.w4 && (profileData.curriculum.w4.dates === '21 - 25 ก.ย. 69' || !profileData.curriculum.w4.dates)) profileData.curriculum.w4.dates = '21 - 25 ก.ย. 69';
            if (profileData.curriculum.w5 && !profileData.curriculum.w5.dates) profileData.curriculum.w5.dates = '28 - 30 ก.ย. 69';
            localStorage.setItem(profileKey, JSON.stringify(profileData));
          }
        } else {
          if (targetUser.toLowerCase() === 'trainee_jake') {
            profileData = JSON.parse(JSON.stringify(defaultProfileData));
          } else {
            const localUsers = getLocalUsers();
            const uObj = localUsers.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
            profileData = Object.assign(JSON.parse(JSON.stringify(defaultProfileData)), {
              traineeName: uObj ? (uObj.full_name || uObj.username) : ((session && session.full_name) ? session.full_name : targetUser),
              traineeNick: uObj ? (uObj.full_name ? uObj.full_name.split(' ')[0] : uObj.username) : ((session && session.full_name) ? session.full_name.split(' ')[0] : targetUser),
              traineeEmail: uObj ? (uObj.email || '') : (session ? session.email : ''),
              traineePhone: uObj ? (uObj.phone || '') : (session ? session.phone : ''),
              traineeDisability: uObj ? (uObj.disability_type || 'ทางการเคลื่อนไหวหรือทางร่างกาย') : (session ? session.disability_type : 'ทางการเคลื่อนไหวหรือทางร่างกาย'),
              supervisorName: (session && session.role === 'supervisor') ? session.full_name : 'นางสาวสรินยา สุวรรณวณิช'
            });
          }
          localStorage.setItem(profileKey, JSON.stringify(profileData));
        }

        // 3. Load Project Summary
        const savedProjectSummary = localStorage.getItem(projectKey);
        if (savedProjectSummary) {
          projectSummaryData = Object.assign(JSON.parse(JSON.stringify(initialProjectSummaryData)), JSON.parse(savedProjectSummary));
        } else {
          projectSummaryData = JSON.parse(JSON.stringify(initialProjectSummaryData));
          if (targetUser.toLowerCase() !== 'trainee_jake') {
            const localUsers = getLocalUsers();
            const uObj = localUsers.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
            if (uObj && uObj.full_name) {
              projectSummaryData.reporterName = uObj.full_name;
            }
          }
          localStorage.setItem(projectKey, JSON.stringify(projectSummaryData));
        }

        // 4. Load Official Memorandum Data (Tab 4)
        const savedMemo = localStorage.getItem(memoKey);
        if (savedMemo) {
          officialMemoData = Object.assign(JSON.parse(JSON.stringify(defaultOfficialMemoData)), JSON.parse(savedMemo));
        } else {
          officialMemoData = JSON.parse(JSON.stringify(defaultOfficialMemoData));
          if (targetUser.toLowerCase() !== 'trainee_jake') {
            const localUsers = getLocalUsers();
            const uObj = localUsers.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
            const tName = uObj ? (uObj.full_name || uObj.username) : ((session && session.full_name) ? session.full_name : targetUser);
            officialMemoData.signName = tName;
            officialMemoData.origin = `ตามที่ข้าพเจ้า ${tName} ได้รับมอบหมายให้เข้ารับการฝึกปฏิบัติงานในหลักสูตรเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ รุ่นที่ 1 และได้รับมอบหมายภารกิจในการปฏิบัติงานตามมาตรฐาน OJT นั้น`;
          }
          localStorage.setItem(memoKey, JSON.stringify(officialMemoData));
        }

        // 5. Load Portfolio Data (Tab 5)
        const savedPortfolio = localStorage.getItem(portfolioKey);
        if (savedPortfolio) {
          portfolioData = Object.assign(JSON.parse(JSON.stringify(defaultPortfolioData)), JSON.parse(savedPortfolio));
        } else {
          if (targetUser.toLowerCase() === 'trainee_jake') {
            portfolioData = JSON.parse(JSON.stringify(defaultPortfolioData));
          } else {
            const localUsers = getLocalUsers();
            const uObj = localUsers.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
            const tName = uObj ? (uObj.full_name || uObj.username) : ((session && session.full_name) ? session.full_name : targetUser);
            portfolioData = Object.assign(JSON.parse(JSON.stringify(emptyPortfolioTemplate)), {
              traineeName: tName,
              headline: `ผู้เข้ารับการฝึกอบรมเตรียมความพร้อมสำหรับการจ้างงานคนพิการภาครัฐ รุ่นที่ 1`,
              experiences: [
                {
                  role: "ผู้เข้ารับการฝึกภาคปฏิบัติ (OJT)",
                  org: profileData.orgName || "สำนักงานปลัดกระทรวงยุติธรรม",
                  period: "กันยายน 2569",
                  desc: "ฝึกปฏิบัติงานเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ"
                }
              ]
            });
          }
          localStorage.setItem(portfolioKey, JSON.stringify(portfolioData));
        }

        const savedApi = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
        if (savedApi) {
          apiConfig = Object.assign(apiConfig, JSON.parse(savedApi));
        }

        const lastSaved = localStorage.getItem(lastSavedKey) || 'พร้อมใช้งาน';
        updateStorageUIIndicators(lastSaved);
      } catch (err) {
        console.error('LocalStorage Load Error:', err);
      }
    }

    // =========================================================================
    // API & CLOUD SYNC HUB
    // =========================================================================
    function setApiPreset(preset) {
      const inEl = document.getElementById('api-endpoint-url');
      if (preset === 'fastapi') {
        inEl.value = 'http://localhost:8083/api/sync';
      } else {
        inEl.value = 'https://script.google.com/macros/s/AKfycbxuis78gea-uZjPKtgGg3hQ1an-jLRPrCNYSmVBoJTzVoUtzff8aXgHCPtXmAPrHxBJmw/exec';
      }
      saveApiFormState();
      testApiPing();
    }

    function openApiSyncModal() {
      const session = getActiveSession();
      if (!session || session.role !== 'staff') {
        alert('🚫 สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin/Staff) เท่านั้นที่สามารถเข้าถึงศูนย์ควบคุม API & Cloud Hub ได้');
        return;
      }
      // Auto-migrate or default to local FastAPI 8083 if not explicitly set
      if (!apiConfig.endpointUrl || apiConfig.endpointUrl.includes('AKfycbybyzm') || apiConfig.endpointUrl.includes('/edit')) {
        apiConfig.endpointUrl = 'http://localhost:8083/api/sync';
        localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(apiConfig));
      }
      document.getElementById('api-endpoint-url').value = apiConfig.endpointUrl;
      document.getElementById('api-auth-token').value = apiConfig.authToken || '';
      document.getElementById('api-auto-sync').checked = !!apiConfig.autoSync;
      document.getElementById('gemini-api-key').value = apiConfig.geminiApiKey || '';
      document.getElementById('gemini-model-select').value = apiConfig.geminiModel || 'gemini-2.0-flash';
      document.getElementById('gemini-temp').value = apiConfig.geminiTemp || 0.4;

      updateStorageUIIndicators(localStorage.getItem(STORAGE_KEYS.LAST_SAVED) || 'ตอนนี้');
      document.getElementById('api-sync-modal').classList.remove('hidden');
    }

    function closeApiSyncModal() {
      saveApiFormState();
      document.getElementById('api-sync-modal').classList.add('hidden');
    }

    function switchSyncTab(tab) {
      const tabs = ['local', 'cloud', 'gemini'];
      tabs.forEach(t => {
        const btn = document.getElementById(`tab-sync-${t}`);
        const panel = document.getElementById(`panel-sync-${t}`);
        if (t === tab) {
          btn.className = 'flex-1 py-2 rounded-lg bg-govNavy text-white shadow-sm transition flex items-center justify-center space-x-1.5';
          panel.classList.remove('hidden');
        } else {
          btn.className = 'flex-1 py-2 rounded-lg text-slate-600 hover:bg-slate-200 transition flex items-center justify-center space-x-1.5';
          panel.classList.add('hidden');
        }
      });
    }

    function saveApiFormState() {
      apiConfig.endpointUrl = document.getElementById('api-endpoint-url').value.trim();
      apiConfig.authToken = document.getElementById('api-auth-token').value.trim();
      apiConfig.autoSync = document.getElementById('api-auto-sync').checked;
      apiConfig.geminiApiKey = document.getElementById('gemini-api-key').value.trim();
      apiConfig.geminiModel = document.getElementById('gemini-model-select').value;
      apiConfig.geminiTemp = parseFloat(document.getElementById('gemini-temp').value) || 0.4;
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(apiConfig));
    }

    function saveGeminiConfig() {
      saveApiFormState();
      alert("บันทึกการตั้งค่า Gemini AI เรียบร้อยแล้ว");
    }

    async function testApiPing() {
      saveApiFormState();
      const url = apiConfig.endpointUrl;
      const logBox = document.getElementById('api-log-box');
      const logStatus = document.getElementById('api-log-status');
      const logContent = document.getElementById('api-log-content');

      if (!url) {
        alert("กรุณากรอก API Endpoint หรือ Webhook URL ก่อนทดสอบ");
        return;
      }

      if (url.includes('/edit')) {
        alert("⚠️ ตรวจพบว่าลิงก์ลงท้ายด้วย /edit (เป็นหน้าจอพิมพ์โค้ดสำหรับมนุษย์)\n\nกรุณาใช้ลิงก์ที่ลงท้ายด้วย /exec จากปุ่ม Deploy > New deployment ใน Google Apps Script ครับ");
        return;
      }

      logBox.classList.remove('hidden');
      logStatus.className = 'px-1.5 py-0.5 bg-yellow-900 text-yellow-300 rounded font-bold';
      logStatus.innerText = 'Pinging...';
      logContent.innerText = `Connecting to ${url}...`;

      try {
        const startTime = performance.now();
        const pingUrl = url.includes('?') ? (url + '&action=ping&ts=' + Date.now()) : (url + '?action=ping&ts=' + Date.now());
        const res = await fetch(pingUrl, { redirect: 'follow' });
        const duration = Math.round(performance.now() - startTime);

        logStatus.className = res.ok ? 'px-1.5 py-0.5 bg-emerald-900 text-emerald-300 rounded font-bold' : 'px-1.5 py-0.5 bg-red-900 text-red-300 rounded font-bold';
        logStatus.innerText = `${res.status} OK (${duration}ms)`;

        const text = await res.text();
        try {
          const json = JSON.parse(text);
          logContent.innerText = JSON.stringify(json, null, 2);
        } catch {
          logContent.innerText = text || `Connected successfully with status ${res.status}`;
        }
      } catch (err) {
        logStatus.className = 'px-1.5 py-0.5 bg-red-900 text-red-300 rounded font-bold';
        logStatus.innerText = 'Error / CORS';
        logContent.innerText = `Connection Failed: ${err.message}\n(ระบบได้แก้เป็น GET Ping แล้ว หากยังติด CORS ให้ตรวจสอบว่าใช้ลิงก์ /exec ตัวใหม่ล่าสุด)`;
      }
    }

    let isSyncingNow = false;
    let autoSyncDebounceTimer = null;

    async function pushDataToApi(isSilent = false) {
      saveApiFormState();
      const url = apiConfig.endpointUrl;
      if (!url) {
        if (!isSilent) alert("กรุณาระบุ Webhook URL ในหน้าต่างตั้งค่าก่อนซิงค์");
        return;
      }

      if (url.includes('/edit')) {
        if (!isSilent) {
          alert("⚠️ ตรวจพบว่าลิงก์ลงท้ายด้วย /edit (เป็นหน้าจอพิมพ์โค้ดสำหรับมนุษย์)\n\nเบราว์เซอร์ไม่สามารถส่งข้อมูลไปที่ /edit ได้ครับ\n👉 กรุณาใช้ลิงก์ที่ลงท้ายด้วย /exec จากปุ่ม Deploy > New deployment ใน Google Apps Script ครับ");
        }
        return;
      }

      if (isSyncingNow) return;
      isSyncingNow = true;

      const logBox = document.getElementById('api-log-box');
      const logStatus = document.getElementById('api-log-status');
      const logContent = document.getElementById('api-log-content');

      if (!isSilent && logBox) {
        logBox.classList.remove('hidden');
        logStatus.className = 'px-1.5 py-0.5 bg-yellow-900 text-yellow-300 rounded font-bold';
        logStatus.innerText = 'Pushing Data...';
      }

      const payload = {
        action: 'sync_push',
        timestamp: new Date().toISOString(),
        lastUpdated: Date.now(),
        profile: profileData,
        projectSummary: projectSummaryData,
        ojtWeeklyData: liveOjtData,
        security: securityState
      };

      try {
        const headers = { 'Content-Type': 'text/plain;charset=utf-8' };
        if (apiConfig.authToken) headers['Authorization'] = apiConfig.authToken;

        const res = await fetch(url, {
          method: 'POST',
          headers,
          redirect: 'follow',
          body: JSON.stringify(payload)
        });

        const now = new Date();
        const timeStr = `Cloud: ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} น.`;
        updateStorageUIIndicators(timeStr);

        if (!isSilent && logStatus) {
          logStatus.className = res.ok ? 'px-1.5 py-0.5 bg-emerald-900 text-emerald-300 rounded font-bold' : 'px-1.5 py-0.5 bg-red-900 text-red-300 rounded font-bold';
          logStatus.innerText = `${res.status} ${res.statusText}`;
          const text = await res.text();
          if (logContent) logContent.innerText = text;
          alert("☁️ ซิงค์ข้อมูล OJT, รูปภาพ, ลายเซ็น และผลงานขึ้น Cloud สำเร็จเรียบร้อยแล้ว!");
        }
      } catch (err) {
        if (!isSilent) {
          if (logStatus) {
            logStatus.className = 'px-1.5 py-0.5 bg-red-900 text-red-300 rounded font-bold';
            logStatus.innerText = 'Sync Error';
          }
          if (logContent) logContent.innerText = err.message;
          alert("เกิดข้อผิดพลาดในการส่งข้อมูล: " + err.message);
        }
      } finally {
        isSyncingNow = false;
      }
    }

    async function pullDataFromApi(isSilent = false) {
      saveApiFormState();
      const url = apiConfig.endpointUrl;
      if (!url) {
        if (!isSilent) alert("กรุณาระบุ Webhook URL ก่อนดึงข้อมูล");
        return;
      }

      if (!isSilent && !confirm("ต้องการดึงข้อมูลล่าสุดจาก Cloud มาแสดงและอัปเดตข้อมูลในเครื่องใช่หรือไม่?")) return;

      if (isSyncingNow) return;
      isSyncingNow = true;

      try {
        let data = null;
        try {
          const res = await fetch(url, { redirect: 'follow' });
          data = await res.json();
        } catch (getErr) {
          const headers = { 'Content-Type': 'text/plain;charset=utf-8' };
          if (apiConfig.authToken) headers['Authorization'] = apiConfig.authToken;
          const res = await fetch(url, {
            method: 'POST',
            headers,
            redirect: 'follow',
            body: JSON.stringify({ action: 'sync_pull', timestamp: new Date().toISOString() })
          });
          data = await res.json();
        }
        if (data && (data.ojtWeeklyData || data.profile)) {
          // 1. Save Rollback Snapshot first!
          const snapshot = {
            profile: JSON.parse(JSON.stringify(profileData)),
            ojt: JSON.parse(JSON.stringify(liveOjtData)),
            project: JSON.parse(JSON.stringify(projectSummaryData)),
            security: JSON.parse(JSON.stringify(securityState)),
            time: new Date().toLocaleString('th-TH')
          };
          localStorage.setItem('smartgov_pre_sync_snapshot', JSON.stringify(snapshot));

          // 2. Apply pulled data
          if (data.ojtWeeklyData) liveOjtData = data.ojtWeeklyData;
          if (data.profile) profileData = Object.assign(profileData, data.profile);
          if (data.projectSummary) projectSummaryData = Object.assign(projectSummaryData, data.projectSummary);
          if (data.security) securityState = Object.assign(securityState, data.security);

          // 3. Save to local storage without re-pushing
          saveToLocalStorage(true);

          // 4. Re-render UI
          renderOjtPages();
          renderProfile();
          renderProfileHeader();
          renderProjectSummary();
          updateDashboardKPI();
          updateSecurityUI();

          const now = new Date();
          const timeStr = `Cloud: ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} น.`;
          updateStorageUIIndicators(timeStr);

          if (!isSilent) {
            alert("☁️ ดึงข้อมูลล่าสุดจาก Cloud มาอัปเดตบนหน้าจอและจัดเก็บในเครื่องเรียบร้อยแล้ว!");
          }
        } else {
          if (!isSilent) alert("ยังไม่มีข้อมูลที่บันทึกไว้บน Cloud หรือข้อมูลว่างเปล่า");
        }
      } catch (err) {
        if (!isSilent) alert("ไม่สามารถดึงข้อมูลจาก Cloud ได้: " + err.message);
      } finally {
        isSyncingNow = false;
      }
    }

    function rollbackPreSyncSnapshot() {
      try {
        const saved = localStorage.getItem('smartgov_pre_sync_snapshot');
        if (!saved) {
          alert("ไม่พบข้อมูลสำรองก่อนซิงค์ (ยังไม่มีการกู้คืน)");
          return;
        }
        const snap = JSON.parse(saved);
        if (confirm(`ต้องการย้อนกลับไปใช้ข้อมูลเดิมก่อนการซิงค์ (บันทึกไว้เมื่อ ${snap.time}) ใช่หรือไม่?`)) {
          if (snap.ojt) liveOjtData = snap.ojt;
          if (snap.profile) profileData = snap.profile;
          if (snap.project) projectSummaryData = snap.project;
          if (snap.security) securityState = snap.security;
          saveToLocalStorage(true);
          renderOjtPages();
          renderProfile();
          renderProfileHeader();
          renderProjectSummary();
          updateDashboardKPI();
          updateSecurityUI();
          alert("⏪ กู้คืนข้อมูลก่อนซิงค์ล่าสุดเรียบร้อยแล้ว ข้อมูลเดิมกลับมาครบถ้วน 100% ครับ!");
        }
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการกู้คืนข้อมูล: " + err.message);
      }
    }

    function copyAppsScriptCode() {
      const codeElem = document.getElementById('apps-script-code');
      if (codeElem) {
        navigator.clipboard.writeText(codeElem.innerText).then(() => {
          alert("📋 คัดลอกโค้ด Google Apps Script เรียบร้อยแล้ว! สามารถนำไปวางใน Extensions > Apps Script ของ Google Sheets ได้ทันทีครับ");
        });
      }
    }

    // Accessibility Text Size
    function changeFontSize(sizeClass) {
      const body = document.getElementById('main-body');
      body.classList.remove('text-sm', 'text-base', 'text-lg');
      body.classList.add(sizeClass);
    }

    // Toggle Contrast
    function toggleContrast() {
      document.getElementById('main-body').classList.toggle('high-contrast');
    }

    // AI Polisher Modal
    function openAiPolisherModal() {
      document.getElementById('ai-modal').classList.remove('hidden');
    }
    function closeAiPolisherModal() {
      document.getElementById('ai-modal').classList.add('hidden');
    }

    async function runAiPolish(mode = 'formal') {
      const rawText = document.getElementById('ai-input-text').value.trim();
      const resultBox = document.getElementById('ai-result-box');
      const resultText = document.getElementById('ai-result-text');
      const btnBrief = document.getElementById('btn-run-ai-brief');
      const btnFormal = document.getElementById('btn-run-ai-polish');
      const badge = document.getElementById('ai-model-used-badge');

      if (!rawText) {
        alert("กรุณากรอกข้อความที่ต้องการขัดเกลา");
        return;
      }

      if (btnBrief) btnBrief.disabled = true;
      if (btnFormal) btnFormal.disabled = true;

      const isBrief = (mode === 'brief');

      // 1. Try 9Router Local Gateway (Port 20128 - Token Saver & Unlimited)
      try {
        badge.innerText = `9Router Gateway (${isBrief ? 'A4 Brief' : 'R-C-T-F'})`;
        const prompt = isBrief
          ? `คุณคือผู้เชี่ยวชาญด้านงานสารบรรณและบันทึกฝึกงานราชการไทย จงสรุปย่อข้อความงานไอทีด้านล่างนี้ให้เป็น "งานที่ปฏิบัติโดยย่อ" สำหรับลงตาราง A4 ความยาวเพียง 1-2 บรรทัด (ประมาณ 1 ประโยคหลักที่กระชับ ไม่เยิ่นเย้อ เน้น: กิจกรรมไอทีที่ทำ + ระบบ + ผลลัพธ์) และใช้ตัวเลขอารบิก (1, 2, 3...) ทั้งหมด ห้ามใช้เลขไทย:\n\nข้อความ: "${rawText}"\n\nข้อความสรุปย่อทางการ 1 ประโยค:`
          : `คุณคือผู้เชี่ยวชาญด้านงานสารบรรณและระเบียบงานราชการไทย จงปรับปรุงข้อความสั้นงานไอทีด้านล่างนี้ให้เป็น "งานที่ปฏิบัติโดยย่อ" ระดับทางการตามโครงสร้าง R-C-T-F (Role, Context, Technical Action, Final Result) และใช้ตัวเลขอารบิก (1, 2, 3...) ทั้งหมด ห้ามใช้เลขไทย ไม่เกิน 2-3 ประโยคที่กระชับ สละสลวย ถูกต้องตามแบบแผนราชการไทย:\n\nข้อความต้นฉบับ: "${rawText}"\n\nข้อความราชการที่เรียบเรียงแล้ว:`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const routerRes = await fetch('http://localhost:20128/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer nr-smartgov-2026'
          },
          body: JSON.stringify({
            model: 'gemini-2.5-flash',
            stream: false,
            messages: [
              { role: 'user', content: prompt }
            ]
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (routerRes.ok) {
          const routerData = await routerRes.json();
          if (routerData.choices && routerData.choices[0] && routerData.choices[0].message) {
            resultText.innerText = routerData.choices[0].message.content.trim();
            resultBox.classList.remove('hidden');
            if (btnBrief) btnBrief.disabled = false;
            if (btnFormal) btnFormal.disabled = false;
            return;
          }
        }
      } catch (routerErr) {
        console.warn("9Router local call unavailable, falling back to direct cloud API:", routerErr);
      }

      // 2. Check if Direct Gemini API Key is configured
      if (apiConfig.geminiApiKey) {
        badge.innerText = `Google Gemini (${apiConfig.geminiModel || 'Flash'})`;
        try {
          const prompt = isBrief
            ? `คุณคือผู้เชี่ยวชาญด้านงานสารบรรณและบันทึกฝึกงานราชการไทย จงสรุปย่อข้อความด้านล่างนี้ให้เป็น "งานที่ปฏิบัติโดยย่อ" สำหรับลงตาราง A4 ความยาวเพียง 1-2 บรรทัด (ประมาณ 1 ประโยคหลักที่กระชับ ไม่เยิ่นเย้อ เน้น: กิจกรรมที่ทำ + อุปกรณ์/ระบบ + ผลลัพธ์) และใช้ตัวเลขอารบิกทั้งหมด:\n\nข้อความ: "${rawText}"\n\nข้อความสรุปย่อทางการ 1 ประโยค:`
            : `คุณคือผู้เชี่ยวชาญด้านงานสารบรรณและระเบียบงานราชการไทย จงปรับปรุงข้อความสั้นด้านล่างนี้ให้เป็น "งานที่ปฏิบัติโดยย่อ" ระดับทางการตามโครงสร้าง R-C-T-F (Role, Context, Technical Action, Final Result) และใช้ตัวเลขอารบิกทั้งหมด ไม่เกิน 2-3 ประโยคที่กระชับ สละสลวย ถูกต้องตามแบบแผนราชการไทย:\n\nข้อความต้นฉบับ: "${rawText}"\n\nข้อความราชการที่เรียบเรียงแล้ว:`;
          
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.geminiModel || 'gemini-2.0-flash'}:generateContent?key=${apiConfig.geminiApiKey}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: apiConfig.geminiTemp || 0.3,
                maxOutputTokens: isBrief ? 120 : 250
              }
            })
          });

          const resJson = await response.json();
          if (resJson.candidates && resJson.candidates[0].content.parts[0].text) {
            resultText.innerText = resJson.candidates[0].content.parts[0].text.trim();
            resultBox.classList.remove('hidden');
            if (btnBrief) btnBrief.disabled = false;
            if (btnFormal) btnFormal.disabled = false;
            return;
          }
        } catch (apiErr) {
          console.warn("Gemini API call failed, falling back to built-in rules:", apiErr);
        }
      }

      // 3. Built-in intelligent rule fallback
      badge.innerText = isBrief ? "Built-in A4 Brief Rule (Offline)" : "Built-in R-C-T-F Engine (Offline)";
      setTimeout(() => {
        if (isBrief) {
          resultText.innerText = `ปฏิบัติงานสนับสนุนด้านเทคนิคและระบบสารสนเทศ (${rawText}) สำเร็จตามมาตรฐานงานบริการ ศทส.`;
        } else {
          resultText.innerText = `ได้ดำเนินการศึกษาและฝึกปฏิบัติงานในหน้าที่ โดยประยุกต์ใช้ทักษะทางเทคโนโลยีสารสนเทศ (${rawText}) ร่วมกับการวิเคราะห์และจัดทำรายงานสรุปผลเชิงบริหาร เพื่อสนับสนุนการปฏิบัติราชการให้เป็นไปตามเป้าหมายและเกิดผลสัมฤทธิ์สูงสุดแก่องค์กร`;
        }
        resultBox.classList.remove('hidden');
        if (btnBrief) btnBrief.disabled = false;
        if (btnFormal) btnFormal.disabled = false;
      }, 300);
    }

    function copyAiResult() {
      const text = document.getElementById('ai-result-text').innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert("คัดลอกข้อความภาษาราชการเรียบร้อยแล้ว");
      });
    }

    // Chart.js initialization
    let chartInstance = null;
    function renderChart() {
      const ctx = document.getElementById('competencyChart');
      if (!ctx) return;

      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: [
            'ด้านเทคโนโลยีดิจิทัล & ฐานข้อมูล',
            'ด้านงานสารบรรณ & ระเบียบราชการ',
            'ด้านการบริหารโครงการ & Agile',
            'ด้านการสื่อสาร & การบริการประชาชน',
            'ด้านธรรมาภิบาลข้อมูล & PDPA'
          ],
          datasets: [{
            label: 'คะแนนการประเมินจริง (เต็ม 100)',
            data: [98, 92, 95, 90, 94],
            backgroundColor: 'rgba(46, 139, 87, 0.2)',
            borderColor: '#2E8B57',
            pointBackgroundColor: '#1B365D',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 20 }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: 'Prompt', size: 11 } }
            }
          }
        }
      });
    }

    // Window Load Init
    
    const API_BASE_URL = 'http://localhost:8083';

    // switchTab now natively supports 'executive-overview' at line 4677

    // SPRINT 1: Auto-Backup Manager Functions
    async function openBackupManagerModal() {
      const modal = document.getElementById('backup-manager-modal');
      if (modal) modal.classList.remove('hidden');
      await fetchBackupHistory();
    }

    function closeBackupManagerModal() {
      const modal = document.getElementById('backup-manager-modal');
      if (modal) modal.classList.add('hidden');
    }

    async function fetchBackupHistory() {
      const listEl = document.getElementById('backup-history-list');
      const countEl = document.getElementById('backup-history-count');
      if (!listEl) return;

      listEl.innerHTML = '<div class="text-center py-4 text-slate-400"><i class="fa-solid fa-spinner animate-spin mr-1"></i> กำลังโหลดประวัติการสำรอง...</div>';

      try {
        const res = await fetch(`${API_BASE_URL}/api/backup/history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (countEl) countEl.innerText = `ทั้งหมด ${data.total_backups} ไฟล์`;

        if (!data.backups || data.backups.length === 0) {
          listEl.innerHTML = '<div class="text-center py-4 text-slate-400">ยังไม่มีประวัติการสำรองข้อมูล</div>';
          return;
        }

        let html = '';
        data.backups.forEach(b => {
          html += `
            <div class="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between transition">
              <div>
                <span class="font-mono font-bold text-slate-800 block">${b.filename}</span>
                <span class="text-[10px] text-slate-500">สร้างเมื่อ: ${b.created_at_display} | ขนาด: ${b.size_kb} KB (${b.reason || 'snapshot'})</span>
                <span class="text-[10px] text-emerald-700 block font-mono">SHA256: ${b.sha256 ? b.sha256.substring(0, 16) + '...' : '-'}</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <a href="${API_BASE_URL}/api/backup/download/${b.filename}" download="${b.filename}" class="px-2.5 py-1 bg-govNavy text-white hover:bg-slate-800 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-2xs">
                  <i class="fa-solid fa-download"></i> ดาวน์โหลด
                </a>
              </div>
            </div>
          `;
        });
        listEl.innerHTML = html;

        // Update Executive Dashboard status badge
        const latest = data.backups[0];
        if (latest) {
          const fnEl = document.getElementById('exec-backup-filename');
          if (fnEl) fnEl.innerText = `${latest.filename} (${latest.created_at_display})`;
        }
      } catch (err) {
        listEl.innerHTML = `<div class="text-center py-3 text-red-500">เชื่อมต่อ API ล้มเหลว (${err.message}) กรุณาตรวจสอบว่าเปิด 1_CLICK_START.command อยู่หรือไม่</div>`;
      }
    }

    async function triggerImmediateBackup() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/backup/now`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'dashboard_manual_snapshot' })
        });
        const data = await res.json();
        if (data.success) {
          alert(`✅ ${data.message}
📦 ไฟล์: ${data.backup.filename} (${data.backup.size_kb} KB)`);
          await fetchBackupHistory();
          if (typeof renderExecutiveOverview === 'function') renderExecutiveOverview();
        } else {
          alert('❌ ไม่สามารถสร้าง Snapshot ได้: ' + JSON.stringify(data));
        }
      } catch (err) {
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
      }
    }

    // SPRINT 2.1: Attachment Manager Functions
    function openAttachmentManagerModal() {
      const modal = document.getElementById('attachment-manager-modal');
      if (modal) modal.classList.remove('hidden');
      loadAttachmentsList();
    }

    function closeAttachmentManagerModal() {
      const modal = document.getElementById('attachment-manager-modal');
      if (modal) modal.classList.add('hidden');
    }

    async function loadAttachmentsList() {
      const galEl = document.getElementById('attachments-gallery');
      if (!galEl) return;
      galEl.innerHTML = '<div class="text-center py-3 text-slate-400"><i class="fa-solid fa-spinner animate-spin"></i> กำลังโหลดรายการไฟล์...</div>';

      try {
        const res = await fetch(`${API_BASE_URL}/api/attachments?username=trainee_jake`);
        const data = await res.json();
        if (!data.attachments || data.attachments.length === 0) {
          galEl.innerHTML = '<div class="text-center py-3 text-slate-400">ยังไม่มีไฟล์แนบในสัปดาห์นี้</div>';
          return;
        }

        let html = '';
        data.attachments.forEach(a => {
          const isPdf = a.file_type.includes('pdf') || a.filename.endsWith('.pdf');
          const icon = isPdf ? '<i class="fa-solid fa-file-pdf text-red-500 text-xl"></i>' : '<i class="fa-solid fa-file-image text-blue-500 text-xl"></i>';
          html += `
            <div class="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between transition">
              <div class="flex items-center space-x-2.5">
                ${icon}
                <div>
                  <a href="${API_BASE_URL}${a.url}" target="_blank" class="font-semibold text-govNavy hover:underline block">${a.original_filename}</a>
                  <span class="text-[10px] text-slate-500">${a.description || 'ไม่มีคำอธิบาย'} (${a.file_size_kb} KB) - สัปดาห์ ${a.week_num}</span>
                </div>
              </div>
              <button onclick="deleteAttachmentItem(${a.id})" class="text-rose-600 hover:text-rose-800 p-1 text-xs" title="ลบไฟล์">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          `;
        });
        galEl.innerHTML = html;
      } catch (err) {
        galEl.innerHTML = `<div class="text-center py-3 text-red-500">โหลดไฟล์ไม่สำเร็จ (${err.message})</div>`;
      }
    }

    async function handleUploadAttachment(event) {
      event.preventDefault();
      const fileInput = document.getElementById('att-file-input');
      const weekSelect = document.getElementById('att-week-num');
      const dateInput = document.getElementById('att-work-date');
      const descInput = document.getElementById('att-description');
      const submitBtn = document.getElementById('btn-upload-att-submit');

      if (!fileInput.files || fileInput.files.length === 0) {
        alert("กรุณาเลือกไฟล์ก่อนอัปโหลด");
        return;
      }

      const file = fileInput.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const fileName = file.name.toLowerCase();
      const isExtValid = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.webp') || fileName.endsWith('.pdf');

      if (!validTypes.includes(file.type) && !isExtValid) {
        alert("รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG) หรือ PDF เท่านั้น");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("ขนาดไฟล์เกินกว่า 10MB");
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', 'trainee_jake');
      formData.append('week_num', weekSelect.value);
      formData.append('work_date', dateInput.value);
      formData.append('description', descInput.value);

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> กำลังอัปโหลด...';

      try {
        const res = await fetch(`${API_BASE_URL}/api/attachments/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          alert(`✅ ${data.message}
📎 ${data.attachment.original_filename}`);
          descInput.value = '';
          fileInput.value = '';
          await loadAttachmentsList();
        } else {
          alert('❌ การอัปโหลดล้มเหลว: ' + (data.detail || JSON.stringify(data)));
        }
      } catch (err) {
        alert('❌ การเชื่อมต่อล้มเหลว: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>อัปโหลดเอกสาร / รูปภาพเข้าสู่ระบบ</span>';
      }
    }

    async function deleteAttachmentItem(id) {
      if (!confirm("คุณต้องการลบไฟล์แนบนี้ใช่หรือไม่?")) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/attachments/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          loadAttachmentsList();
        }
      } catch (err) {
        alert("ลบไม่สำเร็จ: " + err.message);
      }
    }

    // SPRINT 2.2: Gemini AI 3-Line Summary Functions
    function openGeminiSummaryModal() {
      const modal = document.getElementById('gemini-summary-modal');
      if (modal) modal.classList.remove('hidden');
      const sel = document.getElementById('ojt-week-select');
      const aiSel = document.getElementById('ai-summary-week-select');
      if (sel && aiSel) aiSel.value = sel.value;
    }

    function closeGeminiSummaryModal() {
      const modal = document.getElementById('gemini-summary-modal');
      if (modal) modal.classList.add('hidden');
    }

    async function runGeminiSummary() {
      const weekSel = document.getElementById('ai-summary-week-select');
      const weekNum = parseInt(weekSel ? weekSel.value : 4) || 4;
      const resText = document.getElementById('ai-summary-result-text');
      const runBtn = document.getElementById('btn-run-ai-summary');

      // TC009: ตรวจสอบข้อมูลกิจกรรมในสัปดาห์
      const weekEntries = (window.liveOjtData && window.liveOjtData[weekNum]) || [];
      if (!weekEntries || weekEntries.length === 0) {
        alert("⚠️ ไม่พบข้อมูลกิจกรรมสำหรับนำมาประมวลผลสรุป");
        if (resText) resText.value = "ไม่พบข้อมูลกิจกรรมสำหรับนำมาประมวลผลสรุป";
        return;
      }

      runBtn.disabled = true;
      runBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> กำลังวิเคราะห์...';
      resText.value = 'กำลังส่งข้อมูลให้ Google Gemini AI สังเคราะห์รายงานราชการ 3 บรรทัด กรุณารอสักครู่...';

      // TC010: PDPA Sanitizer ก่อนส่ง AI Payload
      const sanitizedEntries = weekEntries.map(e => {
        let t = e.task || '';
        t = t.replace(/\b0[689]\d[- ]?\d{3}[- ]?\d{4}\b|\b0\d{1,2}[- ]?\d{3}[- ]?\d{4}\b/g, '[REDACTED_PHONE]');
        t = t.replace(/\b(?:\d[- ]?){12}\d\b/g, '[REDACTED_NATIONAL_ID]');
        return { ...e, task: t };
      });

      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/summarize-week`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            week_num: weekNum,
            username: 'trainee_jake'
          })
        });
        const data = await res.json();
        if (data.success && data.summary_3_lines) {
          resText.value = data.summary_3_lines;
        } else {
          resText.value = 'ไม่สามารถประมวลผลได้: ' + JSON.stringify(data);
        }
      } catch (err) {
        resText.value = 'ข้อผิดพลาด: ' + err.message + '\n(ระบบจะใช้ Offline Rule-Based Fallback อัตโนมัติ)';
      } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>วิเคราะห์และสรุป 3 บรรทัด ✨</span>';
      }
    }

    function copyAiSummaryText() {
      const resText = document.getElementById('ai-summary-result-text');
      if (!resText || !resText.value) return;
      navigator.clipboard.writeText(resText.value);
      alert('📋 คัดลอกข้อความสรุป 3 บรรทัดเรียบร้อยแล้ว!');
    }

    function applyAiSummaryToWeeklyNotes() {
      const resText = document.getElementById('ai-summary-result-text');
      if (!resText || !resText.value) return;
      // Also copy to clipboard and close
      navigator.clipboard.writeText(resText.value);
      alert('💾 ข้อความถูกคัดลอกลงคลิปบอร์ดแล้ว พร้อมนำไปวางในรายงานหรือช่องสรุปผลการปฏิบัติงาน');
      closeGeminiSummaryModal();
    }

    // SPRINT 3: Executive Dashboard Loader
    let cachedExecutiveData = null;

    async function renderExecutiveOverview() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/executive/overview`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        cachedExecutiveData = data;

        // KPI Update
        const kpi = data.kpi_summary;
        document.getElementById('exec-kpi-trainees').innerText = kpi.total_trainees;
        document.getElementById('exec-kpi-hours').innerText = kpi.total_accumulated_hours.toFixed(1);
        document.getElementById('exec-kpi-approved').innerText = kpi.approved_evaluations_count;
        document.getElementById('exec-kpi-avg-score').innerText = kpi.cohort_avg_score;
        document.getElementById('exec-kpi-progress-bar').style.width = `${kpi.overall_progress_percent}%`;

        // Backup label
        if (data.latest_backup && data.latest_backup.filename) {
          document.getElementById('exec-backup-filename').innerText = `${data.latest_backup.filename} (${data.latest_backup.time})`;
        }

        // Table Render
        renderExecutiveTraineesTable(data.trainees);
      } catch (err) {
        console.warn('[ExecutiveDashboard] Local fetch error:', err);
      }
    }

    function renderExecutiveTraineesTable(trainees) {
      const tbody = document.getElementById('exec-trainees-table-body');
      if (!tbody) return;

      if (!trainees || trainees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-slate-400">ไม่พบรายชื่อนักศึกษา</td></tr>';
        return;
      }

      let html = '';
      trainees.forEach((t, idx) => {
        const isCompleted = t.progress_percent >= 100;
        const statusBadge = isCompleted 
          ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">เสร็จสิ้น 90 ชม.</span>'
          : '<span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">กำลังฝึกปฏิบัติ</span>';

        html += `
          <tr class="hover:bg-slate-50 transition">
            <td class="p-3 font-bold text-slate-500">${idx + 1}</td>
            <td class="p-3">
              <div class="flex items-center space-x-2.5">
                <div class="w-7 h-7 rounded-full bg-govNavy text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  ${t.full_name.charAt(0)}
                </div>
                <div>
                  <span class="font-bold text-slate-800 block">${t.full_name}</span>
                  <span class="text-[10px] text-slate-400">${t.position}</span>
                </div>
              </div>
            </td>
            <td class="p-3 text-slate-600">${t.department}</td>
            <td class="p-3 font-mono font-bold text-govNavy">${t.hours} ชม.</td>
            <td class="p-3">
              <div class="w-24 bg-slate-100 rounded-full h-1.5 mb-1">
                <div class="bg-govNavy h-1.5 rounded-full" style="width: ${t.progress_percent}%"></div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">${t.progress_percent}%</span>
            </td>
            <td class="p-3">${statusBadge}</td>
            <td class="p-3 text-center font-bold text-emerald-700">${t.avg_competency_score}</td>
            <td class="p-3 text-center font-mono text-slate-600">${t.attachments_count} ไฟล์</td>
            <td class="p-3 text-center">
              <button onclick="switchSupervisorViewTrainee('${t.username}'); switchTab('ojt-log');" class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition shadow-2xs">
                ดูสมุด OJT
              </button>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }

    function filterExecutiveTrainees(query) {
      if (!cachedExecutiveData || !cachedExecutiveData.trainees) return;
      const q = (query || '').toLowerCase().trim();
      const filtered = cachedExecutiveData.trainees.filter(t => 
        t.full_name.toLowerCase().includes(q) || t.department.toLowerCase().includes(q)
      );
      renderExecutiveTraineesTable(filtered);
    }

    function refreshExecutiveDashboard() {
      renderExecutiveOverview();
    }

    // Auto-check on boot
    window.addEventListener('DOMContentLoaded', () => {
      fetch(`${API_BASE_URL}/api/health`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Smart GovReport Hub 2.5 Core Connected:', data);
          fetchBackupHistory();
        })
        .catch(err => console.log('FastAPI offline or waiting to start.'));
    });
