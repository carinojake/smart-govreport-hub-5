/**
 * 🏛️ MODULE 6: DIGITAL SIGNATURE ENGINE
 * ลายมือชื่อดิจิทัล HTML5 Canvas, ประทับเวลา และระบบ Data Freeze ล็อกสัปดาห์
 */

export class SignatureEngine {
  constructor() {
    this.signatures = {};
  }

  initPad(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const start = (e) => {
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      e.preventDefault();
    };

    const move = (e) => {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      e.preventDefault();
    };

    const stop = () => { drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', stop);

    return {
      clear: () => ctx.clearRect(0, 0, canvas.width, canvas.height),
      toDataURL: () => canvas.toDataURL('image/png')
    };
  }

  isWeekFrozen(weekNum, signaturesState) {
    return !!(signaturesState && signaturesState[weekNum]?.supervisor);
  }
}

export const signature = new SignatureEngine();
