// Module: 05-logbook-views.js (Smart GovReport Hub 2.5)
    // =========================================================================
    // OJT EDITION SWITCHER: BRIEF (ตารางทางการ A4) VS FULL (ฉบับเต็ม + รูปภาพ)
    // =========================================================================
    let currentOjtEdition = 'brief'; // 'brief' or 'full'

    function setOjtEdition(edition) {
      currentOjtEdition = edition;
      const btnBrief = document.getElementById('ojt-edition-brief');
      const btnFull = document.getElementById('ojt-edition-full');

      const briefActive = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-govNavy text-white shadow-xs transition flex items-center space-x-1';
      const briefInactive = 'px-2.5 py-1 text-xs font-bold rounded-lg text-slate-700 hover:bg-amber-100 transition flex items-center space-x-1';
      const fullActive = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-600 text-white shadow-xs transition flex items-center space-x-1';
      const fullInactive = 'px-2.5 py-1 text-xs font-bold rounded-lg text-slate-700 hover:bg-amber-100 transition flex items-center space-x-1';

      if (edition === 'brief') {
        if (btnBrief) btnBrief.className = briefActive;
        if (btnFull) btnFull.className = fullInactive;
      } else {
        if (btnBrief) btnBrief.className = briefInactive;
        if (btnFull) btnFull.className = fullActive;
      }

      renderOjtPages();
    }

    function renderOjtPages() {
      const coverPage = document.getElementById('ojt-cover-page');
      const weeklyContainer = document.getElementById('ojt-weekly-container');
      const weekSelect = document.getElementById('ojt-week-select');
      const selectedWeek = parseInt(weekSelect ? weekSelect.value : 4) || 4;

      if (!weeklyContainer) return;

      const hasWeek5 = profileData.curriculum?.w5?.enabled !== false && liveOjtData[5] && liveOjtData[5].length > 0;
      const activeWeeks = hasWeek5 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
      const totalBookPages = activeWeeks.length + 1;
      const totalBookPagesThai = toThaiNum(totalBookPages);

      const renderFn = (currentOjtEdition === 'full') ? generateSingleWeekFullHTML : generateSingleWeekHTML;

      if (currentOjtViewMode === 'all') {
        // Mode 1: Full Book (Cover + All active Weeks)
        if (coverPage) {
          coverPage.classList.remove('hidden');
          const coverFooter = coverPage.querySelector('.justify-between span:last-child');
          if (coverFooter) coverFooter.innerText = `หน้า 1 จาก ${totalBookPagesThai}`;
        }
        
        let html = '';
        activeWeeks.forEach((w, idx) => {
          html += renderFn(w, true, totalBookPages, idx + 2);
        });
        weeklyContainer.innerHTML = html;
        weeklyContainer.classList.remove('hidden');

      } else if (currentOjtViewMode === 'weekly') {
        // Mode 2: Single Selected Week only
        if (coverPage) coverPage.classList.add('hidden');
        
        weeklyContainer.innerHTML = renderFn(selectedWeek, false, 1, 1);
        weeklyContainer.classList.remove('hidden');

      } else if (currentOjtViewMode === 'cover') {
        // Mode 3: Cover Sheet only
        if (coverPage) {
          coverPage.classList.remove('hidden');
          const coverFooter = coverPage.querySelector('.justify-between span:last-child');
          if (coverFooter) coverFooter.innerText = 'หน้า 1 จาก 1';
        }
        weeklyContainer.innerHTML = '';
        weeklyContainer.classList.add('hidden');

      } else if (currentOjtViewMode === 'cover-and-week') {
        // Mode 4: Cover + Current Selected Week
        if (coverPage) {
          coverPage.classList.remove('hidden');
          const coverFooter = coverPage.querySelector('.justify-between span:last-child');
          if (coverFooter) coverFooter.innerText = 'หน้า 1 จาก 2';
        }
        weeklyContainer.innerHTML = renderFn(selectedWeek, false, 2, 2);
        weeklyContainer.classList.remove('hidden');
      }

      updateDashboardKPI();
    }

        // ฟังก์ชันดึงหมายเลขวันจากข้อความวันที่ (รองรับทั้งเลขอารบิกและเลขไทย เพื่อเรียงวันที่ 1, 2, 3...)
    function extractDayNumber(dateStr) {
      if (!dateStr) return 999;
      const arabicStr = String(dateStr).replace(/[๐-๙]/g, d => "๐๑๒๓๔๕๖๗๘๙".indexOf(d));
      const match = arabicStr.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 999;
    }

    // ฟังก์ชันจัดเรียงลำดับรายการงานตามวันที่จากน้อยไปมาก (Chronological Order)
    function sortWeekEntriesByDate(weekNum) {
      if (!liveOjtData[weekNum] || !Array.isArray(liveOjtData[weekNum])) return;
      liveOjtData[weekNum].sort((a, b) => extractDayNumber(a.date) - extractDayNumber(b.date));
    }

    function generateSingleWeekHTML(weekNum, isMultiWeek = false, totalPages = 5, pageNumOverride = null) {
      sortWeekEntriesByDate(weekNum);
      const data = liveOjtData[weekNum] || [];
      let weekHours = 0;
      data.forEach(r => { weekHours += (parseFloat(r.hours) || 0); });

      let prevHours = 0;
      for (let w = 1; w < weekNum; w++) {
        if (liveOjtData[w]) {
          liveOjtData[w].forEach(r => { prevHours += (parseFloat(r.hours) || 0); });
        }
      }

      let grandTotal = prevHours + weekHours;

      const session = getActiveSession();
      const isTrainee = session && session.role === 'trainee';
      const isWeekLocked = Boolean(securityState.signatures && securityState.signatures[weekNum]);
      const pageNum = pageNumOverride || (isMultiWeek ? (weekNum + 1) : (currentOjtViewMode === 'cover-and-week' ? 2 : 1));
      const totalPageLabel = isMultiWeek ? totalPages : (currentOjtViewMode === 'cover-and-week' ? 2 : 1);

      // วันมาตรฐาน 5 วันทำการ (จันทร์ - ศุกร์)
      // กรณีสัปดาห์ที่ 1 เริ่ม อังคาร 1 ก.ย. 69 ตัดแถวว่างวันจันทร์ออกเพื่อความสะอาดตาและประหยัดพื้นที่ 1 หน้ากระดาษ
      let standardDays = [
        { label: 'จันทร์', prefix: 'จันทร์' },
        { label: 'อังคาร', prefix: 'อังคาร' },
        { label: 'พุธ', prefix: 'พุธ' },
        { label: 'พฤหัสบดี', prefix: 'พฤหัสบดี' },
        { label: 'ศุกร์', prefix: 'ศุกร์' }
      ];

      if (weekNum === 1 && !data.some(r => (r.date || '').includes('จันทร์'))) {
        standardDays = standardDays.filter(d => d.label !== 'จันทร์');
      } else if (weekNum === 5 && !data.some(r => (r.date || '').includes('พฤหัสบดี') || (r.date || '').includes('ศุกร์'))) {
        standardDays = standardDays.filter(d => ['จันทร์', 'อังคาร', 'พุธ'].includes(d.label));
      }

      // แมปข้อมูลตามวันในสัปดาห์
      const usedEntryIds = new Set();
      const rowsHTML = standardDays.map(std => {
        // หา entry ที่ตรงกับวันนี้
        const entry = data.find(r => {
          if (usedEntryIds.has(r.id)) return false;
          const dStr = (r.date || '').trim();
          return dStr.startsWith(std.prefix) || dStr.includes(std.prefix);
        });

        if (entry) {
          usedEntryIds.add(entry.id);
          const h = parseFloat(entry.hours) || 0;
          return `
            <tr id="ojt-row-${entry.id}" class="hover:bg-blue-50/40 transition group print:hover:bg-transparent">
              <td class="border border-slate-700 p-1.5 print:p-1 text-left font-medium text-[12.5px] print:text-[10pt] leading-snug align-top">
                <div class="font-semibold text-slate-900">${entry.date}</div>
              </td>
              <td class="border border-slate-700 p-1.5 print:p-1 text-center font-bold text-slate-900 text-[13px] print:text-[10.5pt] align-middle">
                ${h.toFixed(1)}
              </td>
              <td class="border border-slate-700 p-1.5 print:p-1 text-left text-[12.5px] print:text-[10pt] leading-snug align-top">
                <div class="text-slate-800">
                  <span>${entry.task}</span>
                  <button onclick="openEvidenceModal('${entry.id}')" class="ml-1 inline-flex items-center space-x-1 px-1.5 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[9px] font-semibold border border-blue-200 no-print transition align-middle flex-shrink-0" title="คลิกดูขั้นตอน SOP และหลักฐานฉบับเต็ม">
                    <i class="fa-solid fa-magnifying-glass-chart text-[8px]"></i>
                    <span>ฉบับเต็ม</span>
                  </button>
                </div>
              </td>
              <td class="border border-slate-700 p-1.5 print:p-1 text-left text-[12.5px] print:text-[10pt] leading-snug text-slate-800 align-top">
                ${entry.skill}
              </td>
              <td class="border border-slate-700 p-1.5 print:p-1 text-left text-[12px] print:text-[9.5pt] leading-snug text-slate-700 align-top">
                ${entry.blocker || '-'}
              </td>
              <td class="border border-slate-700 p-1 text-center no-print align-middle">
                <div class="flex items-center justify-center space-x-1">
                  <button onclick="openEvidenceModal('${entry.id}')" class="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded" title="ดูรายละเอียดฉบับเต็ม">
                    <i class="fa-solid fa-magnifying-glass-chart"></i>
                  </button>
                  ${isWeekLocked || securityState.isLocked ? `
                    <span class="text-[9px] text-slate-400 font-medium px-1 py-0.5" title="สัปดาห์นี้ล็อคแล้ว ไม่สามารถแก้ไขได้"><i class="fa-solid fa-lock text-[9px] text-emerald-600"></i></span>
                  ` : `
                    <button onclick="openEditEntryModal('${entry.id}')" class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded" title="แก้ไข">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="promptDeleteEntry('${entry.id}')" class="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded" title="ลบ">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  `}
                </div>
              </td>
            </tr>
          `;
        } else {
          // แถวว่างตามแบบฟอร์มกระดาษจริง
          return `
            <tr class="h-9 print:h-8">
              <td class="border border-slate-700 p-1.5 print:p-1 text-left font-medium text-[12px] print:text-[10pt] text-slate-600 align-middle">
                ${std.label}...../...../.....
              </td>
              <td class="border border-slate-700 p-1.5 print:p-1 text-center text-[12px] print:text-[10pt] align-middle text-slate-400"></td>
              <td class="border border-slate-700 p-1.5 print:p-1 align-middle text-[12px] print:text-[10pt]"></td>
              <td class="border border-slate-700 p-1.5 print:p-1 align-middle text-[12px] print:text-[10pt]"></td>
              <td class="border border-slate-700 p-1.5 print:p-1 align-middle text-[12px] print:text-[10pt]"></td>
              <td class="border border-slate-700 p-1 no-print align-middle"></td>
            </tr>
          `;
        }
      }).join('');

      return `
        <div id="ojt-weekly-page-${weekNum}" class="a4-paper font-sarabun text-slate-900 leading-normal page-break shadow-md mb-8">
          
          <!-- Header (แบบฟอร์มราชการกึ่งกลางตรงตามต้นฉบับจริง) -->
          <div class="text-center pt-1 pb-2 print:pt-0 print:pb-1 relative">
            <h2 class="text-lg print:text-base font-bold tracking-normal text-black">แบบบันทึกการปฏิบัติงานประจำสัปดาห์</h2>
            <div class="text-base print:text-sm font-bold text-black mt-0.5">
              สัปดาห์ที่<span class="inline-block border-b border-dotted border-black min-w-[3rem] text-center font-bold px-2 mx-1">${toThaiNum(weekNum)}</span>
            </div>
            
            <!-- Digital Evidence Button (no-print) -->
            <div class="absolute top-1 right-0 flex items-center space-x-1.5 p-1 bg-white border border-slate-300 rounded shadow-xs cursor-pointer no-print" onclick="openDecisionMatrixModal()" title="คลิกเพื่อดูหลักฐานเชิงประจักษ์ฉบับเต็ม">
              <div class="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-govNavy">
                <i class="fa-solid fa-qrcode text-xs"></i>
              </div>
              <div class="text-[8px] leading-tight text-left">
                <span class="font-bold text-govNavy block">Digital Evidence</span>
                <span class="text-slate-400">สแกนดูผลงาน</span>
              </div>
            </div>
          </div>

          <!-- Section: ข้อมูลผู้ฝึกภาคปฏิบัติ (3 บรรทัด เส้นประ จุดไข่ปลา ตามต้นฉบับเป๊ะ) -->
          <div class="text-[13px] print:text-[11px] leading-snug text-black mb-2 print:mb-1.5 space-y-0.5">
            <div class="flex items-baseline">
              <span class="font-normal whitespace-nowrap">ข้าพเจ้า (นาย/นางสาว)</span>
              <span class="border-b border-dotted border-black flex-1 ml-2 px-2 font-medium text-slate-900 break-words">
                ${formatTraineeNameWithTitle(maskText(profileData.traineeName))}
              </span>
            </div>
            <div class="flex items-baseline">
              <span class="font-normal whitespace-nowrap">ชื่อหน่วยงาน</span>
              <span class="border-b border-dotted border-black flex-1 ml-2 px-2 font-medium text-slate-900 break-words">
                ${profileData.orgName}
              </span>
            </div>
            <div class="flex items-baseline justify-between gap-4">
              <div class="flex items-baseline flex-1 min-w-0">
                <span class="font-normal whitespace-nowrap">ผู้ควบคุมการฝึกงาน</span>
                <span class="border-b border-dotted border-black flex-1 ml-2 px-2 font-medium text-slate-900 break-words">
                  ${profileData.supervisorName}
                </span>
              </div>
              <div class="flex items-baseline flex-1 min-w-0">
                <span class="font-normal whitespace-nowrap">ตำแหน่ง</span>
                <span class="border-b border-dotted border-black flex-1 ml-2 px-2 font-medium text-slate-900 break-words">
                  ${profileData.supervisorPos}
                </span>
              </div>
            </div>
          </div>

          <!-- Official Logbook Table (ตรงตามแบบฟอร์มกระดาษราชการ 1:1) -->
          <div class="w-full">
            <table class="w-full border-collapse border border-slate-700 text-[13px] print:text-[10.5pt] mb-2 print:mb-1">
              <thead>
                <tr class="bg-white text-center font-bold text-black">
                  <th class="border border-slate-700 p-1.5 print:p-1 w-[14%] print:w-[14%] font-bold text-center">วัน/เดือน/ปี</th>
                  <th class="border border-slate-700 p-1.5 print:p-1 w-[8%] print:w-[8%] font-bold text-center leading-tight">จำนวน<br>ชั่วโมง</th>
                  <th class="border border-slate-700 p-1.5 print:p-1 w-[38%] print:w-[41%] font-bold text-center">งานที่ปฏิบัติโดยย่อ</th>
                  <th class="border border-slate-700 p-1.5 print:p-1 w-[22%] print:w-[23%] font-bold text-center leading-tight">ความรู้/ทักษะ<br>ที่ได้รับ</th>
                  <th class="border border-slate-700 p-1.5 print:p-1 w-[13%] print:w-[14%] font-bold text-center leading-tight">ปัญหา/<br>อุปสรรค</th>
                  <th class="border border-slate-700 p-1 w-[5%] no-print text-center font-normal text-slate-500">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
              <tfoot>
                <!-- Integrated Footer Matching Official Paper Form (Symmetric Dual Digital / Manual Signatures) -->
                <tr>
                  <td class="border border-slate-700 p-2 print:p-1 font-bold text-black text-center text-[12px] print:text-[10pt] leading-snug align-middle">
                    จำนวนชั่วโมงรวมใน<br>รายงานฉบับนี้
                  </td>
                  <td class="border border-slate-700 p-1.5 print:p-1 text-center font-black text-black text-[15px] print:text-[12pt] align-middle">
                    ${toThaiNum(weekHours.toFixed(1))}
                  </td>
                  <!-- Signature Trainee Block -->
                  <td class="border border-slate-700 p-2.5 print:p-1.5 text-center align-top text-[12px] print:text-[10pt] leading-snug">
                    <p class="mb-1 font-medium text-black">ขอรับรองว่ารายงานฉบับนี้เป็นความจริงทุกประการ</p>
                    ${securityState.traineeSignatures && securityState.traineeSignatures[weekNum] ? `
                      <div class="my-0.5">
                        <img src="${securityState.traineeSignatures[weekNum].image}" class="h-8 mx-auto object-contain -mb-1">
                        <div class="w-44 mx-auto border-b border-black"></div>
                      </div>
                      <p class="text-black font-medium mt-0.5">( <span class="font-bold">${formatTraineeNameWithTitle(maskText(profileData.traineeName))}</span> )</p>
                      <p class="font-bold text-black mt-0.5">คนพิการ</p>
                      <p class="text-black mt-0.5 text-[11px] print:text-[9.5pt]">วัน <span class="font-bold px-1">${securityState.traineeSignatures[weekNum].dateOnly || '...................'}</span></p>
                      <div class="mt-1 p-1 bg-blue-50 border border-blue-200 rounded text-[9px] text-blue-800 leading-tight no-print">
                        <i class="fa-solid fa-signature mr-1 text-blue-600"></i>
                        <span>ลงนามสด: ${securityState.traineeSignatures[weekNum].timestamp}</span>
                        <button type="button" onclick="unlockWeekSignature(${weekNum}, 'trainee')" class="block mx-auto mt-0.5 text-[8px] text-red-600 underline hover:text-red-800">ยกเลิกลายเซ็น</button>
                      </div>
                    ` : `
                      <div class="w-44 mx-auto border-b border-dotted border-black mb-1 h-7 print:h-6"></div>
                      <p class="text-black font-medium">( <span class="font-bold">${formatTraineeNameWithTitle(maskText(profileData.traineeName))}</span> )</p>
                      <p class="font-bold text-black mt-0.5">คนพิการ</p>
                      <p class="text-black mt-0.5 text-[11px] print:text-[9.5pt]">วัน<span class="inline-block border-b border-dotted border-black w-6 mx-0.5"></span>เดือน<span class="inline-block border-b border-dotted border-black w-16 mx-0.5"></span>พ.ศ. <span class="inline-block border-b border-dotted border-black w-10 mx-0.5"></span></p>
                      <button type="button" onclick="openSignatureModal(${weekNum}, 'trainee')" class="no-print mt-1.5 px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] font-bold shadow-xs flex items-center space-x-1 mx-auto transition" title="คลิกลงนามดิจิทัลบนหน้าจอ หรือเว้นว่างเพื่อเซ็นสดด้วยปากกาบนกระดาษ">
                        <i class="fa-solid fa-pen-nib text-amber-300"></i>
                        <span>ลงนามดิจิทัล (คนพิการ)</span>
                      </button>
                    `}
                  </td>
                  <!-- Signature Supervisor Block (Colspan 2) -->
                  <td class="border border-slate-700 p-2.5 print:p-1.5 text-center align-top text-[12px] print:text-[10pt] leading-snug" colspan="2">
                    <p class="mb-1 font-medium text-black">ขอรับรองว่ารายงานฉบับนี้เป็นความจริงทุกประการ</p>
                    ${securityState.signatures && securityState.signatures[weekNum] ? `
                      <div class="my-0.5">
                        <img src="${securityState.signatures[weekNum].image}" class="h-8 mx-auto object-contain -mb-1">
                        <div class="w-44 mx-auto border-b border-black"></div>
                      </div>
                      <p class="text-black font-medium mt-0.5">( <span class="font-bold">${maskText(profileData.supervisorName)}</span> )</p>
                      <p class="font-bold text-black mt-0.5">ผู้ควบคุมงาน</p>
                      <p class="text-black text-[11px] print:text-[9.5pt] mt-0.5">ตำแหน่ง <span class="border-b border-dotted border-black px-1 font-medium">${profileData.supervisorPos || 'ผู้ควบคุมงาน'}</span></p>
                      <p class="text-black text-[11px] print:text-[9.5pt] mt-0.5">วัน <span class="font-bold px-1">${securityState.signatures[weekNum].dateOnly || '...................'}</span></p>
                      <div class="mt-1 p-1 bg-emerald-50 border border-emerald-300 rounded text-[9px] text-emerald-800 leading-tight no-print">
                        <i class="fa-solid fa-shield-check mr-1 text-emerald-600"></i>
                        <span>อนุมัติ & ล็อค: ${securityState.signatures[weekNum].timestamp}</span>
                        ${!isTrainee ? `
                          <button type="button" onclick="unlockWeekSignature(${weekNum}, 'supervisor')" class="block mx-auto mt-0.5 text-[8px] text-red-600 underline hover:text-red-800">ปลดล็อค</button>
                        ` : ''}
                      </div>
                    ` : `
                      <div class="w-44 mx-auto border-b border-dotted border-black mb-1 h-7 print:h-6"></div>
                      <p class="text-black font-medium">( <span class="font-bold">${maskText(profileData.supervisorName) || '.............................................'}</span> )</p>
                      <p class="font-bold text-black mt-0.5">ผู้ควบคุมงาน</p>
                      <p class="text-black text-[11px] print:text-[9.5pt] mt-0.5">ตำแหน่ง <span class="border-b border-dotted border-black min-w-[6rem] inline-block font-medium">${profileData.supervisorPos || '...............................'}</span></p>
                      <p class="text-black text-[11px] print:text-[9.5pt] mt-0.5">วัน<span class="inline-block border-b border-dotted border-black w-6 mx-0.5"></span>เดือน<span class="inline-block border-b border-dotted border-black w-14 mx-0.5"></span>พ.ศ. <span class="inline-block border-b border-dotted border-black w-10 mx-0.5"></span></p>
                      ${!isTrainee ? `
                        <button type="button" onclick="openSignatureModal(${weekNum}, 'supervisor')" class="no-print mt-1.5 px-2.5 py-1 bg-govNavy hover:bg-govNavyLight text-white rounded text-[10px] font-bold shadow-xs flex items-center space-x-1 mx-auto transition" title="คลิกลงนามดิจิทัลบนหน้าจอ หรือเว้นว่างเพื่อเซ็นสดด้วยปากกาบนกระดาษ">
                          <i class="fa-solid fa-signature text-govGold"></i>
                          <span>ลงนามดิจิทัล (ผู้ควบคุมงาน)</span>
                        </button>
                      ` : `
                        <div class="no-print mt-1 text-[10px] text-amber-600 font-medium">
                          <i class="fa-solid fa-clock-rotate-left mr-0.5"></i> รอผู้ควบคุมงานลงนาม
                        </div>
                      `}
                    `}
                  </td>
                  <td class="border border-slate-700 p-1 no-print bg-slate-50"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Document Footer -->
          <div class="mt-1 pt-1 border-t border-slate-300 text-[10px] print:text-[9px] text-slate-500 flex justify-between">
            <span>เอกสารอ้างอิง: แบบบันทึกการปฏิบัติงานประจำสัปดาห์ (หลักสูตรส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการฯ)</span>
            <span>หน้า ${toThaiNum(pageNum)} จาก ${toThaiNum(totalPageLabel)}</span>
          </div>
        </div>
      `;
    }
    // =========================================================================
    // FULL OJT PERFORMANCE LOG WITH PHOTO EVIDENCE (แบบบันทึกประจำสัปดาห์ ฉบับเต็ม)
    // =========================================================================
    function generateSingleWeekFullHTML(weekNum, isMultiWeek = false, totalPages = 5, pageNumOverride = null) {
      sortWeekEntriesByDate(weekNum);
      const data = liveOjtData[weekNum] || [];
      let weekHours = 0;
      data.forEach(r => { weekHours += (parseFloat(r.hours) || 0); });

      let prevHours = 0;
      for (let w = 1; w < weekNum; w++) {
        if (liveOjtData[w]) {
          liveOjtData[w].forEach(r => { prevHours += (parseFloat(r.hours) || 0); });
        }
      }
      const grandTotal = prevHours + weekHours;

      const session = getActiveSession();
      const isTrainee = session && session.role === 'trainee';
      const isWeekLocked = Boolean(securityState.signatures && securityState.signatures[weekNum]);

      const pageNum = pageNumOverride !== null ? pageNumOverride : (isMultiWeek ? (weekNum + 1) : 1);
      const totalPageLabel = totalPages;

      const cur = profileData.curriculum || {};
      const weekCur = cur[`w${weekNum}`] || {};
      const weekDates = weekCur.dates || (weekNum === 1 ? '1 - 4 ก.ย. 69' : weekNum === 2 ? '7 - 11 ก.ย. 69' : weekNum === 3 ? '14 - 18 ก.ย. 69' : weekNum === 4 ? '21 - 25 ก.ย. 69' : '28 - 30 ก.ย. 69');

      const daysCardsHTML = data.map((row, idx) => {
        const images = row.images || [];
        let imagesCards = '';
        if (images.length > 0) {
          imagesCards = images.map((img, imgIdx) => `
            <div class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs group relative transition hover:shadow-sm">
              <img src="${img.url}" alt="${img.caption || 'ภาพประกอบการปฏิบัติงาน'}" class="w-full h-32 object-cover cursor-pointer hover:opacity-95 transition" onclick="previewImageZoom('${img.url}', '${(img.caption || '').replace(/'/g, "\\'")}')">
              <div class="p-1.5 bg-white border-t border-slate-100 flex items-start justify-between">
                <p class="text-[10px] text-slate-700 leading-tight font-medium line-clamp-2">${img.caption || `ภาพที่ ${toThaiNum(imgIdx + 1)}: การปฏิบัติงานประจำวัน`}</p>
              </div>
            </div>
          `).join('');
        } else {
          imagesCards = `
            <div onclick="openPhotoModal('${row.id}')" class="col-span-1 sm:col-span-2 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition text-slate-400 no-print">
              <i class="fa-solid fa-camera text-xl mb-1 text-slate-300"></i>
              <p class="text-xs font-semibold text-slate-600">คลิกเพื่อเพิ่มภาพถ่ายการปฏิบัติงาน</p>
              <p class="text-[10px] text-slate-400">รองรับอัปโหลดภาพ หรือ URL</p>
            </div>
          `;
        }

        return `
          <div class="border border-slate-300 rounded-2xl p-4 bg-white shadow-xs mb-4 page-break-inside-avoid">
            <!-- Day Header -->
            <div class="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div class="flex items-center space-x-2">
                <span class="px-2.5 py-1 bg-govNavy text-white rounded-lg text-xs font-bold">${row.date}</span>
                <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-xs border border-emerald-200">${row.hours} ชม.</span>
                <span class="text-xs text-slate-500 font-medium hidden sm:inline">รายการที่ ${toThaiNum(idx + 1)}</span>
              </div>
                ${isWeekLocked || securityState.isLocked ? '' : `
                  <button onclick="openPhotoModal('${row.id}')" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold border border-amber-200 transition flex items-center space-x-1" title="จัดการรูปภาพสำหรับวันนี้">
                    <i class="fa-solid fa-camera text-amber-600"></i>
                    <span>รูปภาพ (${images.length})</span>
                  </button>
                `}
                <button onclick="openEvidenceModal('${row.id}')" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold border border-blue-200 transition flex items-center space-x-1" title="ดู SOP และหลักฐาน">
                  <i class="fa-solid fa-magnifying-glass"></i>
                  <span>ดู SOP เต็ม</span>
                </button>
                ${isWeekLocked || securityState.isLocked ? `
                  <span class="text-[10px] text-slate-400 font-medium px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-1" title="สัปดาห์นี้ได้รับการอนุมัติแล้ว ล็อคไม่ให้แก้ไข"><i class="fa-solid fa-lock text-emerald-600"></i><span class="hidden sm:inline text-[9px]">ล็อคแล้ว</span></span>
                ` : `
                  <button onclick="openEditEntryModal('${row.id}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition" title="แก้ไข">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                `}
              </div>
            </div>

            <!-- Content Grid: 7 cols details + 5 cols photos -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 text-xs">
              <!-- Left: Detailed SOP and competencies -->
              <div class="lg:col-span-7 space-y-2">
                <div>
                  <span class="font-bold text-slate-900 text-sm leading-snug block">${row.task}</span>
                </div>

                <div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                  <span class="font-bold text-govNavy block text-[11px] mb-1">
                    <i class="fa-solid fa-list-ol mr-1 text-blue-600"></i> ขั้นตอนการปฏิบัติงานเชิงลึก (Step-by-Step SOP):
                  </span>
                  <div class="text-slate-700 whitespace-pre-wrap leading-relaxed text-[11px] pl-1 font-sarabun">${row.steps || '-'}</div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div class="bg-slate-50 p-2 rounded border border-slate-200">
                    <span class="font-bold text-slate-800 block text-[10px]"><i class="fa-solid fa-screwdriver-wrench mr-1 text-govGold"></i> เครื่องมือ/เทคโนโลยี:</span>
                    <span class="text-slate-600">${row.tools || '-'}</span>
                  </div>
                  <div class="bg-slate-50 p-2 rounded border border-slate-200">
                    <span class="font-bold text-slate-800 block text-[10px]"><i class="fa-solid fa-graduation-cap mr-1 text-govTeal"></i> ความรู้/ทักษะที่ได้รับ:</span>
                    <span class="text-slate-600">${row.skill || '-'}</span>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div class="bg-slate-50 p-2 rounded border border-slate-200">
                    <span class="font-bold text-slate-800 block text-[10px]"><i class="fa-solid fa-circle-exclamation mr-1 text-amber-500"></i> ปัญหา/อุปสรรค:</span>
                    <span class="text-slate-600">${row.blocker || 'ไม่มี'}</span>
                  </div>
                  <div class="bg-slate-50 p-2 rounded border border-slate-200">
                    <span class="font-bold text-slate-800 block text-[10px]"><i class="fa-solid fa-paperclip mr-1 text-blue-500"></i> ชิ้นงาน/เอกสารอ้างอิง:</span>
                    <span class="text-slate-600">${row.artifacts || '-'}</span>
                  </div>
                </div>

                <div class="bg-emerald-50/40 p-2 rounded border border-emerald-200 text-[11px]">
                  <span class="font-bold text-emerald-900 block text-[10px]"><i class="fa-solid fa-chart-line mr-1 text-govTeal"></i> ผลลัพธ์และประโยชน์ต่อองค์กร:</span>
                  <p class="text-slate-700 italic leading-snug font-sarabun">${row.impact || '-'}</p>
                </div>
              </div>

              <!-- Right: Work Photos Gallery -->
              <div class="lg:col-span-5 space-y-2">
                <div class="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span class="font-bold text-govNavy text-[11px] flex items-center">
                    <i class="fa-solid fa-images mr-1.5 text-amber-600"></i> ภาพถ่ายประกอบการปฏิบัติงาน:
                  </span>
                  <span class="text-[10px] text-slate-400 font-normal">Evidence Gallery</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  ${imagesCards}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div id="ojt-weekly-full-page-${weekNum}" class="a4-paper font-sarabun text-slate-900 leading-snug text-sm page-break shadow-md mb-8">
          <!-- Document Header -->
          <div class="flex items-start justify-between border-b-2 border-slate-800 pb-2 mb-3">
            <div class="w-16 hidden sm:block"></div>
            <div class="text-center flex-1">
              <h2 class="text-xl font-bold tracking-wide text-slate-900">แบบบันทึกการปฏิบัติงานประจำสัปดาห์ (ฉบับเต็ม)</h2>
              <p class="text-xs text-slate-600 mt-0.5">โครงการส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการในหน่วยงานภาครัฐ</p>
            </div>
            <div class="flex flex-col items-end space-y-1">
              <div class="text-xs font-bold text-govNavy bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
                สัปดาห์ที่ <span class="underline decoration-solid font-black">${toThaiNum(weekNum)}</span>
              </div>
              <span class="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold border border-blue-200">
                ฉบับรายงานละเอียด & หลักฐานภาพถ่าย
              </span>
            </div>
          </div>

          <!-- Trainee Profile Info -->
          <div class="text-xs mb-3 space-y-1 pb-2 border-b border-slate-200">
            <p>
              ข้าพเจ้า <span class="border-b border-dotted border-slate-600 px-2 font-medium">${formatTraineeNameWithTitle(maskText(profileData.traineeName))}</span>
            </p>
            <div class="flex flex-wrap gap-x-4">
              <p>ชื่อหน่วยงาน <span class="border-b border-dotted border-slate-600 px-2 font-medium">${profileData.orgName}</span></p>
              <p>ผู้ควบคุมการฝึกงาน <span class="border-b border-dotted border-slate-600 px-2 font-medium">${profileData.supervisorName}</span></p>
            </div>
            <p>
              ตำแหน่ง <span class="border-b border-dotted border-slate-600 px-2 font-medium">${profileData.supervisorPos}</span>
            </p>
          </div>

          <!-- Days Detailed Cards with Photos -->
          <div class="space-y-4 mb-4">
            ${daysCardsHTML || '<div class="p-4 text-center text-slate-400">ยังไม่มีรายการบันทึกในสัปดาห์นี้</div>'}
          </div>

          <!-- Weekly Hours & Signoff Summary Box -->
          <div class="border border-slate-400 rounded-xl p-3 bg-slate-50 mb-3 page-break-inside-avoid">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <!-- Hours Summary -->
              <div class="space-y-1.5 text-xs text-slate-800 border-b md:border-b-0 md:border-r border-slate-300 pb-2 md:pb-0 md:pr-3">
                <div class="flex justify-between">
                  <span>ชั่วโมงในรายงานฉบับนี้:</span>
                  <span class="font-bold text-govNavy">${weekHours.toFixed(1)} ชม.</span>
                </div>
                <div class="flex justify-between">
                  <span>ชั่วโมงสะสมในรายงานฉบับก่อน:</span>
                  <span class="font-semibold text-slate-700">${prevHours.toFixed(1)} ชม.</span>
                </div>
                <div class="flex justify-between pt-1 border-t border-slate-300 font-bold text-govTeal text-xs">
                  <span>ชั่วโมงสะสมทั้งหมด:</span>
                  <span>${grandTotal.toFixed(1)} ชม.</span>
                </div>
              </div>

              <!-- Trainee Signature -->
              <div class="text-center text-[10px] space-y-1 border-b md:border-b-0 md:border-r border-slate-300 pb-2 md:pb-0 md:px-2">
                <p class="leading-tight">ขอรับรองว่ารายงานฉบับนี้เป็นความจริงทุกประการ</p>
                ${securityState.traineeSignatures && securityState.traineeSignatures[weekNum] ? `
                  <div class="my-1">
                    <img src="${securityState.traineeSignatures[weekNum].image}" class="h-10 mx-auto object-contain -mb-2">
                    <p class="border-b border-slate-700 w-36 mx-auto"></p>
                  </div>
                  <p>( <span>${formatTraineeNameWithTitle(maskText(profileData.traineeName))}</span> )</p>
                  <p class="font-semibold text-slate-700">คนพิการผู้ฝึกภาคปฏิบัติ</p>
                  <div class="mt-1 p-1 bg-blue-50 border border-blue-200 rounded text-[9px] text-blue-800 leading-tight">
                    <i class="fa-solid fa-signature mr-1 text-blue-600"></i>
                    <span>ลงนาม: ${securityState.traineeSignatures[weekNum].timestamp}</span>
                    <button type="button" onclick="unlockWeekSignature(${weekNum}, 'trainee')" class="no-print block mx-auto mt-0.5 text-[8px] text-red-600 underline hover:text-red-800">ยกเลิก</button>
                  </div>
                ` : `
                  <div class="h-6"></div>
                  <p>( <span>${formatTraineeNameWithTitle(maskText(profileData.traineeName))}</span> )</p>
                  <p class="font-semibold text-slate-700">คนพิการผู้ฝึกภาคปฏิบัติ</p>
                  <p class="text-slate-500">วัน........เดือน................พ.ศ. ..............</p>
                  <button type="button" onclick="openSignatureModal(${weekNum}, 'trainee')" class="no-print mt-1 px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] font-bold shadow-xs flex items-center space-x-1 mx-auto transition">
                    <i class="fa-solid fa-pen-nib text-amber-300"></i>
                    <span>ลงนามดิจิทัล (คนพิการ)</span>
                  </button>
                `}
              </div>

              <!-- Supervisor Signature -->
              <div class="text-center text-[10px] space-y-1 md:pl-2">
                <p class="leading-tight">ขอรับรองว่ารายงานฉบับนี้เป็นความจริงทุกประการ</p>
                ${securityState.signatures && securityState.signatures[weekNum] ? `
                  <div class="my-1">
                    <img src="${securityState.signatures[weekNum].image}" class="h-10 mx-auto object-contain -mb-2">
                    <p class="border-b border-slate-700 w-36 mx-auto"></p>
                  </div>
                  <p>( <span>${maskText(profileData.supervisorName) || '.............................................'}</span> )</p>
                  <p class="text-slate-700 text-[9px]">ตำแหน่ง <span class="font-medium">${profileData.supervisorPos || 'ผู้ควบคุมงาน'}</span></p>
                  <p class="font-semibold text-slate-800">ผู้ควบคุมงาน</p>
                  <div class="mt-1 p-1 bg-emerald-50 border border-emerald-300 rounded text-[9px] text-emerald-800 leading-tight">
                    <i class="fa-solid fa-shield-check mr-1 text-emerald-600"></i>
                    <span>อนุมัติ & ล็อค: ${securityState.signatures[weekNum].timestamp}</span>
                    ${!isTrainee ? `
                      <button type="button" onclick="unlockWeekSignature(${weekNum})" class="no-print block mx-auto mt-0.5 text-[8px] text-red-600 underline hover:text-red-800">ปลดล็อค</button>
                    ` : ''}
                  </div>
                ` : `
                  <div class="h-6"></div>
                  <p>( <span>${maskText(profileData.supervisorName) || '.............................................'}</span> )</p>
                  <p class="text-slate-700">ตำแหน่ง <span>${profileData.supervisorPos || '...............................'}</span></p>
                  <p class="font-semibold text-slate-800">ผู้ควบคุมงาน</p>
                  ${!isTrainee ? `
                    <button type="button" onclick="openSignatureModal(${weekNum})" class="no-print mt-1 px-2.5 py-1 bg-govNavy hover:bg-govNavyLight text-white rounded text-[10px] font-bold shadow-xs flex items-center space-x-1 mx-auto transition">
                      <i class="fa-solid fa-signature text-govGold"></i>
                      <span>ลงนามดิจิทัล (ผู้ควบคุมงาน)</span>
                    </button>
                  ` : `
                    <div class="no-print mt-1 text-[10px] text-amber-600 font-medium">
                      <i class="fa-solid fa-clock-rotate-left mr-0.5"></i> รอผู้ควบคุมงานลงนาม
                    </div>
                  `}
                `}
              </div>
            </div>
          </div>

          <!-- Document Footer -->
          <div class="mt-2 pt-1 border-t border-slate-300 text-[9px] text-slate-400 flex justify-between">
            <span>เอกสารอ้างอิง: แบบบันทึกการปฏิบัติงานประจำสัปดาห์ (ฉบับเต็ม) • โครงการส่งเสริมและเตรียมความพร้อมสำหรับการจ้างงานคนพิการฯ</span>
            <span>หน้า ${toThaiNum(pageNum)} จาก ${toThaiNum(totalPageLabel)}</span>
          </div>
        </div>
      `;
    }

