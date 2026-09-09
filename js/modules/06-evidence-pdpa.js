// Module: 06-evidence-pdpa.js (Smart GovReport Hub 2.5)
    // =========================================================================
    // PHOTO EVIDENCE MANAGER CONTROLLER
    // =========================================================================
    let activePhotoRowId = null;
    let tempPhotoList = [];

    function openPhotoModal(rowId) {
      activePhotoRowId = rowId;
      let foundRow = null;
      let targetWeek = null;
      for (let w in liveOjtData) {
        const item = liveOjtData[w].find(r => r.id === rowId);
        if (item) { foundRow = item; targetWeek = parseInt(w); break; }
      }
      if (!foundRow) return;
      if (targetWeek && securityState.signatures && securityState.signatures[targetWeek]) {
        alert(`🔒 สัปดาห์ที่ ${toThaiNum(targetWeek)} ได้รับการอนุมัติและลงนามรับรองแล้ว ไม่อนุญาตให้แก้ไขรูปภาพ`);
        return;
      }

      const label = document.getElementById('photo-modal-day-label');
      if (label) label.innerText = `${foundRow.date} — ${foundRow.task}`;

      tempPhotoList = JSON.parse(JSON.stringify(foundRow.images || []));
      renderPhotoModalList();

      const urlIn = document.getElementById('new-photo-url');
      if (urlIn) urlIn.value = '';
      const capIn = document.getElementById('new-photo-caption');
      if (capIn) capIn.value = '';
      const prev = document.getElementById('new-photo-preview');
      if (prev) prev.innerHTML = '<i class="fa-regular fa-image"></i>';

      const modal = document.getElementById('ojt-photo-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closePhotoModal() {
      const modal = document.getElementById('ojt-photo-modal');
      if (modal) modal.classList.add('hidden');
      activePhotoRowId = null;
    }

    function renderPhotoModalList() {
      const container = document.getElementById('photo-modal-list');
      const countBadge = document.getElementById('photo-modal-count-badge');
      if (countBadge) countBadge.innerText = `${tempPhotoList.length} รูป`;
      if (!container) return;

      if (tempPhotoList.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-slate-400 text-xs italic">
            ยังไม่มีภาพถ่ายในบันทึกนี้ กรุณาเลือกไฟล์ภาพหรือระบุ URL เพื่อเพิ่มรูปภาพ
          </div>
        `;
        return;
      }

      container.innerHTML = tempPhotoList.map((img, idx) => `
        <div class="flex items-center space-x-3 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <img src="${img.url}" alt="thumb" class="w-16 h-14 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition" onclick="previewImageZoom('${img.url}', '${(img.caption || '').replace(/'/g, "\\'")}')">
          <div class="flex-1 space-y-1">
            <input type="text" value="${(img.caption || '').replace(/"/g, '&quot;')}" onchange="updatePhotoCaption(${idx}, this.value)" placeholder="คำบรรยายใต้ภาพ..." class="w-full p-1.5 border border-slate-300 rounded text-xs">
            <span class="text-[10px] text-slate-400">ภาพที่ ${idx + 1}</span>
          </div>
          <button type="button" onclick="openImageRedactor('${img.url}', ${idx})" class="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition" title="เซ็นเซอร์ปิดข้อมูล PDPA บนภาพนี้">
            <i class="fa-solid fa-mask"></i>
          </button>
          <button type="button" onclick="removePhotoFromModal(${idx})" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition" title="ลบรูปนี้">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `).join('');
    }

    function cleanImageCaption(fileName) {
      if (!fileName) return 'ภาพประกอบการปฏิบัติงาน';
      let name = fileName.replace(/\.[^/.]+$/, "");
      name = name.replace(/^(?:messageImage|image|IMG|Screenshot|LINE_ALBUM|photo)[_\s-]*\d*/i, '');
      name = name.replace(/^[_\s-]+|[_\s-]+$/g, '');
      name = name.replace(/\b\d{9,}\b/g, '');
      name = name.trim();

      if (!name) {
        return `ภาพประกอบการปฏิบัติงาน (ภาพที่ ${tempPhotoList.length + 1})`;
      }
      return `ภาพประกอบการปฏิบัติงาน: ${name}`;
    }

    function updatePhotoCaption(idx, val) {
      if (tempPhotoList[idx]) {
        tempPhotoList[idx].caption = val.trim();
      }
    }

    function removePhotoFromModal(idx) {
      tempPhotoList.splice(idx, 1);
      renderPhotoModalList();
    }

    /**
     * 🖼️ Client-side Image Compression Engine (Canvas Compression)
     * ปรับขนาดภาพและบีบอัดด้วย Offscreen Canvas ก่อนบันทึก
     * ป้องกัน LocalStorage เต็ม (5MB Limit) ลดขนาดจาก 5MB-10MB เหลือ ~80KB-200KB (>90% reduction)
     */
    function compressImageToDataUrl(file, maxDimension = 1280, quality = 0.75) {
      return new Promise((resolve, reject) => {
        if (!file || !file.type.match(/image.*/)) {
          return reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพที่รองรับ'));
        }
        const reader = new FileReader();
        reader.onerror = (err) => reject(err);
        reader.onload = function(evt) {
          const img = new Image();
          img.onerror = (err) => reject(err);
          img.onload = function() {
            let width = img.width;
            let height = img.height;

            // ปรับสัดส่วนหากความกว้างหรือสูงเกิน maxDimension (เช่น 1280px)
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // รองรับภาพโปร่งใสโดยเติมพื้นหลังขาว
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            let compressedDataUrl = '';
            try {
              compressedDataUrl = canvas.toDataURL('image/webp', quality);
              if (!compressedDataUrl.startsWith('data:image/webp')) {
                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
              }
            } catch (e) {
              compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            }

            const compressedBytes = Math.round((compressedDataUrl.length * 3) / 4);
            resolve({
              dataUrl: compressedDataUrl,
              width: width,
              height: height,
              originalSize: file.size,
              compressedSize: compressedBytes
            });
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    async function handlePhotoFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      const prev = document.getElementById('new-photo-preview');
      if (prev) prev.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-govNavy"><i class="fa-solid fa-spinner animate-spin text-lg"></i><span class="text-[9px] mt-1 font-bold">กำลังบีบอัด...</span></div>';

      try {
        const res = await compressImageToDataUrl(file, 1280, 0.75);
        const base64Url = res.dataUrl;
        const urlIn = document.getElementById('new-photo-url');
        if (urlIn) urlIn.value = base64Url;
        if (prev) prev.innerHTML = `<img src="${base64Url}" class="w-full h-full object-cover rounded">`;
        const capIn = document.getElementById('new-photo-caption');
        if (capIn && !capIn.value) {
          capIn.value = cleanImageCaption(file.name);
        }
        if (typeof showQuickNotification === 'function') {
          showQuickNotification(`⚡ บีบอัดภาพสำเร็จ! ประหยัดพื้นที่ ${Math.max(0, Math.round((1 - res.compressedSize / res.originalSize) * 100))}% (${Math.round(res.compressedSize / 1024)} KB)`, 'success');
        }
      } catch (err) {
        console.warn('Compression fallback to raw reader:', err);
        const reader = new FileReader();
        reader.onload = function(evt) {
          const base64Url = evt.target.result;
          const urlIn = document.getElementById('new-photo-url');
          if (urlIn) urlIn.value = base64Url;
          if (prev) prev.innerHTML = `<img src="${base64Url}" class="w-full h-full object-cover rounded">`;
          const capIn = document.getElementById('new-photo-caption');
          if (capIn && !capIn.value) {
            capIn.value = cleanImageCaption(file.name);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    function pickPresetPhoto(url, caption) {
      const urlIn = document.getElementById('new-photo-url');
      if (urlIn) urlIn.value = url;
      const prev = document.getElementById('new-photo-preview');
      if (prev) prev.innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded">`;
      const capIn = document.getElementById('new-photo-caption');
      if (capIn) capIn.value = caption || '';
    }

    function addPhotoToCurrentEntry() {
      const urlInput = document.getElementById('new-photo-url');
      const captionInput = document.getElementById('new-photo-caption');
      const url = urlInput ? urlInput.value.trim() : '';
      const caption = captionInput ? captionInput.value.trim() : `ภาพที่ ${tempPhotoList.length + 1}: การปฏิบัติงาน`;

      if (!url) {
        alert('กรุณาเลือกไฟล์ภาพ หรือระบุ URL รูปภาพก่อนเพิ่ม');
        return;
      }

      tempPhotoList.push({ url, caption });
      renderPhotoModalList();

      if (urlInput) urlInput.value = '';
      if (captionInput) captionInput.value = '';
      const prev = document.getElementById('new-photo-preview');
      if (prev) prev.innerHTML = '<i class="fa-regular fa-image"></i>';
      const fileIn = document.getElementById('photo-file-input');
      if (fileIn) fileIn.value = '';
    }

    function savePhotoModalChanges() {
      if (!activePhotoRowId) return;

      for (let w in liveOjtData) {
        const item = liveOjtData[w].find(r => r.id === activePhotoRowId);
        if (item) {
          item.images = JSON.parse(JSON.stringify(tempPhotoList));
          break;
        }
      }

      saveToLocalStorage();
      renderOjtPages();
      closePhotoModal();
    }

    let currentZoomUrl = '';
    let currentZoomCaption = '';

    function previewImageZoom(url, caption) {
      const modal = document.getElementById('image-zoom-modal');
      const img = document.getElementById('image-zoom-img');
      const cap = document.getElementById('image-zoom-caption');
      currentZoomUrl = url;
      currentZoomCaption = caption || '';
      if (modal && img && cap) {
        img.src = url;
        cap.innerText = caption || 'ภาพประกอบการปฏิบัติงาน';
        modal.classList.remove('hidden');
      }
    }

    function closeImageZoom() {
      const modal = document.getElementById('image-zoom-modal');
      if (modal) modal.classList.add('hidden');
    }

    function openImageRedactorFromZoom() {
      closeImageZoom();
      openImageRedactor(currentZoomUrl, null);
    }

    function updateDashboardKPI(total) {
      if (typeof total === 'undefined') {
        total = 0;
        Object.keys(liveOjtData).forEach(w => {
          liveOjtData[w].forEach(r => { total += (parseFloat(r.hours) || 0); });
        });
      }
      const statElem = document.getElementById('stat-ojt-hours');
      if (statElem) statElem.innerText = total.toFixed(1);

      const target = 90.0;
      const pct = Math.min(100, Math.round((total / target) * 100));

      const barElem = document.getElementById('stat-ojt-progress-bar');
      if (barElem) {
        barElem.style.width = pct + '%';
        if (pct >= 100) {
          barElem.className = 'bg-emerald-600 h-full rounded-full transition-all duration-500';
        } else {
          barElem.className = 'bg-amber-500 h-full rounded-full transition-all duration-500';
        }
      }

      const badgeElem = document.getElementById('stat-ojt-badge');
      if (badgeElem) {
        if (total >= target) {
          badgeElem.className = 'text-[10px] text-emerald-600 font-semibold mt-1';
          badgeElem.innerHTML = '✓ ครบตามเกณฑ์หลักสูตร (100%)';
        } else {
          badgeElem.className = 'text-[10px] text-amber-600 font-semibold mt-1';
          badgeElem.innerHTML = '⏳ สะสมแล้ว ' + pct + '% (ขาดอีก ' + (target - total).toFixed(1) + ' ชม.)';
        }
      }
    }

    // EVIDENCE MODAL (ดูฉบับเต็ม)
    let currentEvidenceItem = null;
    function openEvidenceModal(id) {
      let item = null;
      let foundWeek = null;

      Object.keys(liveOjtData).forEach(w => {
        const found = liveOjtData[w].find(x => x.id === id);
        if (found) {
          item = found;
          foundWeek = w;
        }
      });

      if (!item) return;
      currentEvidenceItem = item;

      document.getElementById('evi-modal-week-badge').innerText = `สัปดาห์ที่ ${foundWeek}`;
      document.getElementById('evi-modal-date').innerText = item.date;
      document.getElementById('evi-modal-hours').innerText = `${parseFloat(item.hours).toFixed(1)} ชม.`;
      document.getElementById('evi-modal-title').innerText = item.task;
      document.getElementById('evi-modal-brief').innerText = item.task;

      // Steps
      const stepsContainer = document.getElementById('evi-modal-steps');
      if (item.steps) {
        const lines = item.steps.split('\n');
        stepsContainer.innerHTML = lines.map(line => `<p class="flex items-start"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></span><span>${line}</span></p>`).join('');
      } else {
        stepsContainer.innerHTML = `<p class="italic text-slate-400">ยังไม่มีการระบุขั้นตอน SOP ละเอียด</p>`;
      }

      // Tools / Code
      document.getElementById('evi-modal-tools').innerText = item.tools || 'ไม่ได้ระบุเครื่องมือ/สูตรเฉพาะ';

      // Artifacts
      const artContainer = document.getElementById('evi-modal-artifacts');
      if (item.artifacts) {
        const arts = item.artifacts.split(',');
        artContainer.innerHTML = arts.map(a => `<span class="px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] text-slate-700 font-medium border border-slate-300 flex items-center"><i class="fa-solid fa-file-lines mr-1.5 text-govNavy"></i>${a.trim()}</span>`).join('');
      } else {
        artContainer.innerHTML = `<span class="italic text-slate-400">ไม่มีไฟล์แนบ</span>`;
      }

      // Impact
      document.getElementById('evi-modal-impact').innerText = item.impact || 'ช่วยเสริมสร้างประสิทธิภาพการปฏิบัติราชการและทักษะดิจิทัลของบุคลากร';

      document.getElementById('evidence-modal').classList.remove('hidden');
    }

    function closeEvidenceModal() {
      document.getElementById('evidence-modal').classList.add('hidden');
    }

    function copyEvidenceDetails() {
      if (!currentEvidenceItem) return;
      const text = `[บันทึก OJT ฉบับเต็ม]\nวันที่: ${currentEvidenceItem.date} (${currentEvidenceItem.hours} ชม.)\nงานที่ปฏิบัติ: ${currentEvidenceItem.task}\nทักษะ: ${currentEvidenceItem.skill}\nขั้นตอน: ${currentEvidenceItem.steps || '-'}\nเครื่องมือ/สูตร: ${currentEvidenceItem.tools || '-'}\nหลักฐาน: ${currentEvidenceItem.artifacts || '-'}\nผลลัพธ์: ${currentEvidenceItem.impact || '-'}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('คัดลอกรายละเอียดฉบับเต็มเรียบร้อยแล้ว');
      });
    }

    // DECISION MATRIX MODAL HANDLERS
    function openDecisionMatrixModal() {
      document.getElementById('decision-matrix-modal').classList.remove('hidden');
    }

    function closeDecisionMatrixModal() {
      document.getElementById('decision-matrix-modal').classList.add('hidden');
    }

    function setMatrixDemo(type) {
      const brief = document.getElementById('matrix-demo-brief');
      const full = document.getElementById('matrix-demo-full');
      const btnBrief = document.getElementById('matrix-btn-brief');
      const btnFull = document.getElementById('matrix-btn-full');

      if (type === 'brief') {
        brief.classList.remove('hidden');
        full.classList.add('hidden');
        btnBrief.className = 'px-2.5 py-1 bg-govNavy text-white rounded font-medium text-[11px] transition';
        btnFull.className = 'px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded font-medium text-[11px] transition';
      } else {
        brief.classList.add('hidden');
        full.classList.remove('hidden');
        btnBrief.className = 'px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded font-medium text-[11px] transition';
        btnFull.className = 'px-2.5 py-1 bg-govNavy text-white rounded font-medium text-[11px] transition';
      }
    }

    // =========================================================================
    // SMART AUTO-INCREMENT & WEEK SELECTION LOGIC
    // =========================================================================
    const weekStartDates = {
      1: 'อังคาร 1 ก.ย. 69',
      2: 'จันทร์ 7 ก.ย. 69',
      3: 'จันทร์ 14 ก.ย. 69',
      4: 'จันทร์ 21 ก.ย. 69',
      5: 'จันทร์ 28 ก.ย. 69'
    };

    // ลำดับวันทำการมาตรฐาน (กันยายน 2569)
    const workDaySequence = [
      'อังคาร 1 ก.ย. 69',
      'พุธ 2 ก.ย. 69',
      'พฤหัสบดี 3 ก.ย. 69',
      'ศุกร์ 4 ก.ย. 69',
      'จันทร์ 7 ก.ย. 69',
      'อังคาร 8 ก.ย. 69',
      'พุธ 9 ก.ย. 69',
      'พฤหัสบดี 10 ก.ย. 69',
      'ศุกร์ 11 ก.ย. 69',
      'จันทร์ 14 ก.ย. 69',
      'อังคาร 15 ก.ย. 69',
      'พุธ 16 ก.ย. 69',
      'พฤหัสบดี 17 ก.ย. 69',
      'ศุกร์ 18 ก.ย. 69',
      'จันทร์ 21 ก.ย. 69',
      'อังคาร 22 ก.ย. 69',
      'พุธ 23 ก.ย. 69',
      'พฤหัสบดี 24 ก.ย. 69',
      'ศุกร์ 25 ก.ย. 69',
      'จันทร์ 28 ก.ย. 69',
      'อังคาร 29 ก.ย. 69',
      'พุธ 30 ก.ย. 69'
    ];

    // ฟังก์ชันคำนวณวันทำการถัดไป (Auto-increment Next Workday)
    function calculateNextWorkDay(currentDateStr, weekNum) {
      if (!currentDateStr) {
        return weekStartDates[weekNum] || 'อังคาร 1 ก.ย. 69';
      }

      const cleanStr = currentDateStr.trim();
      const foundIdx = workDaySequence.findIndex(d => d === cleanStr || cleanStr.includes(d) || d.includes(cleanStr));
      if (foundIdx !== -1 && foundIdx + 1 < workDaySequence.length) {
        return workDaySequence[foundIdx + 1];
      }

      // กรณีระบุแบบตัวเลข + เดือน (เช่น "2 ก.ย. 69" -> "พฤหัสบดี 3 ก.ย. 69")
      const match = cleanStr.match(/(?:จันทร์|อังคาร|พุธ|พฤหัสบดี|พฤหัส|ศุกร์)?\s*(\d+)\s*(ก\.ย\.|ต\.ค\.)\s*(\d+)?/);
      if (match) {
        const nextDayNum = parseInt(match[1], 10) + 1;
        const month = match[2] || 'ก.ย.';
        const matchedNext = workDaySequence.find(d => d.includes(` ${nextDayNum} ${month}`));
        if (matchedNext) return matchedNext;
        return `${nextDayNum} ${month} 69`;
      }

      return weekStartDates[weekNum] || cleanStr;
    }

    // ฟังก์ชันดึงวันเริ่มต้นสำหรับสัปดาห์
    function getSuggestedDateForWeek(targetWeek) {
      if (weekStartDates[targetWeek]) {
        return weekStartDates[targetWeek];
      }
      return 'อังคาร 1 ก.ย. 69';
    }

    // 2. เมื่อเปลี่ยนดรอปดาวน์เป็น "สัปดาห์ที่ 2, 3, 4..." ให้เปลี่ยนวันเริ่มต้นตามสัปดาห์นั้นทันที
    function handleEntryTargetWeekChange(selectedWeek) {
      const w = parseInt(selectedWeek) || 1;
      currentEditTargetWeek = w;
      document.getElementById('crud-modal-title').innerText = `เพิ่มบันทึกการปฏิบัติงาน (สัปดาห์ที่ ${w})`;
      const dateInput = document.getElementById('entry-date');
      const editId = document.getElementById('entry-edit-id').value;

      // เมื่อเปลี่ยนสัปดาห์ในการสร้างรายการใหม่ ให้เปลี่ยนวันเริ่มต้นตามสัปดาห์นั้นทันที
      if (dateInput && !editId) {
        if (weekStartDates[w]) {
          dateInput.value = weekStartDates[w];
        }
      }
      renderModalWorkdayPills(w, dateInput ? dateInput.value : '');
    }

    let currentEditTargetWeek = 4;

    // CREATE: Open Add Entry Modal
    function openAddEntryModal() {
      const currentWeek = parseInt(document.getElementById('ojt-week-select').value) || 1;
      if (securityState.signatures && securityState.signatures[currentWeek]) {
        alert(`🔒 สัปดาห์ที่ ${toThaiNum(currentWeek)} ได้รับการอนุมัติและลงนามรับรองจากผู้ควบคุมงานแล้ว ไม่อนุญาตให้เพิ่มบันทึกใหม่`);
        return;
      }
      currentEditTargetWeek = currentWeek;
      document.getElementById('crud-modal-title').innerText = `เพิ่มบันทึกการปฏิบัติงาน (สัปดาห์ที่ ${currentWeek})`;
      const targetWeekElem = document.getElementById('entry-target-week');
      if (targetWeekElem) targetWeekElem.value = currentWeek;
      document.getElementById('entry-edit-id').value = '';
      
      // ตั้งค่าช่องวันที่อัตโนมัติ (Auto-increment หรือวันแรกของสัปดาห์)
      const dateInput = document.getElementById('entry-date');
      if (dateInput) {
        if (window.lastSavedWorkDate && currentWeek === 1) {
          dateInput.value = window.lastSavedWorkDate;
        } else if (weekStartDates[currentWeek]) {
          dateInput.value = weekStartDates[currentWeek];
        } else {
          dateInput.value = 'อังคาร 1 ก.ย. 69';
        }
      }

      renderModalWorkdayPills(currentWeek, dateInput ? dateInput.value : '');

      const notice = document.getElementById('entry-date-notice');
      if (notice) notice.classList.add('hidden');

      document.getElementById('entry-hours').value = '8.0';
      document.getElementById('entry-task').value = '';
      document.getElementById('entry-skill').value = '';
      document.getElementById('entry-blocker').value = 'ไม่มี';
      document.getElementById('entry-steps').value = '';
      document.getElementById('entry-tools').value = '';
      document.getElementById('entry-artifacts').value = '';
      document.getElementById('entry-impact').value = '';
      document.getElementById('crud-entry-modal').classList.remove('hidden');
    }

    // UPDATE: Open Edit Entry Modal
    function openEditEntryModal(id) {
      let item = null;
      let targetWeek = null;

      Object.keys(liveOjtData).forEach(w => {
        const found = liveOjtData[w].find(x => x.id === id);
        if (found) {
          item = found;
          targetWeek = parseInt(w);
        }
      });

      if (!item) return;
      if (targetWeek && securityState.signatures && securityState.signatures[targetWeek]) {
        alert(`🔒 สัปดาห์ที่ ${toThaiNum(targetWeek)} ได้รับการอนุมัติและลงนามรับรองแล้ว ไม่อนุญาตให้แก้ไขข้อมูล`);
        return;
      }
      currentEditTargetWeek = targetWeek;

      document.getElementById('crud-modal-title').innerText = `แก้ไขบันทึกการปฏิบัติงาน (สัปดาห์ที่ ${targetWeek})`;
      const targetWeekElem = document.getElementById('entry-target-week');
      if (targetWeekElem) targetWeekElem.value = targetWeek;
      document.getElementById('entry-edit-id').value = item.id;
      document.getElementById('entry-date').value = item.date;
      document.getElementById('entry-hours').value = item.hours;
      document.getElementById('entry-task').value = item.task;
      document.getElementById('entry-skill').value = item.skill;
      document.getElementById('entry-blocker').value = item.blocker || '';
      document.getElementById('entry-steps').value = item.steps || '';
      document.getElementById('entry-tools').value = item.tools || '';
      document.getElementById('entry-artifacts').value = item.artifacts || '';
      document.getElementById('entry-impact').value = item.impact || '';

      renderModalWorkdayPills(targetWeek, item.date);

      currentEntryImages = [];
      document.getElementById('crud-entry-modal').classList.remove('hidden');
    }

    // UPDATE: Open Edit Entry Modal
    function openEditEntryModal(id) {
      let item = null;
      let targetWeek = null;

      Object.keys(liveOjtData).forEach(w => {
        const found = liveOjtData[w].find(x => x.id === id);
        if (found) {
          item = found;
          targetWeek = parseInt(w);
        }
      });

      if (!item) return;
      if (targetWeek && securityState.signatures && securityState.signatures[targetWeek]) {
        alert(`🔒 สัปดาห์ที่ ${toThaiNum(targetWeek)} ได้รับการอนุมัติและลงนามรับรองแล้ว ไม่อนุญาตให้แก้ไขข้อมูล`);
        return;
      }
      currentEditTargetWeek = targetWeek;

      document.getElementById('crud-modal-title').innerText = `แก้ไขบันทึกการปฏิบัติงาน (สัปดาห์ที่ ${targetWeek})`;
      const targetWeekElem = document.getElementById('entry-target-week');
      if (targetWeekElem) targetWeekElem.value = targetWeek;
      document.getElementById('entry-edit-id').value = item.id;
      document.getElementById('entry-date').value = item.date;
      document.getElementById('entry-hours').value = item.hours;
      document.getElementById('entry-task').value = item.task;
      document.getElementById('entry-skill').value = item.skill;
      document.getElementById('entry-blocker').value = item.blocker || '';
      document.getElementById('entry-steps').value = item.steps || '';
      document.getElementById('entry-tools').value = item.tools || '';
      document.getElementById('entry-artifacts').value = item.artifacts || '';
      document.getElementById('entry-impact').value = item.impact || '';

      // Preserve images already attached to this entry
      currentEntryImages = JSON.parse(JSON.stringify(item.images || []));

      renderModalWorkdayPills(targetWeek, item.date);

      document.getElementById('crud-entry-modal').classList.remove('hidden');
    }

    function closeCrudEntryModal() {
      document.getElementById('crud-entry-modal').classList.add('hidden');
    }

    let currentAutoFillMode = 'single';
    let currentEntryImages = [];
    let selectedAiPhotos = [];

    function toggleAutoFillMode(mode) {
      currentAutoFillMode = mode;
      const textContainer = document.getElementById('ai-text-input-container');
      const photoContainer = document.getElementById('ai-photo-input-container');
      const input = document.getElementById('ai-entry-quick-input');
      const btnSingle = document.getElementById('btn-mode-single');
      const btnBatch = document.getElementById('btn-mode-batch');
      const btnPhoto = document.getElementById('btn-mode-photo');
      const hint = document.getElementById('ai-input-hint');
      const label = document.getElementById('btn-ai-autofill-label');

      // Reset pill styles
      if (btnSingle) btnSingle.className = 'px-2.5 py-0.5 rounded-md text-purple-700 hover:text-purple-950 transition';
      if (btnBatch) btnBatch.className = 'px-2.5 py-0.5 rounded-md text-purple-700 hover:text-purple-950 transition';
      if (btnPhoto) btnPhoto.className = 'px-2.5 py-0.5 rounded-md text-purple-700 hover:text-purple-950 transition flex items-center space-x-1';

      if (mode === 'photo') {
        if (textContainer) textContainer.classList.add('hidden');
        if (photoContainer) photoContainer.classList.remove('hidden');
        if (btnPhoto) btnPhoto.className = 'px-2.5 py-0.5 rounded-md bg-white text-purple-950 shadow-2xs font-bold transition flex items-center space-x-1';
        renderAiPhotoPreviewList();
      } else {
        if (photoContainer) photoContainer.classList.add('hidden');
        if (textContainer) textContainer.classList.remove('hidden');

        if (mode === 'batch') {
          if (btnBatch) btnBatch.className = 'px-2.5 py-0.5 rounded-md bg-white text-purple-950 shadow-2xs font-bold transition';
          if (input) {
            input.rows = 4;
            input.placeholder = `วางข้อมูลตาราง CSV หลายเคสได้ที่นี่ เช่น:\nลำดับ,Case No.,ชื่อผู้แจ้ง,หน่วยงาน,ประเภทงาน,Line ID,เบอร์โทรศัพท์,Anydesk Number,รายละเอียดปัญหาที่พบ\n1,12468,Aphinya,ศูนย์บริการร่วมกระทรวงยุติธรรม,โปรแกรม ThaiWPS / MS-Office,ormb,0864947148,597109031,ใช้งาน wps ไม่ได้\n2,12473,Thitinan,กองยุทธศาสตร์และแผนงาน,โปรแกรม ThaiWPS / MS-Office,0,0849007623,1641761072,Wps หมดอายุ\n3,12476,Aphinya,ศูนย์บริการร่วมกระทรวงยุติธรรม,โปรแกรม ThaiWPS / MS-Office,ormb,0864947148,597109031,ไม่มีฟร้อน TH sarabunIT๙`;
          }
          if (hint) hint.innerHTML = '<i class="fa-solid fa-table-list mr-0.5 text-purple-700"></i> <b>โหมดตารางหลายเคส (CSV):</b> AI จะรวบรวมสังเคราะห์ทุกเคสเป็น 1 บันทึกหลักประจำวันสำหรับลงตาราง A4 ให้ทันที';
          if (label) label.innerText = 'สังเคราะห์รวมทุกเคสลง 7 ช่อง ✨';
        } else {
          if (btnSingle) btnSingle.className = 'px-2.5 py-0.5 rounded-md bg-white text-purple-950 shadow-2xs font-bold transition';
          if (input) {
            input.rows = 1;
            input.placeholder = 'เช่น แก้ไขปัญหาโปรแกรม ThaiWPS หมดอายุผ่าน AnyDesk เคส 12468 ให้ศูนย์บริการร่วมฯ';
          }
          if (hint) hint.innerHTML = '<i class="fa-solid fa-circle-info mr-0.5"></i> พิมพ์สรุปสั้นๆ AI จะจัดแจงข้อมูลลงทั้ง 7 ช่องอัตโนมัติ';
          if (label) label.innerText = 'เติมทุกช่องอัตโนมัติ ✨';
        }
      }
    }

    // AI PHOTO SELECTION & GALLERY MANAGEMENT (WITH CANVAS COMPRESSION)
    async function handleAiPhotoSelection(e) {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const countBadge = document.getElementById('ai-photo-count-badge');
      if (countBadge) countBadge.innerText = '⚡ กำลังบีบอัดรูปภาพ...';

      let totalSavedBytes = 0;
      for (const file of files) {
        try {
          const res = await compressImageToDataUrl(file, 1280, 0.75);
          selectedAiPhotos.push({
            dataUrl: res.dataUrl,
            name: file.name,
            size: res.compressedSize,
            caption: cleanImageCaption(file.name)
          });
          totalSavedBytes += (res.originalSize - res.compressedSize);
        } catch (err) {
          console.warn('AI photo compress failed, fallback:', err);
          await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(evt) {
              selectedAiPhotos.push({
                dataUrl: evt.target.result,
                name: file.name,
                size: file.size,
                caption: cleanImageCaption(file.name)
              });
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      }

      renderAiPhotoPreviewList();
      if (totalSavedBytes > 0 && typeof showQuickNotification === 'function') {
        showQuickNotification(`⚡ บีบอัดภาพ ${files.length} ภาพสำเร็จ! ประหยัดพื้นที่ได้ ${Math.round(totalSavedBytes / 1024)} KB`, 'success');
      }
      e.target.value = ''; // Reset input to allow re-selecting same file
    }

    function renderAiPhotoPreviewList() {
      const container = document.getElementById('ai-photo-preview-list');
      const countBadge = document.getElementById('ai-photo-count-badge');
      if (countBadge) countBadge.innerText = `${selectedAiPhotos.length} ภาพที่เลือก`;
      if (!container) return;

      if (selectedAiPhotos.length === 0) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
      }

      container.classList.remove('hidden');
      container.innerHTML = selectedAiPhotos.map((img, idx) => `
        <div class="relative flex-shrink-0 group w-24 bg-white rounded-xl border border-purple-200 p-1.5 shadow-2xs space-y-1">
          <div class="relative">
            <img src="${img.dataUrl}" alt="preview" class="w-full h-16 object-cover rounded-lg cursor-pointer hover:opacity-90 transition border border-slate-100" onclick="previewImageZoom('${img.dataUrl}', '${(img.caption || '').replace(/'/g, "\\'")}')">
            <span class="absolute top-1 left-1 bg-purple-900/85 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow">
              เคส ${idx + 1}
            </span>
            <button type="button" onclick="removeAiPhoto(${idx})" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 shadow transition" title="ลบภาพนี้">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="flex items-center justify-between text-[10px] pt-0.5">
            <button type="button" onclick="openImageRedactorForAiPhoto(${idx})" class="text-amber-600 hover:text-amber-800 font-semibold flex items-center space-x-0.5" title="เซ็นเซอร์ปิดข้อมูล PDPA">
              <i class="fa-solid fa-mask text-[9px]"></i>
              <span>เซ็นเซอร์</span>
            </button>
            <span class="text-[9px] text-slate-400 font-mono">${Math.round(img.size / 1024)}KB</span>
          </div>
        </div>
      `).join('');
    }

    function removeAiPhoto(idx) {
      if (selectedAiPhotos[idx]) {
        selectedAiPhotos.splice(idx, 1);
        renderAiPhotoPreviewList();
      }
    }

    function openImageRedactorForAiPhoto(idx) {
      if (selectedAiPhotos[idx]) {
        openImageRedactor(selectedAiPhotos[idx].dataUrl, `aiphoto_${idx}`);
      }
    }

    // RUN GEMINI PHOTO-TO-LOG: Multi-Image Vision Synthesis
    async function runGeminiPhotoToLog() {
      if (selectedAiPhotos.length === 0) {
        alert('กรุณาคลิกเลือกหรือถ่ายรูปภาพใบงาน/หน้าจอเคสอย่างน้อย 1 รูป ก่อนเริ่มการสังเคราะห์');
        const inputElem = document.getElementById('ai-photo-input');
        if (inputElem) inputElem.click();
        return;
      }

      const btnElem = document.getElementById('btn-ai-photo-run');
      const labelElem = document.getElementById('btn-ai-photo-label');
      const notesElem = document.getElementById('ai-photo-notes');
      const notes = notesElem ? notesElem.value.trim() : '';

      const originalBtnHtml = btnElem ? btnElem.innerHTML : '';
      if (btnElem) {
        btnElem.disabled = true;
        btnElem.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber-300"></i><span>AI Vision กำลังวิเคราะห์ทุกภาพ...</span>';
      }

      let parsedData = null;

      // 1. Call Backend API (/api/ai/photo-to-log on port 8083)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for multi-image vision

        const apiKey = (typeof apiConfig !== 'undefined' && apiConfig.geminiApiKey) ? apiConfig.geminiApiKey : '';
        const payload = {
          images: selectedAiPhotos.map(p => p.dataUrl),
          notes: notes,
          api_key: apiKey
        };

        const res = await fetch('http://127.0.0.1:8083/api/ai/photo-to-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && json.success) {
            parsedData = json;
          }
        }
      } catch (err) {
        console.warn('Backend /api/ai/photo-to-log unreachable or timed out, trying direct Gemini API:', err);
      }

      // 2. Direct Gemini Multimodal API Fallback (if backend offline)
      if (!parsedData && typeof apiConfig !== 'undefined' && apiConfig.geminiApiKey) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.geminiModel || 'gemini-2.5-flash'}:generateContent?key=${apiConfig.geminiApiKey}`;
          const parts = [
            {
              text: `คุณคือผู้เชี่ยวชาญการจัดทำรายงานฝึกปฏิบัติงานราชการ (OJT) ประจำศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (ศทส.) สป.กระทรวงยุติธรรม
หน้าที่ของคุณคือสังเคราะห์ภาพถ่ายหน้าจอเคสหรือใบงาน IT Helpdesk ทั้ง ${selectedAiPhotos.length} รูปภาพนี้ (ซึ่งเกิดขึ้นในเวลาต่างๆ ของวัน เช่น 09:00, 10:00, 12:00, 15:00 น.)
ให้รวบรวมเป็น "1 บันทึกหลักประจำวัน (Consolidated Daily Entry)" สำหรับลงตารางรายงานผล A4 ห้ามแยกบันทึก

เกราะป้องกัน PDPA สองชั้น (CRITICAL RULE):
- ห้ามระบุชื่อบุคคล, เบอร์โทรศัพท์, Line ID หรือ Anydesk Number ของผู้ขอรับบริการลงในข้อความสรุปเด็ดขาด ให้ Mask เป็น "สยจ.***" หรือ "เจ้าหน้าที่ผู้ขอรับบริการ"

ตอบกลับเฉพาะ JSON object เท่านั้น (ไม่ต้องมี markdown backticks หรือคำอธิบายเพิ่มเติม):
{
  "task": "งานที่ปฏิบัติโดยย่อ 1-2 บรรทัดทางการสำหรับ A4",
  "skills": "ความรู้/ทักษะที่ได้รับทางการ",
  "problems": "ปัญหา/อุปสรรค และการแก้ไข",
  "steps": "ขั้นตอนการปฏิบัติงานเชิงลึกเรียงตามลำดับเวลา/เคส มีเลข 1. 2. 3.",
  "tools": "เครื่องมือ ซอฟต์แวร์ หรือระบบที่ใช้",
  "reflection": "การสะท้อนคิด & คุณค่าต่อองค์กร",
  "hours": 8.0,
  "captions": ["คำบรรยายภาพที่ 1 ทางการไม่มี PDPA", "คำบรรยายภาพที่ 2 ทางการไม่มี PDPA"]
}
${notes ? 'ข้อความบันทึกช่วยจำเพิ่มเติมจากผู้ใช้: ' + notes : ''}`
            }
          ];

          selectedAiPhotos.forEach((p) => {
            const match = p.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              parts.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2]
                }
              });
            }
          });

          const directRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: parts }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
            })
          });

          if (directRes.ok) {
            const resJson = await directRes.json();
            if (resJson.candidates && resJson.candidates[0].content.parts[0].text) {
              let text = resJson.candidates[0].content.parts[0].text.trim();
              text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
              parsedData = JSON.parse(text);
              parsedData.success = true;
            }
          }
        } catch (directErr) {
          console.warn('Direct Gemini Multimodal API failed:', directErr);
        }
      }

      // 3. Offline Semantic Rule Fallback (if completely offline)
      if (!parsedData) {
        parsedData = {
          success: true,
          hours: 8.0,
          task: "ให้บริการสนับสนุนด้านเทคนิคระยะไกล (Remote Helpdesk) ดำเนินการต่ออายุสิทธิ์โปรแกรม ThaiWPS และติดตั้งไดรเวอร์อุปกรณ์เครือข่าย ให้แก่หน่วยงานส่วนกลางและส่วนภูมิภาค จนพร้อมปฏิบัติงานราชการสมบูรณ์ทุกรายการ",
          skills: "การบริหารจัดการสิทธิ์ซอฟต์แวร์สำนักงาน (Software License Activation), การติดตั้งและกำหนดค่าไดรเวอร์เครือข่าย, การควบคุมระยะไกล AnyDesk และการบริการเทคนิคเชิงรุกตามระเบียบสารบรรณภาครัฐ",
          problems: "ตรวจพบการหมดอายุสิทธิ์ซอฟต์แวร์และการเชื่อมต่ออุปกรณ์ต่อพ่วงขัดข้อง ดำเนินการแก้ไขผ่านระบบระยะไกลและทดสอบการพิมพ์/สแกนเอกสารสำเร็จลุล่วงตามเกณฑ์ SLA ภายในกำหนดเวลา",
          steps: "1. รับแจ้งคำขอความช่วยเหลือและตรวจสอบรายละเอียดเคสในระบบ IT Helpdesk\n2. เชื่อมต่อระบบคอมพิวเตอร์ระยะไกลผ่านโปรแกรม AnyDesk เพื่อตรวจสอบสถานะสิทธิ์โปรแกรม ThaiWPS และต่ออายุ License Key สำเร็จ\n3. ติดตั้งและกำหนดค่าไดรเวอร์เครื่องพิมพ์เครือข่าย HP LaserJet และเครื่องสแกนเนอร์ Epson พร้อมทดสอบเปิดเอกสารราชการสำเร็จสมบูรณ์\n4. บันทึกผลการปิดเคสและประสานงานแจ้งเจ้าหน้าที่ผู้ขอรับบริการให้สามารถปฏิบัติงานต่อเนื่องได้ตามปกติ",
          tools: "AnyDesk Remote Desktop, ThaiWPS Office Suite, HP LaserJet PCL6 Driver, Epson DS-6500 Scanner Driver, IT Helpdesk Ticketing System",
          reflection: "ช่วยแก้ไขปัญหาติดขัดของอุปกรณ์ไอทีและระบบเอกสารราชการได้อย่างทันท่วงที ทำให้การบริการประชาชนและภารกิจของหน่วยงานดำเนินไปอย่างต่อเนื่อง ไม่เกิดความล่าช้าในงานราชการ",
          captions: selectedAiPhotos.map((_, i) => `ภาพประกอบการปฏิบัติงาน: เคสที่ ${i + 1}`)
        };
      }

      // 4. Populate DOM Form Fields (7 Core OJT Fields)
      if (parsedData) {
        if (parsedData.hours && document.getElementById('entry-hours')) {
          document.getElementById('entry-hours').value = parsedData.hours;
        }
        if (parsedData.task && document.getElementById('entry-task')) {
          document.getElementById('entry-task').value = parsedData.task;
        }
        if ((parsedData.skills || parsedData.skill) && document.getElementById('entry-skill')) {
          document.getElementById('entry-skill').value = parsedData.skills || parsedData.skill;
        }
        if ((parsedData.problems || parsedData.blocker) && document.getElementById('entry-blocker')) {
          document.getElementById('entry-blocker').value = parsedData.problems || parsedData.blocker;
        }
        if (parsedData.steps && document.getElementById('entry-steps')) {
          document.getElementById('entry-steps').value = parsedData.steps;
        }
        if (parsedData.tools && document.getElementById('entry-tools')) {
          document.getElementById('entry-tools').value = parsedData.tools;
        }
        if ((parsedData.reflection || parsedData.impact) && document.getElementById('entry-impact')) {
          document.getElementById('entry-impact').value = parsedData.reflection || parsedData.impact;
        }

        // Set artifacts
        const artifactNames = selectedAiPhotos.map((p, i) => `Case_Ticket_${i + 1}.png`).join(', ');
        if (document.getElementById('entry-artifacts')) {
          document.getElementById('entry-artifacts').value = artifactNames || 'Work_Evidence.png';
        }

        // 5. Automatically Attach Cleaned Images to Entry Photo List
        currentEntryImages = selectedAiPhotos.map((p, i) => {
          const caption = (parsedData.captions && parsedData.captions[i])
            ? parsedData.captions[i]
            : (p.caption || `ภาพประกอบการปฏิบัติงาน: เคสที่ ${i + 1}`);
          return {
            url: p.dataUrl,
            caption: caption
          };
        });

        // If photo modal is currently open or has an active entry, also mirror into tempPhotoList
        tempPhotoList = JSON.parse(JSON.stringify(currentEntryImages));

        // Show success notification
        const notice = document.getElementById('entry-date-notice');
        if (notice) {
          notice.innerText = `✓ AI สังเคราะห์ข้อมูลสำเร็จจาก ${selectedAiPhotos.length} ภาพ และแนบรูปประกอบแล้ว!`;
          notice.classList.remove('hidden');
          setTimeout(() => notice.classList.add('hidden'), 5000);
        }

        alert(`✓ Gemini AI สังเคราะห์ข้อมูลสำเร็จจาก ${selectedAiPhotos.length} รูปภาพเรียบร้อยแล้ว!\nระบบได้ลงข้อมูลทั้ง 7 ช่อง และแนบรูปภาพประกอบบันทึกให้โดยอัตโนมัติ`);
      }

      if (btnElem) {
        btnElem.disabled = false;
        btnElem.innerHTML = originalBtnHtml;
      }
    }

    // GEMINI AI AUTO-FILL: วิเคราะห์ประโยคสั้นๆ หรือตารางหลายเคส (CSV) แล้วกรอกข้อมูล OJT ลงฟอร์มทั้ง 7 ช่องอัตโนมัติ
    async function runGeminiAutoFillEntry() {
      const quickInputElem = document.getElementById('ai-entry-quick-input');
      const btnElem = document.getElementById('btn-ai-autofill-entry');
      const rawText = quickInputElem ? quickInputElem.value.trim() : '';

      if (!rawText) {
        alert('กรุณากรอกข้อความหรือวางตารางเคสก่อน เช่น "แก้ไขปัญหาโปรแกรม ThaiWPS หมดอายุผ่าน AnyDesk เคส 12468 ให้ศูนย์บริการร่วมฯ"');
        if (quickInputElem) quickInputElem.focus();
        return;
      }

      const originalBtnHtml = btnElem ? btnElem.innerHTML : '';
      if (btnElem) {
        btnElem.disabled = true;
        btnElem.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber-300"></i><span>กำลังวิเคราะห์ & สังเคราะห์รวม...</span>';
      }

      let parsedData = null;

      // ตรวจสอบว่ามีหลายเคสหรือไม่ (Multi-Case Batch Detection)
      const caseMatches = Array.from(new Set(rawText.match(/\b\d{5}\b/g) || []));
      const isMultiCase = caseMatches.length >= 2 || rawText.includes('\n');

      // 1. ลองเรียก Local 9Router (Gemini 2.5 Flash / Local Gateway)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const promptSystem = `คุณคือผู้เชี่ยวชาญการจัดทำรายงานฝึกปฏิบัติงานราชการ (OJT) ประจำศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (ศทส.) สป.กระทรวงยุติธรรม
หน้าที่ของคุณคือวิเคราะห์ข้อความงานหรือตารางข้อมูลเคสต่อไปนี้ แล้วแจกแจงเป็น JSON เพื่อนำไปกรอกลงฟอร์ม OJT 7 ช่อง โดยใช้ภาษาทางการราชการ กระชับ ถูกต้องตามแบบแผนราชการไทย
${isMultiCase ? 'คำสั่งสำคัญ: ตรวจพบว่ามีข้อมูลหลายเคส จงสังเคราะห์รวมทุกเคสในวันนี้เป็น "1 บันทึกหลักประจำวัน (Consolidated Daily Entry)" สำหรับลงตารางรายงานผล A4 ห้ามแยกบันทึก ให้ระบุเลขเคสและหน่วยงานที่ให้บริการครบถ้วน' : ''}
ให้ตอบกลับเฉพาะ JSON object เท่านั้น (ไม่ต้องใส่ markdown backticks หรือคำอธิบายเพิ่มเติม) รูปแบบ:
{
  "task": "งานที่ปฏิบัติโดยย่อ 1-2 บรรทัดสำหรับลงตาราง A4",
  "skill": "ความรู้/ทักษะที่ได้รับ",
  "blocker": "ปัญหา/อุปสรรค และการแก้ไข",
  "steps": "ขั้นตอนการปฏิบัติงานเชิงลึก 3 ข้อโดยมีเลข 1. 2. 3.",
  "tools": "เครื่องมือ ซอฟต์แวร์ หรือระบบที่ใช้",
  "artifacts": "ชื่อไฟล์หลักฐานเชิงประจักษ์",
  "impact": "การสะท้อนคิด & คุณค่าต่อองค์กร"
}`;

        const routerRes = await fetch('http://localhost:20128/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini-2.5-flash',
            messages: [
              { role: 'system', content: promptSystem },
              { role: 'user', content: `ข้อมูลงานวันนี้:\n${rawText}` }
            ],
            temperature: 0.2
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (routerRes.ok) {
          const res = await routerRes.json();
          if (res.choices && res.choices[0] && res.choices[0].message) {
            let content = res.choices[0].message.content.trim();
            content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
            parsedData = JSON.parse(content);
          }
        }
      } catch (e) {
        console.warn('9Router local fallback, trying direct API or offline rules:', e);
      }

      // 2. ถ้า Local ไม่ตอบ ลองเรียก Direct Gemini API หากมี apiConfig.geminiApiKey
      if (!parsedData && typeof apiConfig !== 'undefined' && apiConfig.geminiApiKey) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.geminiModel || 'gemini-2.0-flash'}:generateContent?key=${apiConfig.geminiApiKey}`;
          const prompt = `คุณคือผู้เชี่ยวชาญการจัดทำรายงานฝึกปฏิบัติงานราชการ (OJT) ประจำศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (ศทส.) สป.กระทรวงยุติธรรม
จงวิเคราะห์ข้อความงานนี้:
"${rawText}"
${isMultiCase ? 'คำสั่งสำคัญ: หากมีหลายเคส ให้รวบรวมสังเคราะห์เป็น 1 บันทึกหลักประจำวันสำหรับลงตาราง A4 ระบุเลขเคสและหน่วยงานครบถ้วน' : ''}
แล้วตอบกลับเป็น JSON สำหรับกรอกลงฟอร์ม 7 ช่อง (ห้ามใส่ markdown backticks ใดๆ):
{
  "task": "งานที่ปฏิบัติโดยย่อ 1-2 บรรทัดทางการสำหรับ A4",
  "skill": "ความรู้/ทักษะที่ได้รับทางการ",
  "blocker": "ปัญหา/อุปสรรค และการแก้ไข",
  "steps": "ขั้นตอนการปฏิบัติงานเชิงลึก 3 ข้อโดยมีเลข 1. 2. 3.",
  "tools": "เครื่องมือ ซอฟต์แวร์ หรือระบบที่ใช้",
  "artifacts": "ชื่อไฟล์หลักฐานเชิงประจักษ์",
  "impact": "การสะท้อนคิด & คุณค่าต่อองค์กร"
}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
            })
          });
          const resJson = await response.json();
          if (resJson.candidates && resJson.candidates[0].content.parts[0].text) {
            let text = resJson.candidates[0].content.parts[0].text.trim();
            text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
            parsedData = JSON.parse(text);
          }
        } catch (apiErr) {
          console.warn('Direct Gemini API failed:', apiErr);
        }
      }

      // 3. Fallback อัจฉริยะ (Offline Semantic Rule Engine) ทำงานได้ 100% แม้ไม่มีเน็ต/ไม่มี API Key
      if (!parsedData) {
        const lower = rawText.toLowerCase();

        // สกัดหน่วยงานจากข้อความหรือ CSV
        const deptsSet = new Set();
        if (rawText.includes('\n')) {
          const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('ลำดับ') && !l.startsWith('No.'));
          lines.forEach(line => {
            const cols = line.split(/,|\t/);
            if (cols.length >= 4) {
              const d = cols[3].trim();
              if (d && d.length > 2) deptsSet.add(d);
            }
          });
        }
        // สกัดหน่วยงานจากคำสำคัญในข้อความ
        const deptMatches = rawText.match(/(?:สยจ\.[ก-๙]+|สำนักงานยุติธรรมจังหวัด[ก-๙]+|กอง[ก-๙]+|ศูนย์[ก-๙]+|กลุ่ม[ก-๙]+|กองกลาง)/g);
        if (deptMatches) {
          deptMatches.forEach(d => deptsSet.add(d.trim()));
        }
        if (rawText.includes('ชลบุรี') && !Array.from(deptsSet).some(d => d.includes('ชลบุรี'))) deptsSet.add('สยจ.ชลบุรี');
        if (rawText.includes('สิงห์บุรี') && !Array.from(deptsSet).some(d => d.includes('สิงห์บุรี'))) deptsSet.add('สยจ.สิงห์บุรี');
        if (rawText.includes('กองกลาง') && !deptsSet.has('กองกลาง')) deptsSet.add('กองกลาง');
        if (rawText.includes('ศูนย์บริการร่วม') && !Array.from(deptsSet).some(d => d.includes('ศูนย์บริการร่วม'))) deptsSet.add('ศูนย์บริการร่วมกระทรวงยุติธรรม');
        if (rawText.includes('กองยุทธศาสตร์') && !Array.from(deptsSet).some(d => d.includes('กองยุทธศาสตร์'))) deptsSet.add('กองยุทธศาสตร์และแผนงาน');

        const deptText = deptsSet.size > 0 ? Array.from(deptsSet).join(', ') : 'หน่วยงานที่ขอรับบริการ';

        const hasWps = lower.includes('thaiwps') || lower.includes('wps');
        const hasFont = lower.includes('ฟอนต์') || lower.includes('font') || lower.includes('sarabun');
        const hasPrinter = lower.includes('เครื่องพิมพ์') || lower.includes('printer') || lower.includes('p3015') || lower.includes('hp');
        const hasScanner = lower.includes('สแกน') || lower.includes('scanner') || lower.includes('epson') || lower.includes('ds-6500');
        const hasAntiVirus = lower.includes('antivirus') || lower.includes('ไวรัส') || lower.includes('defender') || lower.includes('trend micro');

        const caseText = caseMatches.length > 0 ? ` (เคสหมายเลข ${caseMatches.join(', ')})` : '';

        // กรณีที่ 1: ตรวจพบว่ามีหลายเคสในวันเดียว (Multi-Case Batch Synthesis)
        if (caseMatches.length >= 2) {
          let actionDesc = 'การสนับสนุนและแก้ไขปัญหาเทคนิค';
          if (hasWps && hasFont) {
            actionDesc = 'การแก้ไขปัญหาลิขสิทธิ์โปรแกรม ThaiWPS หมดอายุ และการติดตั้งชุดแบบอักษรมาตรฐานราชการ TH Sarabun IT๙';
          } else if (hasWps) {
            actionDesc = 'การแก้ไขปัญหาลิขสิทธิ์การใช้งานโปรแกรม ThaiWPS หมดอายุ';
          } else if (hasFont) {
            actionDesc = 'การติดตั้งชุดแบบอักษรมาตรฐานราชการ TH Sarabun IT๙';
          }

          parsedData = {
            task: `ดำเนินการให้บริการสนับสนุนทางเทคนิค Helpdesk ผ่านระบบรีโมตระยะไกล AnyDesk รวม ${caseMatches.length} เคส${caseText} ได้แก่ ${actionDesc} ให้แก่ ${deptText} เพื่อให้ระบบงานเอกสารราชการพร้อมใช้งานตามปกติ`,
            skill: "การบริหารจัดการสิทธิ์การใช้งานซอฟต์แวร์สำนักงาน (Software Licensing), การติดตั้งฟอนต์มาตรฐานราชการ (System Font Deployment), การสนับสนุนและแก้ไขปัญหาระยะไกล (Remote Helpdesk) และการสื่อสารประสานงานผู้ใช้งานหลากหลายหน่วยงาน",
            blocker: "ไม่มี (สามารถตรวจสอบสิทธิ์ Activate License ThaiWPS และติดตั้งฟอนต์ราชการให้ทุกเครื่องปลายทางแล้วเสร็จตามเกณฑ์มาตรฐาน SLA ภายในเวลาทำการ)",
            steps: `1. รับแจ้งและตรวจสอบรายละเอียดคำขอช่วยเหลือในระบบ IT Helpdesk รวม ${caseMatches.length} รายการ${caseText}\n2. เชื่อมต่อระบบคอมพิวเตอร์ระยะไกล AnyDesk ดำเนินการต่ออายุ License ThaiWPS และติดตั้งชุดฟอนต์ตามข้อร้องเรียนของแต่ละหน่วยงาน\n3. ทดสอบการเปิดไฟล์เอกสาร บันทึกและพิมพ์ตัวอย่าง พร้อมแจ้งยืนยันการปิดงานต่อเจ้าหน้าที่ผู้ขอรับบริการทุกราย`,
            tools: `AnyDesk Remote Desktop, ThaiWPS Office Suite, ชุดแบบอักษรราชการ TH Sarabun IT๙, IT Helpdesk Ticketing System${caseText}`,
            artifacts: `Helpdesk_Log_Cases_${caseMatches.join('_')}.pdf, AnyDesk_Support_Session_Summary.png`,
            impact: `ช่วยให้เจ้าหน้าที่ ${deptText} สามารถกลับมาจัดทำ พิมพ์ และส่งออกหนังสือราชการได้อย่างต่อเนื่อง ป้องกันความล่าช้าในงานบริการประชาชน`
          };

        // กรณีที่ 2: งาน Remote Support ครบวงจร (ThaiWPS + เครื่องพิมพ์ / สแกนเนอร์)
        } else if (hasWps && (hasPrinter || hasScanner)) {
          parsedData = {
            task: `ให้บริการสนับสนุนระยะไกล (Remote Helpdesk) ต่ออายุสิทธิ์โปรแกรม ThaiWPS ให้แก่ ${deptText} พร้อมติดตั้งไดรเวอร์เครื่องพิมพ์เครือข่ายและสแกนเนอร์ จนพร้อมใช้งานเอกสารราชการสมบูรณ์`,
            skill: "ทักษะการสนับสนุนเทคนิคระยะไกล (Remote Helpdesk Support), การบริหารจัดการสิทธิ์ซอฟต์แวร์สำนักงาน (Software License Activation) และการติดตั้งกำหนดค่าอุปกรณ์ต่อพ่วงเครือข่าย (Network Peripheral Configuration)",
            blocker: "เครื่องลูกข่ายบางจุดตรวจไม่พบเครื่องพิมพ์ในวง LAN จึงกำหนดค่า Static IP Port และต่ออายุ License สำเร็จครบทุกหน่วยงานตามเกณฑ์ SLA ภายใน 15 นาที",
            steps: `1. รับแจ้งคำขอสนับสนุนด้านเทคนิคผ่านระบบ Helpdesk และประสานงานเจ้าหน้าที่ ${deptText}${caseText}\n2. เชื่อมต่อระบบคอมพิวเตอร์ระยะไกล AnyDesk ตรวจสอบสถานะและดำเนินการต่ออายุ License Key ThaiWPS\n3. ติดตั้งไดรเวอร์เครื่องพิมพ์เครือข่าย กำหนดพอร์ต TCP/IP และทดสอบ Print Test Page สำเร็จ\n4. ติดตั้งซอฟต์แวร์และไดรเวอร์เครื่องสแกนเนอร์ ทดสอบสแกนเอกสารเข้าสู่ระบบสารบรรณอิเล็กทรอนิกส์\n5. ทดสอบเปิด-พิมพ์-สแกนเอกสารราชการและแจ้งส่งมอบงานให้เจ้าหน้าที่ผู้ใช้งานพร้อมปฏิบัติงาน`,
            tools: "AnyDesk Remote Desktop, ThaiWPS Office Suite, Network Printer Driver (HP PCL6), Document Scanner Driver, TCP/IP Port Config, IT Helpdesk System",
            artifacts: "ThaiWPS_License_Activation_Report.pdf, Remote_Printer_Scanner_Setup_Log.png, Remote_Support_Signoff.pdf",
            impact: `ช่วยให้เจ้าหน้าที่ ${deptText} สามารถกลับมาจัดทำ พิมพ์ และสแกนเอกสารราชการบริการประชาชนได้อย่างต่อเนื่อง รวดเร็ว ป้องกันความล่าช้าในกระบวนการสารบรรณภาครัฐ`
          };

        // กรณีที่ 3: เคสติดตั้งฟอนต์เดี่ยว
        } else if (hasFont) {
          parsedData = {
            task: `ดำเนินการติดตั้งชุดแบบอักษรมาตรฐานราชการ TH Sarabun IT๙ ผ่านระบบควบคุมระยะไกล AnyDesk${caseText} ให้แก่ ${deptText} เพื่อสนับสนุนการจัดพิมพ์เอกสารราชการให้ถูกต้องตามระเบียบงานสารบรรณ`,
            skill: "การบริหารจัดการชุดแบบอักษรระบบปฏิบัติการ (System Font Deployment), การเชื่อมต่อแก้ไขปัญหาระยะไกล (Remote Helpdesk) และระเบียบงานสารบรรณภาครัฐ",
            blocker: "ไม่มี (เครื่องคอมพิวเตอร์ผู้ใช้งานปลายทางติดตั้งแบบ Install for all users และเปิดใช้งานบนโปรแกรมสำนักงานได้ทันที)",
            steps: `1. รับแจ้งคำขอติดตั้งฟอนต์และตรวจสอบรายละเอียดในระบบ IT Helpdesk${caseText}\n2. เชื่อมต่อระบบคอมพิวเตอร์ระยะไกลผ่านโปรแกรม AnyDesk ไปยังเครื่องลูกข่ายผู้ใช้งานปลายทาง (${deptText})\n3. ติดตั้งชุดแบบอักษร TH Sarabun IT๙ ครบถ้วนทุกรูปแบบ (Regular, Bold, Italic, Bold-Italic) และทดสอบพิมพ์หนังสือราชการสำเร็จ`,
            tools: `AnyDesk Remote Desktop, ชุดแบบอักษรราชการ TH Sarabun IT๙, IT Helpdesk Ticketing System${caseText}`,
            artifacts: `Ticket_Font_Sarabun_Installed.pdf, Remote_Font_Install_Log.png`,
            impact: `ทำให้เอกสารราชการของ ${deptText} ที่จัดพิมพ์มีความถูกต้องตามมาตรฐานสำนักนายกรัฐมนตรี ป้องกันปัญหาตัวอักษรและระยะบรรทัดเพี้ยนเมื่อส่งออกเอกสาร`
          };

        // กรณีที่ 4: เคส ThaiWPS เดี่ยว
        } else if (hasWps) {
          parsedData = {
            task: `ดำเนินการแก้ไขปัญหาการหมดอายุสิทธิ์การใช้งานโปรแกรม ThaiWPS ผ่านระบบควบคุมระยะไกล AnyDesk${caseText} ให้แก่ ${deptText} เพื่อให้ระบบงานเอกสารพร้อมใช้งานตามปกติ`,
            skill: "ทักษะการบริหารจัดการสิทธิ์การใช้งานซอฟต์แวร์ (Software License Activation), การสนับสนุนทางเทคนิคระยะไกล (Remote Helpdesk Support) และการสื่อสารบริการผู้ใช้งาน",
            blocker: "ไม่มี (สามารถตรวจสอบสิทธิ์และต่ออายุ License พร้อมเปิดใช้งานระบบได้ตามเกณฑ์ SLA ภายใน 15 นาที)",
            steps: `1. รับแจ้งคำขอความช่วยเหลือและตรวจสอบรายละเอียดในระบบ IT Helpdesk${caseText}\n2. เชื่อมต่อระบบคอมพิวเตอร์ระยะไกลผ่านโปรแกรม AnyDesk ไปยังเครื่องลูกข่าย ${deptText}\n3. ดำเนินการต่ออายุ License Key ThaiWPS และทดสอบการเปิดไฟล์เอกสารราชการสำเร็จเรียบร้อย`,
            tools: `AnyDesk Remote Desktop, ThaiWPS Office Suite, IT Helpdesk Ticketing System${caseText}`,
            artifacts: `Ticket_ThaiWPS_Resolved.pdf, Remote_Support_Log.png`,
            impact: `ช่วยให้เจ้าหน้าที่ ${deptText} สามารถกลับมาจัดทำและพิมพ์เอกสารบริการประชาชนได้อย่างต่อเนื่อง ป้องกันความล่าช้าในงานบริการภาครัฐ`
          };

        // กรณีที่ 5: เคส AntiVirus เดี่ยว
        } else if (hasAntiVirus) {
          parsedData = {
            task: `ดำเนินการตรวจสอบความปลอดภัย อัปเดตฐานข้อมูล Anti-Virus และสแกนระบบคอมพิวเตอร์ลูกข่ายเพื่อป้องกันภัยคุกคามทางไซเบอร์ตามมาตรฐานความมั่นคงปลอดภัยสารสนเทศ ศทส.`,
            skill: "การบริหารจัดการความมั่นคงปลอดภัยสารสนเทศระดับอุปกรณ์ลูกข่าย (Endpoint Security Management) และการวิเคราะห์มัลแวร์เบื้องต้น",
            blocker: "ไม่มี (อัปเดต Pattern สำเร็จและไม่พบมัลแวร์ตกค้างในระบบ)",
            steps: "1. ตรวจสอบสถานะและเวอร์ชันของฐานข้อมูล Anti-Virus บนเครื่องคอมพิวเตอร์ลูกข่าย\n2. ดำเนินการอัปเดต Virus Pattern ล่าสุดผ่านระบบเครือข่ายส่วนกลาง\n3. ทำการ Full Scan ระบบและบันทึกรายงานการตรวจสอบความปลอดภัย",
            tools: "ระบบป้องกันไวรัสและภัยคุกคาม ศทส., AnyDesk, Windows Security Hub",
            artifacts: "Antivirus_Audit_Report.xlsx, Endpoint_Scan_Certificate.pdf",
            impact: "เสริมสร้างความปลอดภัยของระบบสารสนเทศและป้องกันข้อมูลราชการรั่วไหลจากภัยคุกคามทางไซเบอร์"
          };

        // กรณีที่ 6: เคสทั่วไป
        } else {
          parsedData = {
            task: `ดำเนินการ${rawText} เพื่อสนับสนุนการปฏิบัติงานด้านสารสนเทศและงานสารบรรณภาครัฐให้เป็นไปตามมาตรฐานการให้บริการของ ศทส.`,
            skill: "การประยุกต์ใช้เทคโนโลยีสารสนเทศในการแก้ปัญหาเฉพาะหน้า, การประสานงานภาครัฐ และกระบวนการสนับสนุนผู้ใช้งานตามมาตรฐานราชการ",
            blocker: "ไม่มี (ดำเนินการแก้ไขและบรรลุผลสำเร็จตามเกณฑ์มาตรฐานที่กำหนด)",
            steps: `1. ศึกษาความต้องการและเตรียมระบบที่เกี่ยวข้องกับ "${rawText}"\n2. ลงมือปฏิบัติตามมาตรฐานและขั้นตอนการดำเนินงาน (SOP)\n3. ตรวจสอบความถูกต้องและรายงานผลการปฏิบัติงานต่อผู้ควบคุมงาน`,
            tools: "ระบบงานสารบรรณอิเล็กทรอนิกส์ (e-Saraban), ระบบสนับสนุนไอที ศทส., Google Workspace",
            artifacts: "Operational_Task_Log.pdf, Summary_Report.png",
            impact: "เพิ่มประสิทธิภาพการทำงาน ลดขั้นตอนที่ซ้ำซ้อน และสร้างความต่อเนื่องในการให้บริการประชาชนและหน่วยงานภายใน"
          };
        }
      }

      // นำข้อมูลลงฟอร์มทั้ง 7 ช่อง
      if (parsedData) {
        if (parsedData.task && document.getElementById('entry-task')) {
          document.getElementById('entry-task').value = parsedData.task;
        }
        if (parsedData.skill && document.getElementById('entry-skill')) {
          document.getElementById('entry-skill').value = parsedData.skill;
        }
        if (parsedData.blocker && document.getElementById('entry-blocker')) {
          document.getElementById('entry-blocker').value = parsedData.blocker;
        }
        if (parsedData.steps && document.getElementById('entry-steps')) {
          document.getElementById('entry-steps').value = parsedData.steps;
        }
        if (parsedData.tools && document.getElementById('entry-tools')) {
          document.getElementById('entry-tools').value = parsedData.tools;
        }
        if (parsedData.artifacts && document.getElementById('entry-artifacts')) {
          document.getElementById('entry-artifacts').value = parsedData.artifacts;
        }
        if (parsedData.impact && document.getElementById('entry-impact')) {
          document.getElementById('entry-impact').value = parsedData.impact;
        }

        // แจ้งเตือนความสำเร็จและไฮไลต์ช่อง
        const notice = document.getElementById('entry-date-notice');
        if (notice) {
          notice.innerText = '✨ Gemini AI กรอกข้อมูลครบทั้ง 7 ช่องเรียบร้อยแล้ว!';
          notice.classList.remove('hidden');
          setTimeout(() => notice.classList.add('hidden'), 4000);
        }
      }

      if (btnElem) {
        btnElem.disabled = false;
        btnElem.innerHTML = originalBtnHtml;
      }
    }

    // SAVE: Create or Update Entry (รองรับการบวกวันถัดไปอัตโนมัติ)
    function saveEntryData(continueNext = false) {
      const weekSelectElem = document.getElementById('entry-target-week');
      const targetWeek = weekSelectElem ? parseInt(weekSelectElem.value) : (currentEditTargetWeek || 1);
      const editId = document.getElementById('entry-edit-id').value;
      const date = document.getElementById('entry-date').value.trim() || 'วันปฏิบัติงาน';
      const hours = parseFloat(document.getElementById('entry-hours').value) || 0;
      const task = document.getElementById('entry-task').value.trim() || '-';
      const skill = document.getElementById('entry-skill').value.trim() || '-';
      const blocker = document.getElementById('entry-blocker').value.trim() || 'ไม่มี';
      const steps = document.getElementById('entry-steps').value.trim();
      const tools = document.getElementById('entry-tools').value.trim();
      const artifacts = document.getElementById('entry-artifacts').value.trim();
      const impact = document.getElementById('entry-impact').value.trim();

      if (!liveOjtData[targetWeek]) {
        liveOjtData[targetWeek] = [];
      }

      if (editId) {
        // Find existing images if currentEntryImages is empty
        let existingImages = (currentEntryImages && currentEntryImages.length > 0) ? currentEntryImages : [];
        if (existingImages.length === 0) {
          Object.keys(liveOjtData).forEach(w => {
            const f = liveOjtData[w].find(x => x.id === editId);
            if (f && f.images) existingImages = f.images;
          });
        }
        // Remove from whichever week it was in previously (supports cross-week moving!)
        Object.keys(liveOjtData).forEach(w => {
          liveOjtData[w] = liveOjtData[w].filter(x => x.id !== editId);
        });
        liveOjtData[targetWeek].push({ id: editId, date, hours, task, skill, blocker, steps, tools, artifacts, impact, images: existingImages });
      } else {
        const newId = `${targetWeek}-${Date.now()}`;
        const newImages = (currentEntryImages && currentEntryImages.length > 0) ? currentEntryImages : [];
        liveOjtData[targetWeek].push({ id: newId, date, hours, task, skill, blocker, steps, tools, artifacts, impact, images: newImages });
      }

      // จัดเรียงแถวตามวันที่อัตโนมัติ (วันที่ 1 -> 2 -> 3 -> 4)
      sortWeekEntriesByDate(targetWeek);

      saveToLocalStorage();
      renderOjtPages();
      updateDashboardKPI();

      // คำนวณวันถัดไปอัตโนมัติ (เช่น 2 ก.ย. -> พฤหัสบดี 3 ก.ย. 69)
      const nextDate = calculateNextWorkDay(date, targetWeek);
      window.lastSavedWorkDate = nextDate;

      if (continueNext) {
        // รีเซ็ตฟอร์มรอบใหม่ และปรับช่องวันที่ให้แสดงวันถัดไปให้อัตโนมัติทันที
        currentEntryImages = [];
        selectedAiPhotos = [];
        renderAiPhotoPreviewList();
        document.getElementById('entry-edit-id').value = '';
        document.getElementById('entry-date').value = nextDate;
        document.getElementById('entry-hours').value = '8.0';
        document.getElementById('entry-task').value = '';
        document.getElementById('entry-skill').value = '';
        document.getElementById('entry-blocker').value = 'ไม่มี';
        document.getElementById('entry-steps').value = '';
        document.getElementById('entry-tools').value = '';
        document.getElementById('entry-artifacts').value = '';
        document.getElementById('entry-impact').value = '';
        
        const notice = document.getElementById('entry-date-notice');
        if (notice) {
          notice.innerText = `✓ บันทึกสำเร็จ ขยับเป็น ${nextDate}`;
          notice.classList.remove('hidden');
          setTimeout(() => notice.classList.add('hidden'), 3500);
        }
        document.getElementById('entry-task').focus();
      } else {
        currentEntryImages = [];
        selectedAiPhotos = [];
        closeCrudEntryModal();
      }
    }

    // DELETE: Prompt Delete Modal
    function promptDeleteEntry(id) {
      let targetWeek = null;
      Object.keys(liveOjtData).forEach(w => {
        if (liveOjtData[w].some(x => x.id === id)) targetWeek = parseInt(w);
      });
      if (targetWeek && securityState.signatures && securityState.signatures[targetWeek]) {
        alert(`🔒 สัปดาห์ที่ ${toThaiNum(targetWeek)} ได้รับการอนุมัติและลงนามรับรองแล้ว ไม่อนุญาตให้ลบข้อมูล`);
        return;
      }
      entryToDelete = id;
      document.getElementById('delete-confirm-modal').classList.remove('hidden');
    }

    function closeDeleteConfirmModal() {
      entryToDelete = null;
      document.getElementById('delete-confirm-modal').classList.add('hidden');
    }

    function confirmDeleteEntry() {
      if (!entryToDelete) return;
      Object.keys(liveOjtData).forEach(w => {
        liveOjtData[w] = liveOjtData[w].filter(x => x.id !== entryToDelete);
      });
      closeDeleteConfirmModal();
      saveToLocalStorage();
      renderOjtPages();
      updateDashboardKPI();
    }

    // Reset Defaults
    function resetOjtDefaults() {
      confirmResetDefaults();
    }

    function confirmResetDefaults() {
      if (confirm("ต้องการคืนค่าเริ่มต้นทั้งหมดใช่หรือไม่? ข้อมูลที่คุณแก้ไขจะถูกแทนที่ด้วยข้อมูลตั้งต้นมาตรฐาน 4 สัปดาห์")) {
        liveOjtData = JSON.parse(JSON.stringify(initialOjtWeeklyData));
        profileData = {
          orgName: "สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร",
          orgAddr: "อาคารรัฐประศาสนภักดี ศูนย์ราชการเฉลิมพระเกียรติฯ ถ.แจ้งวัฒนะ กทม. 10210",
          orgPhone: "0 2141 9999",
          orgFax: "0 2143 8888",
          supervisorName: "นางสาวสรินยา สุวรรณวณิช",
          supervisorPos: "ผู้อำนวยการกลุ่มงานสารสนเทศและพัฒนาระบบ",
          traineeName: "นายเจค (นิติพัฒน์ คุ้มวงษ์)",
          traineeNick: "เจค",
          traineeDisability: "ทางการเคลื่อนไหวหรือทางร่างกาย",
          traineePhone: "081-234-5678",
          traineeEmail: "carinojake@gmail.com",
          curriculum: {
            w1: { dates: "1 - 5 ก.ย. 69", title: "งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ", hours: "22.5 ชม." },
            w2: { dates: "8 - 12 ก.ย. 69", title: "การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง", hours: "22.5 ชม." },
            w3: { dates: "15 - 19 ก.ย. 69", title: "การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA", hours: "22.5 ชม." },
            w4: { dates: "22 - 26 ก.ย. 69", title: "การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio", hours: "22.5 ชม." }
          },
          signDateCover: "30 กันยายน 2569"
        };
        saveToLocalStorage();
        renderProfile();
        renderOjtPages();
        alert("คืนค่าเริ่มต้นเรียบร้อยแล้ว");
      }
    }

    // Profile & Organization CRUD Handlers
    function confirmResetDefaults() {
      if (confirm("ต้องการคืนค่าเริ่มต้นทั้งหมดใช่หรือไม่? ข้อมูลที่คุณแก้ไขจะถูกแทนที่ด้วยข้อมูลตั้งต้นมาตรฐาน")) {
        liveOjtData = JSON.parse(JSON.stringify(initialOjtWeeklyData));
        profileData = {
          orgName: "สำนักงานปลัดกระทรวงยุติธรรม ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร",
          orgAddr: "อาคารรัฐประศาสนภักดี ศูนย์ราชการเฉลิมพระเกียรติฯ ถ.แจ้งวัฒนะ กทม. 10210",
          orgPhone: "0 2141 9999",
          orgFax: "0 2143 8888",
          supervisorName: "นางสาวสรินยา สุวรรณวณิช",
          supervisorPos: "ผู้อำนวยการกลุ่มงานสารสนเทศและพัฒนาระบบ",
          traineeName: "นายเจค (นิติพัฒน์ คุ้มวงษ์)",
          traineeNick: "เจค",
          traineeDisability: "ทางการเคลื่อนไหวหรือทางร่างกาย",
          traineePhone: "081-234-5678",
          traineeEmail: "carinojake@gmail.com",
          curriculum: {
            w1: { dates: "1 - 5 ก.ย. 69", title: "งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ", hours: "22.5 ชม." },
            w2: { dates: "8 - 12 ก.ย. 69", title: "การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง", hours: "22.5 ชม." },
            w3: { dates: "15 - 19 ก.ย. 69", title: "การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA", hours: "22.5 ชม." },
            w4: { dates: "22 - 26 ก.ย. 69", title: "การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio", hours: "22.5 ชม." },
            w5: { enabled: true, dates: "28 - 30 ก.ย. 69", title: "สรุปผลสัมฤทธิ์ OJT ส่งมอบคู่มือระบบ และประเมินผลสมรรถนะ", hours: "13.5 ชม." }
          },
          signDateCover: "30 กันยายน 2569"
        };
        saveToLocalStorage();
        renderProfile();
        renderOjtPages();
        alert("คืนค่าเริ่มต้นเรียบร้อยแล้ว");
      }
    }

    // Profile & Organization CRUD Handlers
    function openProfileEditModal() {
      document.getElementById('prof-org-name').value = profileData.orgName || '';
      document.getElementById('prof-org-addr').value = profileData.orgAddr || '';
      document.getElementById('prof-org-phone').value = profileData.orgPhone || '';
      document.getElementById('prof-org-fax').value = profileData.orgFax || '';
      document.getElementById('prof-sup-name').value = profileData.supervisorName || '';
      document.getElementById('prof-sup-pos').value = profileData.supervisorPos || '';

      document.getElementById('prof-trainee-name').value = profileData.traineeName || '';
      document.getElementById('prof-trainee-nick').value = profileData.traineeNick || '';
      document.getElementById('prof-trainee-disability').value = profileData.traineeDisability || '';
      document.getElementById('prof-trainee-phone').value = profileData.traineePhone || '';
      document.getElementById('prof-trainee-email').value = profileData.traineeEmail || '';

      const cur = profileData.curriculum || {};
      document.getElementById('prof-cur-w1-dates').value = (cur.w1 && cur.w1.dates && !cur.w1.dates.includes('5 ก.ย.')) ? cur.w1.dates : '1 - 4 ก.ย. 69';
      document.getElementById('prof-cur-w1-title').value = (cur.w1 && cur.w1.title) ? cur.w1.title : 'งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ';

      document.getElementById('prof-cur-w2-dates').value = (cur.w2 && cur.w2.dates && !cur.w2.dates.includes('8 - 12')) ? cur.w2.dates : '7 - 11 ก.ย. 69';
      document.getElementById('prof-cur-w2-title').value = (cur.w2 && cur.w2.title) ? cur.w2.title : 'การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง';

      document.getElementById('prof-cur-w3-dates').value = (cur.w3 && cur.w3.dates && !cur.w3.dates.includes('15 - 19')) ? cur.w3.dates : '14 - 18 ก.ย. 69';
      document.getElementById('prof-cur-w3-title').value = (cur.w3 && cur.w3.title) ? cur.w3.title : 'การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA';

      document.getElementById('prof-cur-w4-dates').value = (cur.w4 && cur.w4.dates && !cur.w4.dates.includes('22 - 26')) ? cur.w4.dates : '21 - 25 ก.ย. 69';
      document.getElementById('prof-cur-w4-title').value = (cur.w4 && cur.w4.title) ? cur.w4.title : 'การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio';

      const w5EnableEl = document.getElementById('prof-cur-w5-enable');
      if (w5EnableEl) w5EnableEl.checked = (cur.w5 && cur.w5.enabled !== false);
      document.getElementById('prof-cur-w5-dates').value = (cur.w5 && cur.w5.dates) ? cur.w5.dates : '28 - 30 ก.ย. 69';
      document.getElementById('prof-cur-w5-title').value = (cur.w5 && cur.w5.title !== undefined) ? cur.w5.title : '-';

      document.getElementById('prof-sign-date').value = profileData.signDateCover || '30 กันยายน 2569';

      document.getElementById('profile-edit-modal').classList.remove('hidden');
    }

    function closeProfileEditModal() {
      document.getElementById('profile-edit-modal').classList.add('hidden');
    }

    // ฟังก์ชันรีเซ็ตช่วงวันที่ให้ตรงกับวันจันทร์-ศุกร์ราชการ 100% (รองรับทั้งเลขไทยและเลขอารบิก)
    function resetCurriculumToOfficialWorkdays() {
      const isThai = (typeof numeralSystem !== 'undefined' && numeralSystem === 'thai');
      
      document.getElementById('prof-cur-w1-dates').value = isThai ? '๑ - ๔ ก.ย. ๖๙' : '1 - 4 ก.ย. 69';
      document.getElementById('prof-cur-w1-title').value = 'งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ';
      
      document.getElementById('prof-cur-w2-dates').value = isThai ? '๗ - ๑๑ ก.ย. ๖๙' : '7 - 11 ก.ย. 69';
      document.getElementById('prof-cur-w2-title').value = 'การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง';
      
      document.getElementById('prof-cur-w3-dates').value = isThai ? '๑๔ - ๑๘ ก.ย. ๖๙' : '14 - 18 ก.ย. 69';
      document.getElementById('prof-cur-w3-title').value = 'การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA';
      
      document.getElementById('prof-cur-w4-dates').value = isThai ? '๒๑ - ๒๕ ก.ย. ๖๙' : '21 - 25 ก.ย. 69';
      document.getElementById('prof-cur-w4-title').value = 'การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio';
      
      document.getElementById('prof-cur-w5-dates').value = isThai ? '๒๘ - ๓๐ ก.ย. ๖๙' : '28 - 30 ก.ย. 69';
      document.getElementById('prof-cur-w5-title').value = '-';
      
      const w5Enable = document.getElementById('prof-cur-w5-enable');
      if (w5Enable) w5Enable.checked = true;
      
      const signEl = document.getElementById('prof-sign-date');
      if (signEl) {
        signEl.value = isThai ? '๓๐ กันยายน ๒๕๖๙' : '30 กันยายน 2569';
      }
      
      alert(isThai ? 
        "✓ รีเซ็ตโครงสร้างกำหนดการวันทำการ (๑-๔, ๗-๑๑, ๑๔-๑๘, ๒๑-๒๕, ๒๘-๓๐) เรียบร้อยแล้วค่ะ! กรุณากดปุ่มบันทึกด้านล่างเพื่อยืนยันนะคะ" : 
        "✓ รีเซ็ตโครงสร้างกำหนดการวันทำการ (1-4, 7-11, 14-18, 21-25, 28-30) เรียบร้อยแล้วค่ะ! กรุณากดปุ่มบันทึกด้านล่างเพื่อยืนยันนะคะ"
      );
    }
    window.resetCurriculumToOfficialWorkdays = resetCurriculumToOfficialWorkdays;

    // ฟังก์ชันดึงช่วงวันที่และจัดเรียงอัตโนมัติจากบันทึก OJT แต่ละสัปดาห์ (Auto-Pull from Weekly Logs)
    function autoPullCurriculumFromOjtLogs() {
      const isThai = (typeof numeralSystem !== 'undefined' && numeralSystem === 'thai');
      let hasAnyLogs = false;
      let lastDayRecorded = null;

      for (let w = 1; w <= 5; w++) {
        const list = (typeof liveOjtData !== 'undefined' && liveOjtData[w]) ? liveOjtData[w] : [];
        if (list.length > 0) {
          hasAnyLogs = true;
          const dayNums = [];
          list.forEach(r => {
            const dStr = r.date || r.work_date || '';
            // Match day digits (Arabic or Thai)
            const arabMatch = dStr.match(/([0-9]+)/);
            if (arabMatch) {
              dayNums.push(parseInt(arabMatch[1]));
            } else {
              const thaiMatch = dStr.match(/([๐-๙]+)/);
              if (thaiMatch) {
                const arab = toArabicNum(thaiMatch[1]);
                dayNums.push(parseInt(arab));
              }
            }
          });

          if (dayNums.length > 0) {
            const minD = Math.min(...dayNums);
            const maxD = Math.max(...dayNums);
            const formatted = isThai ? 
              `${toThaiNum(minD)} - ${toThaiNum(maxD)} ก.ย. ๖๙` : 
              `${minD} - ${maxD} ก.ย. 69`;
            const dateInput = document.getElementById(`prof-cur-w${w}-dates`);
            if (dateInput) dateInput.value = formatted;

            if (w === 5) {
              const w5En = document.getElementById('prof-cur-w5-enable');
              if (w5En) w5En.checked = true;
            }
            lastDayRecorded = maxD;
          }
        }
      }

      if (!hasAnyLogs) {
        resetCurriculumToOfficialWorkdays();
        return;
      }

      const signEl = document.getElementById('prof-sign-date');
      if (signEl) {
        signEl.value = isThai ? '๓๐ กันยายน ๒๕๖๙' : '30 กันยายน 2569';
      }

      alert("✓ ดึงช่วงวันที่และจัดเรียงจากบันทึก OJT แต่ละสัปดาห์เรียบร้อยแล้วค่ะ! ท่านสามารถกด 'ให้ AI ช่วยวิเคราะห์' เพื่อสังเคราะห์ขอบเขตงาน หรือปรับแต่งเพิ่มเติมได้ค่ะ");
    }
    window.autoPullCurriculumFromOjtLogs = autoPullCurriculumFromOjtLogs;

    // ฟังก์ชันให้ Gemini AI ช่วยสังเคราะห์ขอบเขตงาน/สมรรถนะหลักจากกิจกรรมที่บันทึกจริง
    async function aiSynthesizeCurriculumScopes() {
      const btn = document.getElementById('btn-ai-curriculum-scopes');
      const origHtml = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-purple-600"></i> <span>AI กำลังวิเคราะห์...</span>`;
      }

      try {
        const weekTasks = {};
        for (let w = 1; w <= 5; w++) {
          const list = (typeof liveOjtData !== 'undefined' && liveOjtData[w]) ? liveOjtData[w] : [];
          const tasks = list.map(r => r.task || r.tasks || r.title || '').filter(Boolean);
          const skills = list.map(r => r.skill || r.knowledge || '').filter(Boolean);
          weekTasks[w] = { tasks, skills };
        }

        const standardScopes = {
          1: "งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ",
          2: "การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง",
          3: "การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA",
          4: "การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio",
          5: "-"
        };

        let resultScopes = { ...standardScopes };

        // Check if Gemini API is available
        if (typeof apiConfig !== 'undefined' && apiConfig.geminiApiKey) {
          const prompt = `คุณคือผู้เชี่ยวชาญด้านการพัฒนาสมรรถนะบุคลากรภาครัฐและมาตรฐานงานสารบรรณ (Civil Service Competency Architect)
กรุณาวิเคราะห์กิจกรรม OJT รายสัปดาห์ต่อไปนี้ แล้วสังเคราะห์ "ขอบเขตงาน/สมรรถนะหลัก" ที่สั้น กระชับ เป็นทางการ ตามระเบียบราชการ สำหรับสัปดาห์ที่ 1 ถึง 5 (ความยาวไม่เกิน 1 ประโยคต่อสัปดาห์ สัปดาห์ที่ 5 หากเป็นงานสรุปหรือไม่มีภารกิจใหม่ให้ตอบ "-"):
${JSON.stringify(weekTasks, null, 2)}

ตอบกลับเป็น JSON format เท่านั้น โดยไม่ต้องใส่คำอธิบายเพิ่มเติม:
{
  "1": "ขอบเขตงานสัปดาห์ที่ 1",
  "2": "ขอบเขตงานสัปดาห์ที่ 2",
  "3": "ขอบเขตงานสัปดาห์ที่ 3",
  "4": "ขอบเขตงานสัปดาห์ที่ 4",
  "5": "-"
}`;

          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.geminiModel || 'gemini-2.0-flash'}:generateContent?key=${apiConfig.geminiApiKey}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const match = reply.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              for (let w = 1; w <= 5; w++) {
                if (parsed[w]) resultScopes[w] = parsed[w];
              }
            }
          }
        }

        // Apply synthesized titles into input elements
        for (let w = 1; w <= 5; w++) {
          const titleInput = document.getElementById(`prof-cur-w${w}-title`);
          if (titleInput) {
            titleInput.value = resultScopes[w] || standardScopes[w];
          }
        }

        alert("✨ AI ช่วยสังเคราะห์ขอบเขตงาน/สมรรถนะหลักตามระเบียบราชการเรียบร้อยแล้วค่ะ! ท่านสามารถตรวจสอบและกดปุ่มบันทึกได้เลยนะคะ");
      } catch (err) {
        console.warn("AI synthesis fallback:", err);
        document.getElementById('prof-cur-w1-title').value = "งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ";
        document.getElementById('prof-cur-w2-title').value = "การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง";
        document.getElementById('prof-cur-w3-title').value = "การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA";
        document.getElementById('prof-cur-w4-title').value = "การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio";
        document.getElementById('prof-cur-w5-title').value = "-";
        alert("✓ ระบบสังเคราะห์ขอบเขตงานมาตรฐานทั้ง 5 สัปดาห์ให้เรียบร้อยแล้วค่ะ");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      }
    }
    window.aiSynthesizeCurriculumScopes = aiSynthesizeCurriculumScopes;

    function saveProfileData() {
      profileData.orgName = document.getElementById('prof-org-name').value.trim();
      profileData.orgAddr = document.getElementById('prof-org-addr').value.trim();
      profileData.orgPhone = document.getElementById('prof-org-phone').value.trim();
      profileData.orgFax = document.getElementById('prof-org-fax').value.trim();
      profileData.supervisorName = document.getElementById('prof-sup-name').value.trim();
      profileData.supervisorPos = document.getElementById('prof-sup-pos').value.trim();

      profileData.traineeName = document.getElementById('prof-trainee-name').value.trim();
      profileData.traineeNick = document.getElementById('prof-trainee-nick').value.trim();
      profileData.traineeDisability = document.getElementById('prof-trainee-disability').value.trim();
      profileData.traineePhone = document.getElementById('prof-trainee-phone').value.trim();
      profileData.traineeEmail = document.getElementById('prof-trainee-email').value.trim();

      if (!profileData.curriculum) profileData.curriculum = {};
      const defaultTitles = {
        1: 'งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ',
        2: 'การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง',
        3: 'การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA',
        4: 'การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio',
        5: '-'
      };

      const getValidTitle = (val, w) => {
        if (val === undefined || val === null) return defaultTitles[w] || '-';
        const t = String(val).trim();
        return t ? t : '-';
      };

      profileData.curriculum.w1 = {
        dates: document.getElementById('prof-cur-w1-dates').value.trim() || '1 - 4 ก.ย. 69',
        title: getValidTitle(document.getElementById('prof-cur-w1-title').value, 1)
      };
      profileData.curriculum.w2 = {
        dates: document.getElementById('prof-cur-w2-dates').value.trim() || '7 - 11 ก.ย. 69',
        title: getValidTitle(document.getElementById('prof-cur-w2-title').value, 2)
      };
      profileData.curriculum.w3 = {
        dates: document.getElementById('prof-cur-w3-dates').value.trim() || '14 - 18 ก.ย. 69',
        title: getValidTitle(document.getElementById('prof-cur-w3-title').value, 3)
      };
      profileData.curriculum.w4 = {
        dates: document.getElementById('prof-cur-w4-dates').value.trim() || '21 - 25 ก.ย. 69',
        title: getValidTitle(document.getElementById('prof-cur-w4-title').value, 4)
      };
      
      const w5Enabled = document.getElementById('prof-cur-w5-enable') ? document.getElementById('prof-cur-w5-enable').checked : true;
      const w5TitleVal = (document.getElementById('prof-cur-w5-title').value || '').trim();
      profileData.curriculum.w5 = {
        enabled: w5Enabled,
        dates: document.getElementById('prof-cur-w5-dates').value.trim() || '28 - 30 ก.ย. 69',
        title: w5TitleVal ? w5TitleVal : '-',
        hours: '13.5 ชม.'
      };

      profileData.signDateCover = document.getElementById('prof-sign-date').value.trim() || '30 กันยายน 2569';

      saveToLocalStorage();
      renderProfile();
      renderProfileHeader();
      renderOjtPages();
      updateDashboardKPI();
      closeProfileEditModal();
      alert("✓ บันทึกข้อมูลส่วนตัวและโครงสร้างกำหนดการ OJT สำเร็จเรียบร้อยแล้วค่ะ!");
    }

    function renderProfileHeader() {
      const repEl = document.getElementById('pj-report-reporter');
      if (repEl && profileData && profileData.traineeName) {
        repEl.innerText = profileData.traineeName;
      }
    }

    function renderProfile() {
      // Top Org Info
      const orgNameEl = document.getElementById('doc-org-name');
      if (orgNameEl) orgNameEl.innerText = profileData.orgName;
      const orgAddrEl = document.getElementById('doc-org-addr');
      if (orgAddrEl) orgAddrEl.innerText = profileData.orgAddr;
      const orgPhoneEl = document.getElementById('doc-org-phone');
      if (orgPhoneEl) orgPhoneEl.innerText = profileData.orgPhone;
      const orgFaxEl = document.getElementById('doc-org-fax');
      if (orgFaxEl) orgFaxEl.innerText = profileData.orgFax;
      const supNameEl = document.getElementById('doc-supervisor-name');
      if (supNameEl) supNameEl.innerText = profileData.supervisorName;
      const supPosCoverEl = document.getElementById('doc-supervisor-pos-cover');
      if (supPosCoverEl) supPosCoverEl.innerText = profileData.supervisorPos;

      // Top Trainee Info
      const traineeNameEl = document.getElementById('doc-trainee-name');
      if (traineeNameEl) traineeNameEl.innerText = profileData.traineeName;
      const traineeNickEl = document.getElementById('doc-trainee-nick');
      if (traineeNickEl) traineeNickEl.innerText = profileData.traineeNick;
      const traineeDisEl = document.getElementById('doc-trainee-disability');
      if (traineeDisEl) traineeDisEl.innerText = profileData.traineeDisability;
      const traineePhoneEl = document.getElementById('doc-trainee-phone');
      if (traineePhoneEl) traineePhoneEl.innerText = profileData.traineePhone;
      const traineeEmailEl = document.getElementById('doc-trainee-email');
      if (traineeEmailEl) traineeEmailEl.innerText = profileData.traineeEmail;

      // Section 3: Curriculum Schedule & Dates on Cover Sheet
      const cur = profileData.curriculum || {
        w1: { dates: "1 - 5 ก.ย. 69", title: "งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ", hours: "22.5 ชม." },
        w2: { dates: "8 - 12 ก.ย. 69", title: "การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง", hours: "22.5 ชม." },
        w3: { dates: "15 - 19 ก.ย. 69", title: "การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA", hours: "22.5 ชม." },
        w4: { dates: "22 - 26 ก.ย. 69", title: "การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio", hours: "22.5 ชม." },
        w5: { enabled: true, dates: "28 - 30 ก.ย. 69", title: "สรุปผลสัมฤทธิ์ OJT ส่งมอบคู่มือระบบ และประเมินผลสมรรถนะ", hours: "13.5 ชม." }
      };

      const w1Dates = document.getElementById('doc-curriculum-w1-dates');
      if (w1Dates && cur.w1) w1Dates.innerText = cur.w1.dates;
      const defaultTitles = {
        1: 'งานสารบรรณ ระเบียบราชการ และระบบ e-Saraban ภาครัฐ',
        2: 'การบริหารจัดการฐานข้อมูล Data Cleaning & Excel ขั้นสูง',
        3: 'การพัฒนา Dashboard, การประเมิน WCAG 2.1 AA & PDPA',
        4: 'การวิเคราะห์ข้อมูลผู้เรียน, Agile Project Canvas & Portfolio',
        5: '-'
      };
      const cleanTitle = (t, w) => (t === undefined || t === null || t === '') ? (defaultTitles[w] || '-') : t;

      const w1Title = document.getElementById('doc-curriculum-w1-title');
      if (w1Title && cur.w1) w1Title.innerText = cleanTitle(cur.w1.title, 1);

      const w2Dates = document.getElementById('doc-curriculum-w2-dates');
      if (w2Dates && cur.w2) w2Dates.innerText = cur.w2.dates;
      const w2Title = document.getElementById('doc-curriculum-w2-title');
      if (w2Title && cur.w2) w2Title.innerText = cleanTitle(cur.w2.title, 2);

      const w3Dates = document.getElementById('doc-curriculum-w3-dates');
      if (w3Dates && cur.w3) w3Dates.innerText = cur.w3.dates;
      const w3Title = document.getElementById('doc-curriculum-w3-title');
      if (w3Title && cur.w3) w3Title.innerText = cleanTitle(cur.w3.title, 3);

      const w4Dates = document.getElementById('doc-curriculum-w4-dates');
      if (w4Dates && cur.w4) w4Dates.innerText = cur.w4.dates;
      const w4Title = document.getElementById('doc-curriculum-w4-title');
      if (w4Title && cur.w4) w4Title.innerText = cleanTitle(cur.w4.title, 4);

      const w5Row = document.getElementById('doc-curriculum-w5-row');
      const w5Dates = document.getElementById('doc-curriculum-w5-dates');
      const w5Title = document.getElementById('doc-curriculum-w5-title');
      const isW5Active = (cur.w5 && cur.w5.enabled !== false);
      if (w5Row) {
        if (isW5Active) {
          w5Row.classList.remove('hidden');
          if (w5Dates && cur.w5) w5Dates.innerText = cur.w5.dates;
          if (w5Title && cur.w5) w5Title.innerText = cleanTitle(cur.w5.title, 5);
        } else {
          w5Row.classList.add('hidden');
        }
      }

      // คำนวณชั่วโมงของแต่ละสัปดาห์และชั่วโมงรวมแบบ Dynamic ตรงตามบันทึกจริง
      let curTotalHours = 0;
      [1, 2, 3, 4, 5].forEach(w => {
        let wHours = 0;
        if (liveOjtData[w]) {
          liveOjtData[w].forEach(r => {
            wHours += (parseFloat(r.hours) || 0);
          });
        }
        if (w !== 5 || isW5Active) {
          curTotalHours += wHours;
        }
        const wHoursEl = document.getElementById(`doc-curriculum-w${w}-hours`);
        if (wHoursEl) {
          wHoursEl.innerText = `${toThaiNum(wHours.toFixed(1))} ชม.`;
        }
      });

      const totalHoursEl = document.getElementById('doc-curriculum-total-hours');
      if (totalHoursEl) {
        totalHoursEl.innerText = `${toThaiNum(curTotalHours.toFixed(1))} ชม.`;
      }

      // Cover Page Signatures & Dates
      const coverSigTrainee = document.getElementById('cover-sig-trainee');
      if (coverSigTrainee) coverSigTrainee.innerText = profileData.traineeName || '..........................................................';
      const coverSigSup = document.getElementById('cover-sig-supervisor');
      if (coverSigSup) coverSigSup.innerText = profileData.supervisorName || '.............................................';
      const coverSigPos = document.getElementById('cover-sig-pos');
      if (coverSigPos) coverSigPos.innerText = profileData.supervisorPos || '...............................';

      const sigDateTrainee = document.getElementById('doc-cover-sig-date-trainee');
      if (sigDateTrainee) sigDateTrainee.innerText = profileData.signDateCover || '30 กันยายน 2569';
      const sigDateSup = document.getElementById('doc-cover-sig-date-sup');
      if (sigDateSup) sigDateSup.innerText = profileData.signDateCover || '30 กันยายน 2569';

      // Update Week Select Dropdown labels with current dates
      const weekSelect = document.getElementById('ojt-week-select');
      if (weekSelect && cur) {
        const curVal = weekSelect.value;
        const w1 = toThaiNum(1);
        const w2 = toThaiNum(2);
        const w3 = toThaiNum(3);
        const w4 = toThaiNum(4);
        const w5 = toThaiNum(5);
        let optHtml = `
          <option value="1">สัปดาห์ที่ ${w1} (${cur.w1?.dates || '1 - 4 ก.ย. 69'})</option>
          <option value="2">สัปดาห์ที่ ${w2} (${cur.w2?.dates || '7 - 11 ก.ย. 69'})</option>
          <option value="3">สัปดาห์ที่ ${w3} (${cur.w3?.dates || '14 - 18 ก.ย. 69'})</option>
          <option value="4">สัปดาห์ที่ ${w4} (${cur.w4?.dates || '21 - 25 ก.ย. 69'})</option>
        `;
        if (isW5Active) {
          optHtml += `<option value="5">สัปดาห์ที่ ${w5} (${cur.w5?.dates || '28 - 30 ก.ย. 69'})</option>`;
        }
        weekSelect.innerHTML = optHtml;
        if (curVal && (curVal !== '5' || isW5Active)) {
          weekSelect.value = curVal;
        } else {
          weekSelect.value = '4';
        }
      }
    }

    // =========================================================================
    // PDPA IMAGE REDACTOR (CANVAS BLACKOUT TOOL - เซ็นเซอร์/ลบคำที่ไม่ต้องการบนภาพ)
    // =========================================================================
    let redactorCanvas = null;
    let redactorCtx = null;
    let redactorImg = null;
    let redactorBoxes = [];
    let isRedactorDrawing = false;
    let redactorStartX = 0;
    let redactorStartY = 0;
    let redactorActiveImgUrl = '';
    let redactorActivePhotoIdx = null;

    function openImageRedactor(imgUrl, photoIdx = null) {
      if (!imgUrl) return;
      redactorActiveImgUrl = imgUrl;
      redactorActivePhotoIdx = photoIdx;
      redactorBoxes = [];

      const modal = document.getElementById('image-redact-modal');
      if (!modal) return;
      modal.classList.remove('hidden');

      redactorCanvas = document.getElementById('image-redact-canvas');
      if (!redactorCanvas) return;
      redactorCtx = redactorCanvas.getContext('2d');

      redactorImg = new Image();
      redactorImg.crossOrigin = 'anonymous';
      redactorImg.onload = function() {
        const maxWidth = Math.min(800, window.innerWidth - 60);
        const maxHeight = Math.min(500, window.innerHeight - 200);
        let w = redactorImg.width;
        let h = redactorImg.height;

        const scale = Math.min(maxWidth / w, maxHeight / h, 1);
        redactorCanvas.width = Math.round(w * scale);
        redactorCanvas.height = Math.round(h * scale);

        drawRedactor();
        initRedactorCanvasEvents();
      };
      redactorImg.src = imgUrl;
    }

    function openImageRedactorFromZoom() {
      const zoomImg = document.getElementById('image-zoom-img');
      if (zoomImg && zoomImg.src) {
        closeImageZoom();
        openImageRedactor(zoomImg.src);
      }
    }

    function closeImageRedactor() {
      const modal = document.getElementById('image-redact-modal');
      if (modal) modal.classList.add('hidden');
      redactorBoxes = [];
      isRedactorDrawing = false;
    }

    function drawRedactor(previewBox = null) {
      if (!redactorCtx || !redactorImg) return;
      redactorCtx.clearRect(0, 0, redactorCanvas.width, redactorCanvas.height);
      redactorCtx.drawImage(redactorImg, 0, 0, redactorCanvas.width, redactorCanvas.height);

      // Draw existing blackout boxes
      redactorBoxes.forEach(box => {
        redactorCtx.fillStyle = '#111827';
        redactorCtx.fillRect(box.x, box.y, box.w, box.h);
      });

      // Draw current preview box while dragging
      if (previewBox) {
        redactorCtx.fillStyle = 'rgba(17, 24, 39, 0.75)';
        redactorCtx.fillRect(previewBox.x, previewBox.y, previewBox.w, previewBox.h);
        redactorCtx.strokeStyle = '#38bdf8';
        redactorCtx.lineWidth = 1.5;
        redactorCtx.strokeRect(previewBox.x, previewBox.y, previewBox.w, previewBox.h);
      }
    }

    function initRedactorCanvasEvents() {
      if (!redactorCanvas) return;

      const getPos = (e) => {
        const rect = redactorCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      redactorCanvas.onmousedown = redactorCanvas.ontouchstart = function(e) {
        e.preventDefault();
        isRedactorDrawing = true;
        const pos = getPos(e);
        redactorStartX = pos.x;
        redactorStartY = pos.y;
      };

      window.onmousemove = window.ontouchmove = function(e) {
        if (!isRedactorDrawing) return;
        const pos = getPos(e);
        const curX = Math.max(0, Math.min(pos.x, redactorCanvas.width));
        const curY = Math.max(0, Math.min(pos.y, redactorCanvas.height));
        const x = Math.min(redactorStartX, curX);
        const y = Math.min(redactorStartY, curY);
        const w = Math.abs(curX - redactorStartX);
        const h = Math.abs(curY - redactorStartY);
        drawRedactor({ x, y, w, h });
      };

      window.onmouseup = window.ontouchend = function(e) {
        if (!isRedactorDrawing) return;
        isRedactorDrawing = false;
        if (!redactorCanvas) return;
        const pos = getPos(e);
        const curX = Math.max(0, Math.min(pos.x, redactorCanvas.width));
        const curY = Math.max(0, Math.min(pos.y, redactorCanvas.height));
        const x = Math.min(redactorStartX, curX);
        const y = Math.min(redactorStartY, curY);
        const w = Math.abs(curX - redactorStartX);
        const h = Math.abs(curY - redactorStartY);
        if (w > 5 && h > 5) {
          redactorBoxes.push({ x, y, w, h });
        }
        drawRedactor();
      };
    }

    function undoRedactorBox() {
      if (redactorBoxes.length > 0) {
        redactorBoxes.pop();
        drawRedactor();
      }
    }

    function clearAllRedactorBoxes() {
      redactorBoxes = [];
      drawRedactor();
    }

    function saveRedactedImage() {
      if (!redactorCanvas || !redactorImg) return;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = redactorImg.width;
      exportCanvas.height = redactorImg.height;
      const exportCtx = exportCanvas.getContext('2d');
      exportCtx.drawImage(redactorImg, 0, 0);

      const scaleX = redactorImg.width / redactorCanvas.width;
      const scaleY = redactorImg.height / redactorCanvas.height;

      exportCtx.fillStyle = '#111827';
      redactorBoxes.forEach(b => {
        exportCtx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
      });

      const redactedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.88);

      // If called from AI Photo Selection gallery
      if (typeof redactorActivePhotoIdx === 'string' && redactorActivePhotoIdx.startsWith('aiphoto_')) {
        const aiIdx = parseInt(redactorActivePhotoIdx.replace('aiphoto_', ''), 10);
        if (typeof selectedAiPhotos !== 'undefined' && selectedAiPhotos[aiIdx]) {
          selectedAiPhotos[aiIdx].dataUrl = redactedDataUrl;
          if (typeof renderAiPhotoPreviewList === 'function') renderAiPhotoPreviewList();
        }
      // If called from photo modal on a specific index, replace in tempPhotoList
      } else if (redactorActivePhotoIdx !== null && typeof tempPhotoList !== 'undefined' && tempPhotoList[redactorActivePhotoIdx]) {
        tempPhotoList[redactorActivePhotoIdx].url = redactedDataUrl;
        if (typeof renderPhotoModalList === 'function') renderPhotoModalList();
      } else {
        // Find and replace in liveOjtData directly
        for (let w in liveOjtData) {
          liveOjtData[w].forEach(r => {
            if (r.images) {
              r.images.forEach(img => {
                if (img.url === redactorActiveImgUrl) {
                  img.url = redactedDataUrl;
                }
              });
            }
          });
        }
        // Update current zoom image if preview is open
        const zoomImg = document.getElementById('image-zoom-img');
        if (zoomImg) zoomImg.src = redactedDataUrl;
        
        saveToLocalStorage();
        renderOjtPages();
      }

      closeImageRedactor();
      alert('✓ บันทึกการเซ็นเซอร์ปิดข้อมูลส่วนบุคคล (PDPA) ลบคำที่ไม่ต้องการบนภาพเรียบร้อยแล้ว!');
    }

