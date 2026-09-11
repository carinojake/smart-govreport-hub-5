// =========================================================================
// MODULE 13: KNOWLEDGE BASE & PHOTO EVIDENCE HUB (Smart GovReport Hub 2.5)
// Developed for: ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (ศทส.) กระทรวงยุติธรรม
// Features: 
// 1. Senior Precedent Knowledge Base (สืบค้นงานรุ่นพี่ & แม่แบบเอกสาร)
// 2. Visual Evidence & Photo Gallery (คลังภาพหลักฐาน, Lightbox Zoom, Before-After, Mentor Thread)
// 3. Global Omnisearch (Ctrl + K / Cmd + K)
// 4. Client-side WebP Auto-Compression (<200KB for M1 Mac performance)
// =========================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- SEED DATA: SENIOR PRECEDENT KNOWLEDGE BASE ---
const INITIAL_KNOWLEDGE_BASE = [
  {
    id: 'kb-001',
    category: 'security',
    categoryLabel: 'งาน Antivirus Audit & Security',
    title: 'รายงานตรวจสอบช่องโหว่และความปลอดภัย Antivirus (ศทส. กระทรวงยุติธรรม)',
    author: 'คุณนิติพัฒน์ (พี่เจค - BB 211)',
    role: 'IT Specialist & Data Admin',
    date: '08 ก.ย. 2567',
    status: 'Approved',
    mentor: 'พี่สมชาย (ผู้ควบคุมงาน ศทส.)',
    summary: 'แนวทางการตรวจสอบระบบป้องกันไวรัสและช่องโหว่คอมพิวเตอร์ลูกข่ายทั่ว ศทส. พร้อมสคริปต์กระทบยอดอัตโนมัติ (Reconcile Python) สอดคล้องกับรายงาน AntiVirus_Audit_Report.xlsx',
    steps: [
      '1. ตรวจสอบสถานะการอัปเดต Signature ของ Antivirus ผ่านแดชบอร์ดศูนย์กลาง ศทส.',
      '2. รันสคริปต์ reconcile_antivirus.py เพื่อตรวจสอบเครื่องคอมพิวเตอร์ที่ไม่ส่งผลอัปเดตเกิน 7 วัน',
      '3. จัดทำรายงานสรุปช่องโหว่ตามมาตรฐานภาครัฐ และส่งออกไฟล์ AntiVirus_Audit_Report.xlsx'
    ],
    codeSnippet: 'python reconcile_antivirus.py --input raw_scan.csv --output AntiVirus_Audit_Report.xlsx',
    templateFile: 'AntiVirus_Audit_Report.xlsx',
    rating: '4.9/5 (18 คนนำไปใช้)'
  },
  {
    id: 'kb-002',
    category: 'docker',
    categoryLabel: 'งานติดตั้ง Docker & PostgreSQL 5432',
    title: 'คู่มือตั้งค่าและเชื่อมต่อ Container Docker PostgreSQL 5432 (Mac M1 & Production)',
    author: 'คุณนิติพัฒน์ (พี่เจค)',
    role: 'Senior Solution Architect',
    date: '05 ก.ย. 2567',
    status: 'Approved',
    mentor: 'ผอ.ศทส. กระทรวงยุติธรรม',
    summary: 'ขั้นตอนรัน Docker PostgreSQL พอร์ต 5432 บน Apple Silicon M1 รองรับ UTF-8 ภาษาไทย และการเชื่อมต่อแบบ AsyncPG Connection Pool สำหรับงานรายงาน OJT อัจฉริยะ',
    steps: [
      '1. ติดตั้ง Docker Desktop สำหรับ Mac Apple Silicon (ARM64)',
      '2. สั่งรัน docker container up -d เพื่อเปิดใช้งาน PostgreSQL 16 บนพอร์ต 5432',
      '3. ตรวจสอบสถานะตาราง ojt_reports, users, และ audit_logs พร้อมเชื่อมต่อ API บนพอร์ต 8086'
    ],
    codeSnippet: 'docker run --name smartgov-pg -e POSTGRES_PASSWORD=smartgov_secure -p 5432:5432 -d postgres:16-alpine',
    templateFile: 'docker-compose.yml',
    rating: '5.0/5 (24 คนนำไปใช้)'
  },
  {
    id: 'kb-003',
    category: 'saraban',
    categoryLabel: 'งานบันทึกสารบรรณภาครัฐ',
    title: 'แบบร่างบันทึกข้อความขออนุมัติจัดทำโครงการและรายงาน OJT 90 ชั่วโมง',
    author: 'นางสาวกานดา (รุ่นพี่ บจอ. รุ่น 1)',
    role: 'ผู้ช่วยนักวิเคราะห์นโยบายและแผน',
    date: '20 ส.ค. 2567',
    status: 'Approved',
    mentor: 'หัวหน้างานสารบรรณ ศทส.',
    summary: 'โครงสร้างบันทึกข้อความมาตรฐานระเบียบสำนักนายกรัฐมนตรี ว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ พร้อมสูตร R-C-T-F (Reason, Condition, Task, Final Action) สำหรับขออนุมัติงบประมาณและเวลาทำงาน',
    steps: [
      '1. ระบุส่วนราชการ วันที่ และเรื่องให้กระชับ ชัดเจน ตามมาตรฐานระเบียบสำนักนายกฯ',
      '2. ใช้โครงสร้าง 3 ย่อหน้า: ความเป็นมา (Reason), ข้อเท็จจริงและรายละเอียดงาน (Condition/Task), และข้อพิจารณาเพื่อโปรดอนุมัติ (Final Action)',
      '3. นำเสนอผ่านระบบสารบรรณอิเล็กทรอนิกส์พร้อมเอกสารแนบและตราครุฑมาตรฐาน'
    ],
    codeSnippet: 'เรียน ปลัดกระทรวงยุติธรรม\\nตามที่ ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร ได้ดำเนินโครงการเตรียมความพร้อมฯ...',
    templateFile: 'official_memo_template.docx',
    rating: '4.8/5 (31 คนนำไปใช้)'
  },
  {
    id: 'kb-004',
    category: 'hardware',
    categoryLabel: 'งานบำรุงรักษาคอมพิวเตอร์และเครือข่าย ศทส.',
    title: 'ขั้นตอนการตรวจเช็กและทำความสะอาดคอมพิวเตอร์ลูกข่ายและตู้ Rack Server',
    author: 'นายวีรพล (รุ่นพี่ บจอ. รุ่น 1)',
    role: 'ช่างเทคนิคคอมพิวเตอร์',
    date: '15 ส.ค. 2567',
    status: 'Approved',
    mentor: 'นายช่างเทคนิคอาวุโส ศทส.',
    summary: 'Checklist การตรวจเช็กฝุ่น สายเคเบิล LAN, อุณหภูมิเครื่องแม่ข่าย และการจัดระเบียบสาย Cable Management พร้อมบันทึกภาพถ่าย Before-After สารบรรณ',
    steps: [
      '1. ปิดเครื่องและถอดปลั๊กไฟทุกครั้งก่อนเปิดฝาครอบเครื่อง PC',
      '2. ใช้เครื่องเป่าลมแรงดันต่ำทำความสะอาดพัดลม CPU และ Heat sink',
      '3. ตรวจสอบและบันทึกภาพถ่ายก่อน-หลังการทำความสะอาดเพื่อแนบลงในระบบ Smart GovReport Hub'
    ],
    codeSnippet: 'Checklist: CPU Temp < 65°C | RAM Contact Clean | Cable Ties Replaced | Ground Wire OK',
    templateFile: 'hardware_maintenance_checklist.pdf',
    rating: '4.9/5 (15 คนนำไปใช้)'
  }
];

