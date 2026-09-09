/**
 * 🏛️ MODULE 5: DIGITAL EVIDENCE & CANVAS COMPRESSION
 * บีบอัดภาพถ่าย SOP ให้เหลือ <150KB และระบบเซ็นเซอร์ภาพ PDPA
 */

export async function compressImageToDataUrl(file, maxDimension = 1280, quality = 0.75) {
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

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let compressedDataUrl = '';
        try {
          compressedDataUrl = canvas.toDataURL('image/webp', quality);
          if (!compressedDataUrl.startsWith('data:image/webp')) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const compressedBytes = Math.round((compressedDataUrl.length * 3) / 4);
        resolve({
          dataUrl: compressedDataUrl,
          width,
          height,
          originalSize: file.size,
          compressedSize: compressedBytes
        });
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function drawPdpaRedaction(canvas, startX, startY, width, height) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(startX, startY, width, height);
}
