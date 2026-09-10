/**
 * Smart GovReport Hub V3 - Client-side Image Compressor & Google Drive Attachment Helper
 * Automatically scales & compresses photos to WebP/JPEG (<200KB)
 * Parses Google Drive links for high-res evidence attachments
 * Author: ทีมงาน SmartGov 2026 (พี่แจ็ค M1 Architecture)
 */

class SmartGovMediaManager {
  constructor() {
    this.defaultMaxWidth = 1280;
    this.defaultMaxHeight = 1280;
    this.defaultQuality = 0.82;
  }

  /**
   * Compress an image file using HTML5 Canvas
   * @param {File|Blob} file - Original image file
   * @param {Object} options - Custom options { maxWidth, maxHeight, quality, format }
   * @returns {Promise<{ dataUrl: string, originalSize: number, compressedSize: number, mimeType: string, width: number, height: number, reduction: string }>}
   */
  async compressImage(file, options = {}) {
    const maxWidth = options.maxWidth || this.defaultMaxWidth;
    const maxHeight = options.maxHeight || this.defaultMaxHeight;
    const quality = options.quality !== undefined ? options.quality : this.defaultQuality;
    const format = options.format || 'image/webp';

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (err) => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้: ' + err));

      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('รูปแบบไฟล์ภาพไม่ถูกต้องหรือไม่รองรับ'));

        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Proportional scaling
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Try exporting to WebP first, fallback to JPEG if browser doesn't support
          let outputDataUrl = canvas.toDataURL(format, quality);
          if (format === 'image/webp' && !outputDataUrl.startsWith('data:image/webp')) {
            outputDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // Calculate size stats
          const originalSize = file.size;
          // Approximate size from base64 string
          const base64Length = outputDataUrl.length - (outputDataUrl.indexOf(',') + 1);
          const compressedSize = Math.round((base64Length * 3) / 4);
          const reductionPercent = originalSize > 0
            ? Math.max(0, ((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
            : '0';

          resolve({
            dataUrl: outputDataUrl,
            originalSize,
            compressedSize,
            mimeType: outputDataUrl.split(';')[0].replace('data:', ''),
            width,
            height,
            reduction: `${reductionPercent}%`,
            originalKB: (originalSize / 1024).toFixed(1) + ' KB',
            compressedKB: (compressedSize / 1024).toFixed(1) + ' KB'
          });
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Parse and extract Google Drive File ID & generate preview/view URLs
   * @param {string} url - Google Drive URL
   * @returns {Object|null}
   */
  parseGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    // Regex for standard drive share links
    // https://drive.google.com/file/d/{ID}/view...
    // https://drive.google.com/open?id={ID}
    // https://docs.google.com/document/d/{ID}/edit
    const fileIdMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
                        trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
                        trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      const isFolder = trimmed.includes('/folders/');
      return {
        isValid: true,
        fileId: fileId,
        isFolder: isFolder,
        viewUrl: isFolder ? `https://drive.google.com/drive/folders/${fileId}` : `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
        thumbnailUrl: isFolder ? null : `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
        downloadUrl: isFolder ? null : `https://drive.google.com/uc?export=download&id=${fileId}`
      };
    }

    // Generic link if not explicitly drive
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return {
        isValid: true,
        fileId: null,
        isFolder: false,
        viewUrl: trimmed,
        thumbnailUrl: null,
        downloadUrl: trimmed
      };
    }

    return null;
  }
}

// Global Singleton Instance
window.SmartGovMedia = new SmartGovMediaManager();