// --- SEED DATA: PHOTO EVIDENCE GALLERY ---
const INITIAL_PHOTO_GALLERY = [
  {
    id: 'pg-001',
    title: 'ตรวจสอบและทำความสะอาดคอมพิวเตอร์ (PC Maintenance)',
    date: '09 ก.ย. 2567',
    category: 'hardware',
    categoryLabel: 'ฮาร์ดแวร์',
    author: 'สุกัญญา บรรจง (ผู้ฝึกงาน ศทส.)',
    supervisor: 'นายสมชาย มีแก้ว (พี่เลี้ยง ศทส.)',
    verified: true,
    isBeforeAfter: true,
    url: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=900&auto=format&fit=crop&q=80',
    beforeImg: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=900&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=900&auto=format&fit=crop&q=80',
    caption: 'ตรวจเช็กฝุ่น พัดลมระบายความร้อน และจัดระเบียบสายไฟเครื่องคอมพิวเตอร์ห้องปฏิบัติการ ศทส. อาคารกระทรวงยุติธรรม',
    comments: [
      { sender: 'นายสมชาย (พี่เลี้ยง)', text: 'ภาพถ่ายชัดเจน ขั้นตอนถูกต้อง พยายามเขียนคำอธิบายเพิ่มเติมเกี่ยวกับปัญหาที่พบด้วยครับ', time: '09/09/2567 14:15' },
      { sender: 'สุกัญญา (ผู้ฝึกงาน)', text: 'รับทราบค่ะพี่สมชาย ได้บันทึกรายละเอียดเรื่องฝุ่นสะสมในพัดลม CPU เพิ่มเติมลงในสมุด OJT แล้วค่ะ', time: '09/09/2567 15:00' }
    ]
  },
  {
    id: 'pg-002',
    title: 'ตรวจเช็กสถานะไฟและสายเคเบิลตู้ Server Rack',
    date: '07 ก.ย. 2567',
    category: 'server',
    categoryLabel: 'เซิร์ฟเวอร์',
    author: 'คุณนิติพัฒน์ (พี่เจค)',
    supervisor: 'ผอ.ศทส. กระทรวงยุติธรรม',
    verified: true,
    isBeforeAfter: true,
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=900&auto=format&fit=crop&q=80',
    beforeImg: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=900&auto=format&fit=crop&q=80',
    caption: 'ตรวจสัญญาณไฟสถานะสวิตช์เครือข่ายและระบบสำรองไฟ UPS Data Center ชั้น 4 กระทรวงยุติธรรม',
    comments: [
      { sender: 'ผอ.ศทส.', text: 'ยอดเยี่ยมครับ เรียบร้อยได้มาตรฐานการจัดการห้อง Data Center สารสนเทศ', time: '07/09/2567 16:30' }
    ]
  },
  {
    id: 'pg-003',
    title: 'จัดเรียงแฟ้มเอกสารสัญญาโครงการ (Document Sorting)',
    date: '08 ก.ย. 2567',
    category: 'document',
    categoryLabel: 'งานเอกสาร',
    author: 'นางสาวกานดา (ผู้ฝึกงาน)',
    supervisor: 'หัวหน้างานสารบรรณ ศทส.',
    verified: true,
    isBeforeAfter: false,
    url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=900&auto=format&fit=crop&q=80',
    caption: 'จัดหมวดหมู่แฟ้มสัญญาและเอกสารตรวจรับงานโครงการประจำปีงบประมาณ ๒๕๖๗ เรียบร้อยถูกต้อง',
    comments: [
      { sender: 'หัวหน้างานสารบรรณ', text: 'ตรวจเช็กเลขที่สัญญาให้ตรงกับระบบสารบรรณคอมพิวเตอร์ด้วยนะคะ เรียบร้อยดีมากค่ะ', time: '08/09/2567 11:20' }
    ]
  },
  {
    id: 'pg-004',
    title: 'ทดสอบและเชื่อมต่อ Docker PostgreSQL Container (5432)',
    date: '05 ก.ย. 2567',
    category: 'server',
    categoryLabel: 'เซิร์ฟเวอร์',
    author: 'คุณนิติพัฒน์ (พี่เจค)',
    supervisor: 'นายสมชาย (พี่เลี้ยง ศทส.)',
    verified: true,
    isBeforeAfter: false,
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
    caption: 'ทดสอบคำสั่ง docker run และเชื่อมต่อผ่าน AsyncPG สำเร็จ สถานะ Docker PostgreSQL 5432 ออนไลน์',
    comments: [
      { sender: 'นายสมชาย (พี่เลี้ยง)', text: 'การตั้งค่าพอร์ต 5432 ทำงานได้อย่างสมบูรณ์ ระบบพร้อมรองรับข้อมูลขนาดใหญ่', time: '05/09/2567 17:00' }
    ]
  }
];

