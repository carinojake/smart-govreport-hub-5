// Module: 09-gov-docs.js (Smart GovReport Hub 2.5)
    // =========================================================================
    // PROJECT MANAGEMENT & CANVAS (TAB 3) ENGINE
    // =========================================================================
    function renderProjectSummary() {
      // Header Toolbar Titles
      const tabTitleEl = document.getElementById('pj-tab-header-title');
      if (tabTitleEl) tabTitleEl.innerText = projectSummaryData.headerTitle || 'รายงานสรุปแผนงานและผลลัพธ์โครงการ (Project Canvas & 12 Steps)';

      const tabSubEl = document.getElementById('pj-tab-header-subtitle');
      if (tabSubEl) tabSubEl.innerText = projectSummaryData.headerSubtitle || 'โครงการส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ';

      // Header Info on A4 Paper
      const titleEl = document.getElementById('pj-report-title');
      if (titleEl) titleEl.innerText = projectSummaryData.projectTitle || '';

      const orgEl = document.getElementById('pj-report-org');
      if (orgEl) orgEl.innerText = projectSummaryData.orgResponsible || '';

      const statusEl = document.getElementById('pj-report-status');
      if (statusEl) statusEl.innerText = projectSummaryData.statusBadge || 'สถานะ: ดำเนินการแล้วเสร็จ';

      // Exec Summary
      const execEl = document.getElementById('pj-report-exec-summary');
      if (execEl) execEl.innerText = projectSummaryData.execSummary || '';

      // Canvas 6 Boxes
      const c = projectSummaryData.canvas || {};
      const cProb = document.getElementById('pj-canvas-problem');
      if (cProb) cProb.innerText = c.problem || '-';
      const cObj = document.getElementById('pj-canvas-objective');
      if (cObj) cObj.innerText = c.objective || '-';
      const cTgt = document.getElementById('pj-canvas-target');
      if (cTgt) cTgt.innerText = c.target || '-';
      const cAct = document.getElementById('pj-canvas-activities');
      if (cAct) cAct.innerText = c.activities || '-';
      const cKpi = document.getElementById('pj-canvas-kpis');
      if (cKpi) cKpi.innerText = c.kpis || '-';
      const cRaci = document.getElementById('pj-canvas-raci');
      if (cRaci) cRaci.innerText = c.raci || '-';

      // 12 Steps Table
      const tbody = document.getElementById('pj-steps-tbody');
      if (tbody) {
        tbody.innerHTML = '';
        const steps = projectSummaryData.steps || [];
        steps.forEach((s, idx) => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-50 transition';
          tr.innerHTML = `
            <td class="border border-slate-300 p-1.5 text-center font-bold text-slate-700">${s.no || (idx + 1)}</td>
            <td class="border border-slate-300 p-1.5 font-medium text-slate-800">${s.title || '-'}</td>
            <td class="border border-slate-300 p-1.5 text-center">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${s.status && s.status.includes('เสร็จ') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">${s.status || 'ดำเนินการแล้วเสร็จ'}</span>
            </td>
            <td class="border border-slate-300 p-1.5 text-slate-600">${s.owner || '-'}</td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Reporter
      const repEl = document.getElementById('pj-report-reporter');
      if (repEl) repEl.innerText = projectSummaryData.reporterName || profileData.traineeName || 'นายเจค (นิติพัฒน์ คุ้มวงษ์)';
      const posEl = document.getElementById('pj-report-pos');
      if (posEl) posEl.innerText = projectSummaryData.reporterPos || 'นักวิชาการคอมพิวเตอร์ / ผู้ดูแลระบบคลังข้อมูล';
    }

    function openProjectSummaryEditModal(focusSection) {
      const hTitleIn = document.getElementById('edit-pj-header-title');
      if (hTitleIn) hTitleIn.value = projectSummaryData.headerTitle || 'รายงานสรุปแผนงานและผลลัพธ์โครงการ (Project Canvas & 12 Steps)';

      const hSubIn = document.getElementById('edit-pj-header-subtitle');
      if (hSubIn) hSubIn.value = projectSummaryData.headerSubtitle || 'โครงการส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ';

      const titleIn = document.getElementById('edit-pj-title');
      if (titleIn) titleIn.value = projectSummaryData.projectTitle || '';

      const statusIn = document.getElementById('edit-pj-status');
      if (statusIn) statusIn.value = projectSummaryData.statusBadge || 'สถานะ: ดำเนินการแล้วเสร็จ';

      const orgIn = document.getElementById('edit-pj-org');
      if (orgIn) orgIn.value = projectSummaryData.orgResponsible || '';

      const repIn = document.getElementById('edit-pj-reporter');
      if (repIn) repIn.value = projectSummaryData.reporterName || profileData.traineeName || '';

      const posIn = document.getElementById('edit-pj-pos');
      if (posIn) posIn.value = projectSummaryData.reporterPos || '';

      const execIn = document.getElementById('edit-pj-exec-summary');
      if (execIn) execIn.value = projectSummaryData.execSummary || '';

      const c = projectSummaryData.canvas || {};
      const probIn = document.getElementById('edit-pj-canvas-problem');
      if (probIn) probIn.value = c.problem || '';

      const objIn = document.getElementById('edit-pj-canvas-objective');
      if (objIn) objIn.value = c.objective || '';

      const tgtIn = document.getElementById('edit-pj-canvas-target');
      if (tgtIn) tgtIn.value = c.target || '';

      const actIn = document.getElementById('edit-pj-canvas-activities');
      if (actIn) actIn.value = c.activities || '';

      const kpiIn = document.getElementById('edit-pj-canvas-kpis');
      if (kpiIn) kpiIn.value = c.kpis || '';

      const raciIn = document.getElementById('edit-pj-canvas-raci');
      if (raciIn) raciIn.value = c.raci || '';

      // Build 12 editable rows in modal
      const stepsTbody = document.getElementById('edit-pj-steps-table-body');
      if (stepsTbody) {
        stepsTbody.innerHTML = '';
        const steps = projectSummaryData.steps || [];
        steps.forEach((s, idx) => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-50';
          tr.innerHTML = `
            <td class="p-2 text-center font-bold text-slate-700">${s.no || (idx + 1)}</td>
            <td class="p-1.5">
              <input type="text" id="step-input-title-${idx}" value="${s.title || ''}" class="w-full p-1.5 border border-slate-300 rounded text-xs">
            </td>
            <td class="p-1.5">
              <input type="text" id="step-input-status-${idx}" value="${s.status || ''}" class="w-full p-1.5 border border-slate-300 rounded text-xs text-center">
            </td>
            <td class="p-1.5">
              <input type="text" id="step-input-owner-${idx}" value="${s.owner || ''}" class="w-full p-1.5 border border-slate-300 rounded text-xs">
            </td>
          `;
          stepsTbody.appendChild(tr);
        });
      }

      const modal = document.getElementById('project-summary-edit-modal');
      if (modal) modal.classList.remove('hidden');

      if (focusSection === 'exec') {
        setTimeout(() => { const el = document.getElementById('edit-pj-exec-summary'); if (el) el.focus(); }, 150);
      } else if (focusSection === 'canvas') {
        setTimeout(() => { const el = document.getElementById('edit-pj-canvas-problem'); if (el) el.focus(); }, 150);
      }
    }

    function closeProjectSummaryEditModal() {
      const modal = document.getElementById('project-summary-edit-modal');
      if (modal) modal.classList.add('hidden');
    }

    function saveProjectSummaryData() {
      const hTitleIn = document.getElementById('edit-pj-header-title');
      if (hTitleIn) projectSummaryData.headerTitle = hTitleIn.value.trim();

      const hSubIn = document.getElementById('edit-pj-header-subtitle');
      if (hSubIn) projectSummaryData.headerSubtitle = hSubIn.value.trim();

      const titleIn = document.getElementById('edit-pj-title');
      if (titleIn) projectSummaryData.projectTitle = titleIn.value.trim();

      const statusIn = document.getElementById('edit-pj-status');
      if (statusIn) projectSummaryData.statusBadge = statusIn.value.trim();

      const orgIn = document.getElementById('edit-pj-org');
      if (orgIn) projectSummaryData.orgResponsible = orgIn.value.trim();

      const repIn = document.getElementById('edit-pj-reporter');
      if (repIn) projectSummaryData.reporterName = repIn.value.trim();

      const posIn = document.getElementById('edit-pj-pos');
      if (posIn) projectSummaryData.reporterPos = posIn.value.trim();

      const execIn = document.getElementById('edit-pj-exec-summary');
      if (execIn) projectSummaryData.execSummary = execIn.value.trim();

      if (!projectSummaryData.canvas) projectSummaryData.canvas = {};
      const probIn = document.getElementById('edit-pj-canvas-problem');
      if (probIn) projectSummaryData.canvas.problem = probIn.value.trim();

      const objIn = document.getElementById('edit-pj-canvas-objective');
      if (objIn) projectSummaryData.canvas.objective = objIn.value.trim();

      const tgtIn = document.getElementById('edit-pj-canvas-target');
      if (tgtIn) projectSummaryData.canvas.target = tgtIn.value.trim();

      const actIn = document.getElementById('edit-pj-canvas-activities');
      if (actIn) projectSummaryData.canvas.activities = actIn.value.trim();

      const kpiIn = document.getElementById('edit-pj-canvas-kpis');
      if (kpiIn) projectSummaryData.canvas.kpis = kpiIn.value.trim();

      const raciIn = document.getElementById('edit-pj-canvas-raci');
      if (raciIn) projectSummaryData.canvas.raci = raciIn.value.trim();

      // Read steps
      const steps = projectSummaryData.steps || [];
      steps.forEach((s, idx) => {
        const titleIn = document.getElementById(`step-input-title-${idx}`);
        const statusIn = document.getElementById(`step-input-status-${idx}`);
        const ownerIn = document.getElementById(`step-input-owner-${idx}`);
        if (titleIn) s.title = titleIn.value.trim();
        if (statusIn) s.status = statusIn.value.trim();
        if (ownerIn) s.owner = ownerIn.value.trim();
      });

      saveToLocalStorage();
      renderProjectSummary();
      closeProjectSummaryEditModal();
    }

    function resetProjectSummaryDefaults() {
      if (confirm('ต้องการคืนค่าเริ่มต้นสำหรับรายงาน Project Canvas & 12 Steps ใช่หรือไม่?')) {
        projectSummaryData = JSON.parse(JSON.stringify(initialProjectSummaryData));
        saveToLocalStorage();
        renderProjectSummary();
        alert('คืนค่าเริ่มต้นเรียบร้อยแล้ว');
      }
    }

    function toggleDirectEditProjectSummary() {
      isDirectEditMode = !isDirectEditMode;
      const paper = document.getElementById('pj-paper-container');
      const btn = document.getElementById('btn-toggle-direct-edit');
      const label = document.getElementById('label-direct-edit');

      if (!paper) return;

      if (isDirectEditMode) {
        paper.setAttribute('contenteditable', 'true');
        paper.classList.add('ring-4', 'ring-amber-400', 'bg-amber-50/20');
        if (btn) {
          btn.className = 'px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow transition flex items-center space-x-1 animate-pulse';
        }
        if (label) label.innerText = '💾 บันทึกการพิมพ์สด (Direct Save)';
      } else {
        // Save direct edits into state
        const titleEl = document.getElementById('pj-report-title');
        if (titleEl) projectSummaryData.projectTitle = titleEl.innerText.trim();

        const orgEl = document.getElementById('pj-report-org');
        if (orgEl) projectSummaryData.orgResponsible = orgEl.innerText.trim();

        const execEl = document.getElementById('pj-report-exec-summary');
        if (execEl) projectSummaryData.execSummary = execEl.innerText.trim();

        const cProb = document.getElementById('pj-canvas-problem');
        if (cProb && projectSummaryData.canvas) projectSummaryData.canvas.problem = cProb.innerText.trim();

        const cObj = document.getElementById('pj-canvas-objective');
        if (cObj && projectSummaryData.canvas) projectSummaryData.canvas.objective = cObj.innerText.trim();

        const cTgt = document.getElementById('pj-canvas-target');
        if (cTgt && projectSummaryData.canvas) projectSummaryData.canvas.target = cTgt.innerText.trim();

        const cAct = document.getElementById('pj-canvas-activities');
        if (cAct && projectSummaryData.canvas) projectSummaryData.canvas.activities = cAct.innerText.trim();

        const cKpi = document.getElementById('pj-canvas-kpis');
        if (cKpi && projectSummaryData.canvas) projectSummaryData.canvas.kpis = cKpi.innerText.trim();

        const cRaci = document.getElementById('pj-canvas-raci');
        if (cRaci && projectSummaryData.canvas) projectSummaryData.canvas.raci = cRaci.innerText.trim();

        paper.setAttribute('contenteditable', 'false');
        paper.classList.remove('ring-4', 'ring-amber-400', 'bg-amber-50/20');
        if (btn) {
          btn.className = 'px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1';
        }
        if (label) label.innerText = 'พิมพ์แก้บนหน้ากระดาษ';

        saveToLocalStorage();
        alert('บันทึกข้อความที่แก้ไขสดเรียบร้อยแล้ว');
      }
    }

    // =========================================================================
    // TAB 4: OFFICIAL MEMORANDUM CONTROLLER
    // =========================================================================
    function renderOfficialMemo() {
      const session = getActiveSession();
      const editBtn = document.getElementById('btn-edit-official-memo');
      if (editBtn) {
        if (session && (session.role === 'supervisor' || session.role === 'staff' || session.role === 'advisor')) {
          editBtn.classList.add('hidden'); // Supervisor / Inspector mode: read-only
        } else {
          editBtn.classList.remove('hidden');
        }
      }

      const orgEl = document.getElementById('memo-org-name');
      if (orgEl) orgEl.innerText = officialMemoData.orgName || (profileData ? profileData.orgName : '');

      const docNoEl = document.getElementById('memo-doc-no');
      if (docNoEl) docNoEl.innerText = officialMemoData.docNo || 'ยธ 0204 / ว 01 / 2569';

      const dateEl = document.getElementById('memo-date');
      if (dateEl) dateEl.innerText = officialMemoData.date || '3 กันยายน 2569';

      const subEl = document.getElementById('memo-subject');
      if (subEl) subEl.innerText = officialMemoData.subject || 'รายงานผลการดำเนินงานโครงการพัฒนาระบบ Smart GovReport Hub 2.5 (เวอร์ชัน 1.0)';

      const recEl = document.getElementById('memo-recipient');
      if (recEl) recEl.innerText = officialMemoData.recipient || 'ผู้อำนวยการกลุ่มงานสารสนเทศและพัฒนาระบบ / ผู้ควบคุมการฝึกงาน';

      const originTextEl = document.getElementById('memo-origin-text');
      if (originTextEl) originTextEl.innerText = officialMemoData.origin || '';

      const factsIntroEl = document.getElementById('memo-facts-intro');
      if (factsIntroEl) factsIntroEl.innerText = officialMemoData.factsIntro || '';

      // Real accumulated hours calculated from liveOjtData
      let totalHours = 0;
      Object.keys(liveOjtData).forEach(w => {
        if (liveOjtData[w]) {
          liveOjtData[w].forEach(r => { totalHours += (parseFloat(r.hours) || 0); });
        }
      });
      const factHoursEl = document.getElementById('memo-fact-hours');
      if (factHoursEl) factHoursEl.innerText = totalHours.toFixed(1);

      const considerIntroEl = document.getElementById('memo-considerations-intro');
      if (considerIntroEl) considerIntroEl.innerText = officialMemoData.considerationsIntro || '';

      const signNameEl = document.getElementById('memo-sign-name');
      if (signNameEl) signNameEl.innerText = officialMemoData.signName || (profileData ? profileData.traineeName : 'นายนิติพัฒน์ คุ้มวงษ์');

      const signPosEl = document.getElementById('memo-sign-pos');
      if (signPosEl) signPosEl.innerText = officialMemoData.signPos || 'ผู้จัดทำรายงาน / นักวิชาการคอมพิวเตอร์';
    }

    function openOfficialMemoEditModal() {
      document.getElementById('edit-memo-org').value = officialMemoData.orgName || (profileData ? profileData.orgName : '');
      document.getElementById('edit-memo-docno').value = officialMemoData.docNo || 'ยธ 0204 / ว 01 / 2569';
      document.getElementById('edit-memo-date').value = officialMemoData.date || '3 กันยายน 2569';
      document.getElementById('edit-memo-subject').value = officialMemoData.subject || '';
      document.getElementById('edit-memo-recipient').value = officialMemoData.recipient || '';
      document.getElementById('edit-memo-origin').value = officialMemoData.origin || '';
      document.getElementById('edit-memo-facts-intro').value = officialMemoData.factsIntro || '';
      document.getElementById('edit-memo-considerations-intro').value = officialMemoData.considerationsIntro || '';
      document.getElementById('edit-memo-sign-name').value = officialMemoData.signName || (profileData ? profileData.traineeName : '');
      document.getElementById('edit-memo-sign-pos').value = officialMemoData.signPos || 'ผู้จัดทำรายงาน / นักวิชาการคอมพิวเตอร์';

      document.getElementById('official-memo-edit-modal').classList.remove('hidden');
    }

    function closeOfficialMemoEditModal() {
      document.getElementById('official-memo-edit-modal').classList.add('hidden');
    }

    function saveOfficialMemoData() {
      officialMemoData.orgName = document.getElementById('edit-memo-org').value.trim();
      officialMemoData.docNo = document.getElementById('edit-memo-docno').value.trim();
      officialMemoData.date = document.getElementById('edit-memo-date').value.trim();
      officialMemoData.subject = document.getElementById('edit-memo-subject').value.trim();
      officialMemoData.recipient = document.getElementById('edit-memo-recipient').value.trim();
      officialMemoData.origin = document.getElementById('edit-memo-origin').value.trim();
      officialMemoData.factsIntro = document.getElementById('edit-memo-facts-intro').value.trim();
      officialMemoData.considerationsIntro = document.getElementById('edit-memo-considerations-intro').value.trim();
      officialMemoData.signName = document.getElementById('edit-memo-sign-name').value.trim();
      officialMemoData.signPos = document.getElementById('edit-memo-sign-pos').value.trim();

      saveToLocalStorage();
      renderOfficialMemo();
      closeOfficialMemoEditModal();
      alert('✓ บันทึกข้อมูลแบบร่างบันทึกข้อความเรียบร้อยแล้ว');
    }

    function updateSidebarPortfolioSubtitle() {
      const session = getActiveSession();
      const subEl = document.getElementById('sidebar-portfolio-subtitle');
      if (!subEl) return;
      let activeUser = '';
      if (session && (session.role === 'supervisor' || session.role === 'staff' || session.role === 'advisor')) {
        activeUser = currentViewTrainee || 'trainee_jake';
      } else if (session) {
        activeUser = session.username || '';
      }
      if (activeUser.toLowerCase() === 'trainee_jake') {
        subEl.innerText = 'คลังผลงานและประวัติ 13 ปี';
      } else {
        subEl.innerText = 'แฟ้มสะสมผลงานและสมรรถนะ';
      }
    }

    // =========================================================================
    // TAB 5: PORTFOLIO MASTER SUMMARY CONTROLLER
    // =========================================================================
    function renderPortfolio() {
      updateSidebarPortfolioSubtitle();
      const session = getActiveSession();
      const editBtn = document.getElementById('btn-edit-portfolio');
      if (editBtn) {
        if (session && (session.role === 'supervisor' || session.role === 'staff' || session.role === 'advisor')) {
          editBtn.classList.add('hidden'); // Supervisor / Inspector mode: read-only
        } else {
          editBtn.classList.remove('hidden');
        }
      }

      const nameEl = document.getElementById('pf-trainee-name');
      if (nameEl) nameEl.innerText = portfolioData.traineeName || (profileData ? profileData.traineeName : 'นายเจค (นิติพัฒน์ คุ้มวงษ์)');

      const headlineEl = document.getElementById('pf-headline');
      if (headlineEl) headlineEl.innerText = portfolioData.headline || '';

      const trackBadgeEl = document.getElementById('pf-track-badge');
      if (trackBadgeEl) trackBadgeEl.innerText = portfolioData.trackBadge || '✓ Advanced Track (BB 211)';

      // Calculate real total accumulated hours
      let totalHours = 0;
      Object.keys(liveOjtData).forEach(w => {
        if (liveOjtData[w]) {
          liveOjtData[w].forEach(r => { totalHours += (parseFloat(r.hours) || 0); });
        }
      });
      const hoursBadgeEl = document.getElementById('pf-hours-badge');
      if (hoursBadgeEl) {
        if (totalHours >= 90) {
          hoursBadgeEl.innerText = `✓ OJT ${totalHours.toFixed(1)} ชม. สมบูรณ์`;
          hoursBadgeEl.className = 'px-2.5 py-0.5 bg-white/10 rounded-full text-[11px] text-yellow-300';
        } else {
          hoursBadgeEl.innerText = `⏳ OJT สะสม ${totalHours.toFixed(1)} / 90 ชม.`;
          hoursBadgeEl.className = 'px-2.5 py-0.5 bg-white/10 rounded-full text-[11px] text-amber-300';
        }
      }

      // Work Experience Container
      const expContainer = document.getElementById('pf-experience-container');
      if (expContainer) {
        expContainer.innerHTML = '';
        const exps = portfolioData.experiences || [];
        if (exps.length === 0) {
          expContainer.innerHTML = `
            <div class="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
              <p>ยังไม่มีข้อมูลประสบการณ์ทำงาน (สามารถกดปุ่ม "แก้ไข Portfolio" ด้านบนเพื่อเพิ่มประวัติได้)</p>
            </div>
          `;
        } else {
          const borderColors = ['border-govNavy', 'border-govTeal', 'border-slate-400', 'border-purple-600'];
          exps.forEach((exp, idx) => {
            const bColor = borderColors[idx % borderColors.length];
            const div = document.createElement('div');
            div.className = `p-3 bg-slate-50 rounded-xl border-l-4 ${bColor}`;
            div.innerHTML = `
              <div class="flex justify-between font-bold text-slate-800">
                <span>${exp.role || ''} | ${exp.org || ''}</span>
                <span class="text-slate-500 font-normal">${exp.period || ''}</span>
              </div>
              <p class="text-slate-600 mt-1">${exp.desc || ''}</p>
            `;
            expContainer.appendChild(div);
          });
        }
      }

      // Skills Grid
      const skillsGrid = document.getElementById('pf-skills-grid');
      if (skillsGrid) {
        const s = portfolioData.skills || {
          data: "Excel, Google Sheets, Dashboard",
          code: "Web App, HTML5, JavaScript",
          gov: "e-Saraban, ThaiD, Data Governance",
          ai: "Prompt R-C-T-F, Agile, Project Canvas"
        };
        skillsGrid.innerHTML = `
          <div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-center">
            <span class="font-bold text-govNavy block">Data & Excel</span>
            <p class="text-[11px] text-slate-500 mt-0.5">${s.data || '-'}</p>
          </div>
          <div class="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-center">
            <span class="font-bold text-govTeal block">Programming / Tools</span>
            <p class="text-[11px] text-slate-500 mt-0.5">${s.code || '-'}</p>
          </div>
          <div class="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 text-center">
            <span class="font-bold text-purple-700 block">Gov Systems</span>
            <p class="text-[11px] text-slate-500 mt-0.5">${s.gov || '-'}</p>
          </div>
          <div class="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 text-center">
            <span class="font-bold text-amber-700 block">AI & Project</span>
            <p class="text-[11px] text-slate-500 mt-0.5">${s.ai || '-'}</p>
          </div>
        `;
      }

      // Work Vision
      const visionEl = document.getElementById('pf-vision-text');
      if (visionEl) visionEl.innerText = `"${portfolioData.vision || ''}"`;
    }

    function openPortfolioEditModal() {
      document.getElementById('edit-pf-headline').value = portfolioData.headline || '';
      document.getElementById('edit-pf-skill-1').value = (portfolioData.skills && portfolioData.skills.data) || '';
      document.getElementById('edit-pf-skill-2').value = (portfolioData.skills && portfolioData.skills.code) || '';
      document.getElementById('edit-pf-skill-3').value = (portfolioData.skills && portfolioData.skills.gov) || '';
      document.getElementById('edit-pf-skill-4').value = (portfolioData.skills && portfolioData.skills.ai) || '';
      document.getElementById('edit-pf-vision').value = portfolioData.vision || '';

      renderPortfolioEditExpRows();
      document.getElementById('portfolio-edit-modal').classList.remove('hidden');
    }

    function renderPortfolioEditExpRows() {
      const container = document.getElementById('edit-pf-exp-container');
      if (!container) return;
      container.innerHTML = '';
      const exps = portfolioData.experiences || [];
      exps.forEach((exp, idx) => {
        const row = document.createElement('div');
        row.className = 'p-3 bg-white rounded-xl border border-slate-200 space-y-2 relative';
        row.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700 text-xs">รายการที่ ${idx + 1}</span>
            <button type="button" onclick="removePortfolioExpRow(${idx})" class="text-red-500 hover:text-red-700 text-xs">
              <i class="fa-solid fa-trash-can mr-1"></i> ลบรายการ
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" id="pf-in-role-${idx}" value="${exp.role || ''}" placeholder="ตำแหน่ง เช่น เจ้าหน้าที่ระบบคอมพิวเตอร์" class="p-1.5 border border-slate-300 rounded text-xs font-semibold">
            <input type="text" id="pf-in-org-${idx}" value="${exp.org || ''}" placeholder="หน่วยงาน เช่น สภากาชาดไทย" class="p-1.5 border border-slate-300 rounded text-xs">
          </div>
          <div class="grid grid-cols-3 gap-2">
            <input type="text" id="pf-in-period-${idx}" value="${exp.period || ''}" placeholder="ระยะเวลา เช่น พ.ศ. 2565 – 2567 (2 ปี)" class="p-1.5 border border-slate-300 rounded text-xs">
            <input type="text" id="pf-in-desc-${idx}" value="${exp.desc || ''}" placeholder="ภารกิจหลัก" class="col-span-2 p-1.5 border border-slate-300 rounded text-xs">
          </div>
        `;
        container.appendChild(row);
      });
    }

    function addPortfolioExpRow() {
      if (!portfolioData.experiences) portfolioData.experiences = [];
      portfolioData.experiences.push({
        role: "",
        org: "",
        period: "",
        desc: ""
      });
      renderPortfolioEditExpRows();
    }

    function removePortfolioExpRow(idx) {
      if (portfolioData.experiences && portfolioData.experiences[idx]) {
        portfolioData.experiences.splice(idx, 1);
        renderPortfolioEditExpRows();
      }
    }

    function closePortfolioEditModal() {
      document.getElementById('portfolio-edit-modal').classList.add('hidden');
    }

    function savePortfolioData() {
      portfolioData.headline = document.getElementById('edit-pf-headline').value.trim();
      if (!portfolioData.skills) portfolioData.skills = {};
      portfolioData.skills.data = document.getElementById('edit-pf-skill-1').value.trim();
      portfolioData.skills.code = document.getElementById('edit-pf-skill-2').value.trim();
      portfolioData.skills.gov = document.getElementById('edit-pf-skill-3').value.trim();
      portfolioData.skills.ai = document.getElementById('edit-pf-skill-4').value.trim();
      portfolioData.vision = document.getElementById('edit-pf-vision').value.trim();

      // Read experience rows
      const exps = portfolioData.experiences || [];
      exps.forEach((exp, idx) => {
        const rRole = document.getElementById(`pf-in-role-${idx}`);
        const rOrg = document.getElementById(`pf-in-org-${idx}`);
        const rPeriod = document.getElementById(`pf-in-period-${idx}`);
        const rDesc = document.getElementById(`pf-in-desc-${idx}`);
        if (rRole) exp.role = rRole.value.trim();
        if (rOrg) exp.org = rOrg.value.trim();
        if (rPeriod) exp.period = rPeriod.value.trim();
        if (rDesc) exp.desc = rDesc.value.trim();
      });

      saveToLocalStorage();
      renderPortfolio();
      closePortfolioEditModal();
      alert('✓ บันทึกแฟ้มสะสมผลงานเรียบร้อยแล้ว');
    }

