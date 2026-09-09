// Module: 03-numeral.js (Smart GovReport Hub 2.5)
    // =========================================================================
    // NUMERAL SYSTEM CONTROL: ARABIC (1, 2, 3) VS THAI (1, 2, 3)
    // =========================================================================
    let numeralSystem = localStorage.getItem('ojt_numeral_system') || 'arabic';

    function toThaiNum(n) {
      if (numeralSystem === 'arabic') return String(n);
      const map = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
      return String(n).replace(/[0-9]/g, d => map[+d]);
    }

    function toArabicNum(str) {
      if (!str) return '';
      return String(str).replace(/[๐-๙]/g, d => "๐๑๒๓๔๕๖๗๘๙".indexOf(d));
    }

    function convertDocNumerals(element, target) {
      if (!element) return;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      let node;
      const thaiMap = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
      while (node = walker.nextNode()) {
        if (!node.nodeValue) continue;
        if (target === 'arabic') {
          node.nodeValue = node.nodeValue.replace(/[๐-๙]/g, d => "๐๑๒๓๔๕๖๗๘๙".indexOf(d));
        } else if (target === 'thai') {
          node.nodeValue = node.nodeValue.replace(/[0-9]/g, d => thaiMap[+d]);
        }
      }
    }

    function setNumeralSystem(system) {
      numeralSystem = system;
      localStorage.setItem('ojt_numeral_system', system);

      const btnArabic = document.getElementById('btn-num-arabic');
      const btnThai = document.getElementById('btn-num-thai');
      if (system === 'arabic') {
        if (btnArabic) btnArabic.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-govNavy text-white shadow-xs transition flex items-center space-x-1';
        if (btnThai) btnThai.className = 'px-2.5 py-1 text-xs font-bold rounded-lg text-slate-700 hover:bg-blue-100 transition flex items-center space-x-1';
      } else {
        if (btnArabic) btnArabic.className = 'px-2.5 py-1 text-xs font-bold rounded-lg text-slate-700 hover:bg-blue-100 transition flex items-center space-x-1';
        if (btnThai) btnThai.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-govNavy text-white shadow-xs transition flex items-center space-x-1';
      }

      // Re-render weekly pages and update profile
      renderOjtPages();
      renderProfile();
      renderProfileHeader();

      // Convert static parts of cover page after rendering
      const coverPage = document.getElementById('ojt-cover-page');
      if (coverPage) {
        convertDocNumerals(coverPage, system);
      }
    }