// Local state variables
let knowledgeBaseState = [];
let photoGalleryState = [];
let activeKbCategory = 'all';
let activePhotoCategory = 'all';
let activeLightboxPhotoId = null;
let activeLightboxMode = 'after'; // 'before' or 'after'
let lightboxZoomLevel = 1.0;

// Initialize Storage
function initKnowledgeAndPhotoHub() {
  try {
    const savedKb = localStorage.getItem('SMARTGOV_KNOWLEDGE_BASE');
    if (savedKb) {
      knowledgeBaseState = JSON.parse(savedKb);
    } else {
      knowledgeBaseState = INITIAL_KNOWLEDGE_BASE;
      localStorage.setItem('SMARTGOV_KNOWLEDGE_BASE', JSON.stringify(knowledgeBaseState));
    }

    const savedPhotos = localStorage.getItem('SMARTGOV_PHOTO_GALLERY');
    if (savedPhotos) {
      photoGalleryState = JSON.parse(savedPhotos);
    } else {
      photoGalleryState = INITIAL_PHOTO_GALLERY;
      localStorage.setItem('SMARTGOV_PHOTO_GALLERY', JSON.stringify(photoGalleryState));
    }
  } catch (err) {
    console.warn('LocalStorage access warning in Hub:', err);
    knowledgeBaseState = INITIAL_KNOWLEDGE_BASE;
    photoGalleryState = INITIAL_PHOTO_GALLERY;
  }

  // Update Photo count badge in sidebar if exists
  const badge = document.getElementById('sidebar-photo-count-badge');
  if (badge) badge.innerText = `${photoGalleryState.length}`;
}

