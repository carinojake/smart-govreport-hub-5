/**
 * 🏛️ MODULE 10: SERVER & CLOUD SYNC HUB
 * ซิงค์ 3 มิติ: IndexedDB (Client) ↔ FastAPI/PostgreSQL (Server) ↔ Google Drive/Sheets (Cloud 0 บาท)
 */

export class SyncHub {
  constructor(apiBaseUrl = 'http://127.0.0.1:8086') {
    this.apiBaseUrl = apiBaseUrl;
    this.gasWebhookUrl = '';
  }

  setGasWebhook(url) {
    this.gasWebhookUrl = url;
    localStorage.setItem('smartgov_gas_url_v25', url);
  }

  getGasWebhook() {
    return this.gasWebhookUrl || localStorage.getItem('smartgov_gas_url_v25') || '';
  }

  async checkServerDatabaseHealth() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/health`, { method: 'GET' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }
    return { status: 'offline', database: 'local_indexeddb' };
  }

  async uploadAttachmentToGoogleDrive(base64Data, filename, mimeType) {
    const url = this.getGasWebhook();
    if (!url) {
      throw new Error('กรุณาระบุ Google Apps Script Web App URL ก่อนอัปโหลดขึ้น Drive');
    }

    const payload = {
      action: 'upload_attachment',
      filename,
      mimeType,
      base64_data: base64Data.split(',')[1] || base64Data
    };

    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    return await res.json();
  }

  downloadJSONSnapshot(payload, filename) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

export const syncHub = new SyncHub();