// =========================================================================
// 1. KNOWLEDGE BASE CONTROLLER (คลังสืบค้นงานรุ่นพี่)
// =========================================================================
function renderKnowledgeBase(category = activeKbCategory, query = '') {
  activeKbCategory = category;
  const container = document.getElementById('kb-cards-container');
  const countLabel = document.getElementById('kb-result-count');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();
  const filtered = knowledgeBaseState.filter(item => {
    const matchCat = (category === 'all' || item.category === category);
    const matchQuery = !q || (
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q) ||
      (item.codeSnippet && item.codeSnippet.toLowerCase().includes(q))
    );
    return matchCat && matchQuery;
  });

  if (countLabel) countLabel.innerText = `พบ ${filtered.length} ผลงานที่ผ่านการรับรอง`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl mb-3">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <h4 class="text-base font-bold text-slate-700">ไม่พบข้อมูลที่ตรงกับคำค้นหา</h4>
        <p class="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือคลิกดูหมวดหมู่อื่นๆ เช่น "งาน Antivirus Audit" หรือ "งานติดตั้ง Docker"</p>
        <button onclick="filterKnowledgeCategory('all')" class="mt-4 px-4 py-2 bg-govNavy text-white rounded-xl text-xs font-semibold hover:bg-govNavyLight transition">
          ดูผลงานทั้งหมด
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="bg-white rounded-2xl border border-slate-200/90 hover:border-govNavy/40 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      
      <!-- Card Top -->
      <div class="p-5 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <i class="fa-solid fa-circle-check text-emerald-500"></i>
            <span>Completed & Approved</span>
          </span>
          <span class="text-[11px] text-slate-400 font-mono">${item.date}</span>
        </div>

        <div>
          <span class="text-[10px] font-semibold text-govTeal bg-govTealLight px-2 py-0.5 rounded-md">
            ${item.categoryLabel}
          </span>
          <h3 class="text-sm font-bold text-slate-900 mt-1.5 leading-snug group-hover:text-govNavy transition">
            ${escapeHtml(item.title)}
          </h3>
          <p class="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
            ${escapeHtml(item.summary)}
          </p>
        </div>

        <!-- Author & Mentor Badge -->
        <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2 min-w-0">
            <div class="w-7 h-7 rounded-full bg-govNavy text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
              <i class="fa-solid fa-user-graduate"></i>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-slate-800 text-[11px] truncate">${item.author}</p>
              <p class="text-[10px] text-slate-500 truncate">${item.role}</p>
            </div>
          </div>
          <span class="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
            <i class="fa-solid fa-medal text-amber-500 mr-1"></i>Mentor Review
          </span>
        </div>

        <!-- Step-by-step Notes Preview -->
        <div class="space-y-1 text-[11px] text-slate-600 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
          <span class="font-bold text-govNavy block text-[10px] uppercase tracking-wider">
            <i class="fa-solid fa-list-check mr-1 text-govGold"></i>สรุปขั้นตอนวิธีทำ:
          </span>
          ${item.steps.map(s => `<p class="truncate">• ${s}</p>`).join('')}
        </div>

        <!-- Code/Command Snippet if available -->
        ${item.codeSnippet ? `
          <div class="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[10px] relative group/code overflow-hidden">
            <div class="flex items-center justify-between text-slate-400 border-b border-slate-700 pb-1 mb-1 text-[9px]">
              <span>คำสั่ง/สคริปต์ตัวอย่าง</span>
              <button onclick="navigator.clipboard.writeText('${item.codeSnippet.replace(/'/g, "\\'")}'); alert('✓ คัดลอกคำสั่งเรียบร้อยแล้ว!');" class="hover:text-white transition">
                <i class="fa-solid fa-copy mr-0.5"></i> คัดลอก
              </button>
            </div>
            <p class="truncate select-all">${item.codeSnippet}</p>
          </div>
        ` : ''}
      </div>

      <!-- Card Footer Actions -->
      <div class="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <button onclick="downloadKbTemplate('${item.templateFile}', '${item.title.replace(/'/g, "\\'")}')" class="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-govNavy border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-2xs transition">
          <i class="fa-solid fa-file-arrow-down text-govGold"></i>
          <span class="truncate">โหลด Template (${item.templateFile.split('.').pop().toUpperCase()})</span>
        </button>
        <button onclick="askMentorKb('${item.id}')" class="py-2 px-3 bg-govNavy hover:bg-govNavyLight text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition flex-shrink-0" title="ประสานงานและถามข้อสงสัย">
          <i class="fa-solid fa-comments text-amber-300"></i>
          <span>ถามพี่เลี้ยง</span>
        </button>
      </div>

    </div>
  `).join('');
}

function filterKnowledgeCategory(category) {
  activeKbCategory = category;
  const btns = document.querySelectorAll('.kb-filter-btn');
  btns.forEach(b => {
    if (b.dataset.cat === category) {
      b.className = 'kb-filter-btn px-3 py-1.5 rounded-full text-xs font-bold bg-govNavy text-white shadow-xs transition';
    } else {
      b.className = 'kb-filter-btn px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition';
    }
  });

  const searchInput = document.getElementById('kb-search-input');
  renderKnowledgeBase(category, searchInput ? searchInput.value : '');
}

function searchKnowledgeBase() {
  const searchInput = document.getElementById('kb-search-input');
  renderKnowledgeBase(activeKbCategory, searchInput ? searchInput.value : '');
}

function downloadKbTemplate(filename, title) {
  alert(`📥 ดาวน์โหลดแม่แบบ: "${filename}" สำหรับงาน "${title}" สำเร็จ!\n(ระบบได้จำลองการส่งออกไฟล์ Template เอกสารราชการเรียบร้อยแล้ว)`);
}

function askMentorKb(kbId) {
  const item = knowledgeBaseState.find(k => k.id === kbId);
  if (!item) return;
  const question = prompt(`💬 ส่งข้อความปรึกษา ${item.mentor} เกี่ยวกับเรื่อง:\n"${item.title}"\n\nระบุคำถามหรือประเด็นที่ต้องการให้ช่วยชี้แนะ:`);
  if (question && question.trim()) {
    alert(`✓ ส่งข้อความถึง ${item.mentor} เรียบร้อยแล้ว!\nระบบได้บันทึกคำถามเข้าสู่ระบบประสานงานกลาง ศทส.`);
  }
}

// =========================================================================
// 2. PHOTO EVIDENCE GALLERY CONTROLLER (คลังภาพหลักฐาน)
// =========================================================================
function renderPhotoGallery(category = activePhotoCategory) {
  activePhotoCategory = category;
  const container = document.getElementById('photo-gallery-grid');
  const countLabel = document.getElementById('photo-gallery-count');
  if (!container) return;

  const filtered = photoGalleryState.filter(item => {
    if (category === 'all') return true;
    if (category === 'before-after') return item.isBeforeAfter;
    return item.category === category;
  });

  if (countLabel) countLabel.innerText = `แสดงทั้งหมด ${filtered.length} ภาพหลักฐาน`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl mb-3">
          <i class="fa-regular fa-image"></i>
        </div>
        <h4 class="text-base font-bold text-slate-700">ยังไม่มีรูปภาพในหมวดหมู่นี้</h4>
        <p class="text-xs text-slate-500 mt-1">สามารถอัปโหลดภาพถ่ายใหม่เพื่อเป็นหลักฐานประกอบสมุด OJT Logbook ได้ทันที</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group">
      
      <!-- Image Thumbnail Container with Click to Lightbox -->
      <div onclick="openPhotoLightbox('${item.id}')" class="relative cursor-pointer overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
        <img src="${item.url}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
        
        <!-- Category & Badges Overlay -->
        <div class="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
          <span class="bg-govNavy/80 backdrop-blur-md text-white font-bold text-[10px] px-2 py-0.5 rounded-lg border border-white/20">
            ${item.categoryLabel}
          </span>
          ${item.isBeforeAfter ? `
            <span class="bg-amber-500/90 backdrop-blur-md text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded-lg border border-amber-300/40">
              ⚡ Before & After
            </span>
          ` : ''}
        </div>

        <div class="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center space-x-1">
          <i class="fa-solid fa-magnifying-glass-plus text-govGold"></i>
          <span>ดูภาพใหญ่</span>
        </div>
      </div>

      <!-- Info Area -->
      <div class="p-4 space-y-2">
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span class="font-medium"><i class="fa-regular fa-calendar mr-1"></i>${item.date}</span>
          <span class="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <i class="fa-solid fa-circle-check mr-1"></i>อนุมัติแล้ว
          </span>
        </div>

        <h4 class="text-xs font-bold text-slate-900 leading-snug group-hover:text-govNavy transition line-clamp-1">
          ${item.title}
        </h4>
        <p class="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
          ${item.caption}
        </p>

        <!-- Supervisor Tag -->
        <div class="pt-1 flex items-center justify-between border-t border-slate-100 text-[10px] text-slate-500">
          <span class="truncate">ผู้บันทึก: <b>${item.author.split(' ')[0]}</b></span>
          <span class="text-govNavy font-semibold truncate"><i class="fa-solid fa-user-check text-govTeal mr-0.5"></i> ${item.supervisor}</span>
        </div>

        <!-- Comments Preview count -->
        <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <span><i class="fa-regular fa-comment-dots text-indigo-500 mr-1"></i>${item.comments ? item.comments.length : 0} ข้อคิดเห็น</span>
          <button onclick="openPhotoLightbox('${item.id}')" class="text-govNavy font-bold hover:underline">
            ดูความคิดเห็น & ขยายภาพ →
          </button>
        </div>
      </div>

    </div>
  `).join('');
}

function filterPhotoCategory(cat) {
  activePhotoCategory = cat;
  const btns = document.querySelectorAll('.photo-filter-btn');
  btns.forEach(b => {
    if (b.dataset.cat === cat) {
      b.className = 'photo-filter-btn px-3 py-1.5 rounded-full text-xs font-bold bg-govNavy text-white shadow-xs transition';
    } else {
      b.className = 'photo-filter-btn px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition';
    }
  });

  renderPhotoGallery(cat);
}

// --- LIGHTBOX CONTROLLER ---
function openPhotoLightbox(photoId) {
  activeLightboxPhotoId = photoId;
  const item = photoGalleryState.find(p => p.id === photoId);
  if (!item) return;

  lightboxZoomLevel = 1.0;
  activeLightboxMode = 'after';

  const modal = document.getElementById('photo-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const caption = document.getElementById('lightbox-caption');
  const date = document.getElementById('lightbox-date');
  const author = document.getElementById('lightbox-author');
  const supervisor = document.getElementById('lightbox-supervisor');
  const baControls = document.getElementById('lightbox-before-after-controls');
  const commentsList = document.getElementById('lightbox-comments-list');

  if (title) title.innerText = item.title;
  if (caption) caption.innerText = item.caption;
  if (date) date.innerText = item.date;
  if (author) author.innerText = item.author;
  if (supervisor) supervisor.innerText = item.supervisor;

  // Set Before-After Controls
  if (baControls) {
    if (item.isBeforeAfter) {
      baControls.classList.remove('hidden');
      toggleLightboxBeforeAfter('after');
    } else {
      baControls.classList.add('hidden');
      if (img) img.src = item.url;
    }
  } else if (img) {
    img.src = item.url;
  }

  updateLightboxZoom();
  renderLightboxComments(item);

  if (modal) modal.classList.remove('hidden');
}

function closePhotoLightbox() {
  const modal = document.getElementById('photo-lightbox-modal');
  if (modal) modal.classList.add('hidden');
  activeLightboxPhotoId = null;
}

function toggleLightboxBeforeAfter(mode) {
  activeLightboxMode = mode;
  const item = photoGalleryState.find(p => p.id === activeLightboxPhotoId);
  if (!item) return;

  const img = document.getElementById('lightbox-img');
  const btnBefore = document.getElementById('lightbox-btn-before');
  const btnAfter = document.getElementById('lightbox-btn-after');

  if (mode === 'before' && item.beforeImg) {
    if (img) img.src = item.beforeImg;
    if (btnBefore) btnBefore.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-900 shadow transition';
    if (btnAfter) btnAfter.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white hover:bg-white/30 transition';
  } else {
    if (img) img.src = item.afterImg || item.url;
    if (btnAfter) btnAfter.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow transition';
    if (btnBefore) btnBefore.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white hover:bg-white/30 transition';
  }
}

function zoomLightbox(delta) {
  lightboxZoomLevel = Math.max(0.6, Math.min(2.5, lightboxZoomLevel + delta));
  updateLightboxZoom();
}

function updateLightboxZoom() {
  const img = document.getElementById('lightbox-img');
  const zoomLabel = document.getElementById('lightbox-zoom-label');
  if (img) img.style.transform = `scale(${lightboxZoomLevel})`;
  if (zoomLabel) zoomLabel.innerText = `${Math.round(lightboxZoomLevel * 100)}%`;
}

function renderLightboxComments(item) {
  const container = document.getElementById('lightbox-comments-list');
  if (!container) return;

  if (!item.comments || item.comments.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-400 text-xs italic">
        ยังไม่มีข้อคิดเห็นจากพี่เลี้ยงในรายการนี้
      </div>
    `;
    return;
  }

  container.innerHTML = item.comments.map(c => `
    <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
      <div class="flex items-center justify-between text-slate-500 text-[10px]">
        <span class="font-bold text-govNavy">${escapeHtml(c.sender)}</span>
        <span>${escapeHtml(c.time)}</span>
      </div>
      <p class="text-slate-700 leading-relaxed font-sarabun">${escapeHtml(c.text)}</p>
    </div>
  `).join('');
}

function addLightboxComment() {
  const input = document.getElementById('lightbox-new-comment-input');
  if (!input || !input.value.trim()) return;

  const item = photoGalleryState.find(p => p.id === activeLightboxPhotoId);
  if (!item) return;

  if (!item.comments) item.comments = [];
  
  const now = new Date();
  const dateStr = `${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
  
  item.comments.push({
    sender: 'คุณนิติพัฒน์ (พี่เจค - ศทส.)',
    text: input.value.trim(),
    time: dateStr
  });

  input.value = '';
  localStorage.setItem('SMARTGOV_PHOTO_GALLERY', JSON.stringify(photoGalleryState));
  renderLightboxComments(item);
  renderPhotoGallery();
}

// --- CLIENT-SIDE WEBP COMPRESSION & UPLOAD HANDLER ---
function handlePhotoGalleryUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const title = prompt('📷 ระบุชื่องานหรือภารกิจสำหรับภาพถ่ายนี้:', 'งานตรวจสอบระบบ ศทส.');
  if (!title) return;

  const category = prompt('ระบุหมวดหมู่ (hardware / server / document):', 'hardware') || 'hardware';
  const caption = prompt('ระบุคำอธิบายภาพและผลการปฏิบัติงาน:', 'ดำเนินงานเรียบร้อยตามมาตรฐาน');

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Create canvas for WebP compression (max width 1200px)
      const maxW = 1200;
      let w = img.width;
      let h = img.height;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      // Compress to WebP at 85% quality (<200KB)
      const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);

      const newPhoto = {
        id: 'pg-' + Date.now(),
        title: title,
        date: new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }),
        category: category,
        categoryLabel: category === 'server' ? 'เซิร์ฟเวอร์' : (category === 'document' ? 'งานเอกสาร' : 'ฮาร์ดแวร์'),
        author: 'คุณนิติพัฒน์ (ผู้ปฏิบัติงาน)',
        supervisor: 'นายสมชาย มีแก้ว (พี่เลี้ยง ศทส.)',
        verified: true,
        isBeforeAfter: false,
        url: compressedDataUrl,
        caption: caption || title,
        comments: [
          { sender: 'ระบบอัตโนมัติ', text: `บันทึกรูปภาพและบีบอัด WebP สำเร็จ (ขนาดความกว้าง ${w}px)`, time: 'เมื่อสักครู่' }
        ]
      };

      photoGalleryState.unshift(newPhoto);
      localStorage.setItem('SMARTGOV_PHOTO_GALLERY', JSON.stringify(photoGalleryState));
      renderPhotoGallery();
      alert('✓ อัปโหลดและบีบอัดภาพถ่ายหลักฐานเข้าสู่คลังเรียบร้อยแล้ว!');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// =========================================================================
// 3. GLOBAL OMNISEARCH MODAL (Ctrl + K / Cmd + K)
// =========================================================================
function openGlobalSearchModal() {
  const modal = document.getElementById('global-search-modal');
  const input = document.getElementById('global-search-input');
  if (modal) modal.classList.remove('hidden');
  if (input) {
    input.value = '';
    input.focus();
    handleGlobalSearchInput('');
  }
}

function closeGlobalSearchModal() {
  const modal = document.getElementById('global-search-modal');
  if (modal) modal.classList.add('hidden');
}

function handleGlobalSearchInput(val) {
  const container = document.getElementById('global-search-results');
  if (!container) return;

  const q = (val || '').toLowerCase().trim();
  
  // Search Knowledge Base
  const kbMatches = knowledgeBaseState.filter(k => 
    !q || k.title.toLowerCase().includes(q) || k.summary.toLowerCase().includes(q) || k.categoryLabel.toLowerCase().includes(q)
  ).slice(0, 3);

  // Search Photos
  const photoMatches = photoGalleryState.filter(p =>
    !q || p.title.toLowerCase().includes(q) || p.caption.toLowerCase().includes(q) || p.categoryLabel.toLowerCase().includes(q)
  ).slice(0, 3);

  container.innerHTML = `
    <!-- KB Results -->
    <div class="space-y-2">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
        <i class="fa-solid fa-book-open-reader text-govGold mr-1"></i>คลังสืบค้นงานรุ่นพี่ (${kbMatches.length})
      </span>
      ${kbMatches.map(k => `
        <div onclick="closeGlobalSearchModal(); switchTab('knowledge-base'); filterKnowledgeCategory('${k.category}');" class="p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 cursor-pointer transition flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-govNavy leading-tight">${k.title}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">${k.categoryLabel} • โดย ${k.author}</p>
          </div>
          <i class="fa-solid fa-chevron-right text-slate-400 text-xs"></i>
        </div>
      `).join('')}
    </div>

    <!-- Photo Results -->
    <div class="space-y-2 pt-2 border-t border-slate-100">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
        <i class="fa-solid fa-images text-govTeal mr-1"></i>คลังภาพถ่ายหลักฐาน (${photoMatches.length})
      </span>
      <div class="grid grid-cols-3 gap-2">
        ${photoMatches.map(p => `
          <div onclick="closeGlobalSearchModal(); switchTab('photo-gallery'); openPhotoLightbox('${p.id}');" class="group cursor-pointer rounded-xl overflow-hidden border border-slate-200 aspect-video relative bg-slate-900">
            <img src="${p.url}" class="w-full h-full object-cover group-hover:scale-105 transition duration-200">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-1.5 flex flex-col justify-end">
              <p class="text-[9px] font-bold text-white truncate">${p.title}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Global Keyboard Shortcut: Ctrl + K / Cmd + K
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    openGlobalSearchModal();
  } else if (e.key === 'Escape') {
    closeGlobalSearchModal();
    closePhotoLightbox();
  }
});

// =========================================================================
// 4. MODERN FLOATING TOAST NOTIFICATION ENGINE (Non-blocking)
// =========================================================================
function showToast(message, type = 'auto', duration = 3500) {
  let container = document.getElementById('floating-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'floating-toast-container';
    container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0 no-print';
    document.body.appendChild(container);
  }

  // Auto determine type if 'auto'
  if (type === 'auto') {
    const msg = String(message).toLowerCase();
    if (msg.includes('สำเร็จ') || msg.includes('✓') || msg.includes('ok') || msg.includes('ปลอดภัย') || msg.includes('เรียบร้อย')) {
      type = 'success';
    } else if (msg.includes('🔒') || msg.includes('🚫') || msg.includes('เตือน') || msg.includes('สิทธิ์ไม่เพียงพอ') || msg.includes('กรุณา')) {
      type = 'warning';
    } else if (msg.includes('ข้อผิดพลาด') || msg.includes('ล้มเหลว') || msg.includes('error') || msg.includes('fail')) {
      type = 'error';
    } else {
      type = 'info';
    }
  }

  const toastId = 'toast-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = 'pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border transition-all duration-300 transform translate-y-4 opacity-0 flex flex-col overflow-hidden';

  let borderStyle = 'border-slate-200/90 text-slate-800';
  let iconHtml = '<i class="fa-solid fa-circle-info text-blue-500 text-lg"></i>';
  let barColor = 'bg-blue-500';

  if (type === 'success') {
    borderStyle = 'border-emerald-300 text-slate-900 bg-gradient-to-r from-white via-emerald-50/40 to-white shadow-emerald-500/10';
    iconHtml = '<i class="fa-solid fa-circle-check text-emerald-500 text-lg"></i>';
    barColor = 'bg-emerald-500';
  } else if (type === 'warning') {
    borderStyle = 'border-amber-300 text-slate-900 bg-gradient-to-r from-white via-amber-50/40 to-white shadow-amber-500/10';
    iconHtml = '<i class="fa-solid fa-triangle-exclamation text-amber-500 text-lg"></i>';
    barColor = 'bg-amber-500';
  } else if (type === 'error') {
    borderStyle = 'border-rose-300 text-slate-900 bg-gradient-to-r from-white via-rose-50/40 to-white shadow-rose-500/10';
    iconHtml = '<i class="fa-solid fa-circle-xmark text-rose-500 text-lg"></i>';
    barColor = 'bg-rose-500';
  }

  toast.className += ' ' + borderStyle;

  // Format message lines
  const formattedMsg = String(message).replace(/\n/g, '<br>');

  toast.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0 pt-0.5">
        ${iconHtml}
      </div>
      <div class="flex-1 min-w-0 pr-1">
        <p class="text-xs font-semibold leading-relaxed font-sarabun text-slate-800">
          ${formattedMsg}
        </p>
      </div>
      <button onclick="dismissToast('${toastId}')" class="text-slate-400 hover:text-slate-600 p-0.5 rounded transition flex-shrink-0">
        <i class="fa-solid fa-xmark text-xs"></i>
      </button>
    </div>
    <!-- Progress Bar -->
    <div class="w-full bg-slate-100 h-1 mt-2.5 rounded-full overflow-hidden">
      <div id="${toastId}-bar" class="${barColor} h-full transition-all linear" style="width: 100%;"></div>
    </div>
  `;

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    
    // Animate progress bar
    const bar = document.getElementById(`${toastId}-bar`);
    if (bar) {
      bar.style.transitionDuration = `${duration}ms`;
      bar.style.width = '0%';
    }
  });

  // Auto dismiss
  const timer = setTimeout(() => {
    dismissToast(toastId);
  }, duration);

  toast.dataset.timer = timer;
}

function dismissToast(toastId) {
  const toast = document.getElementById(toastId);
  if (!toast) return;
  if (toast.dataset.timer) clearTimeout(parseInt(toast.dataset.timer));

  toast.classList.add('opacity-0', 'translate-x-8');
  setTimeout(() => {
    if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

// Seamlessly override window.alert to use Modern Floating Toast
if (typeof window !== 'undefined') {
  window.nativeAlert = window.alert;
  window.alert = function(msg) {
    showToast(msg);
  };
}

// --- HEADER DROPDOWNS CONTROLLER ---
function toggleSystemHubDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('system-hub-dropdown');
  const a11y = document.getElementById('a11y-dropdown');
  if (a11y) a11y.classList.add('hidden');
  if (dropdown) dropdown.classList.toggle('hidden');
}

function toggleA11yDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('a11y-dropdown');
  const sys = document.getElementById('system-hub-dropdown');
  if (sys) sys.classList.add('hidden');
  if (dropdown) dropdown.classList.toggle('hidden');
}

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
  const sys = document.getElementById('system-hub-dropdown');
  const a11y = document.getElementById('a11y-dropdown');
  if (sys && !sys.contains(e.target) && !e.target.closest('#btn-system-hub-toggle')) {
    sys.classList.add('hidden');
  }
  if (a11y && !a11y.contains(e.target) && !e.target.closest('#btn-a11y-toggle')) {
    a11y.classList.add('hidden');
  }
});

// Auto initialize when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKnowledgeAndPhotoHub);
} else {
  initKnowledgeAndPhotoHub();
}
