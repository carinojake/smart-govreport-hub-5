/**
 * 🏛️ MODULE 2: INDEXEDDB STORAGE ENGINE
 * สถาปัตยกรรม Local-First รองรับความจุ > 1GB พร้อมระบบ Object Stores อิสระ
 */

const DB_NAME = 'SmartGovReportDB_v25';
const DB_VERSION = 1;

export class StorageEngine {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        const stores = ['profile', 'ojt_weeks', 'evidence_photos', 'signatures', 'gov_docs', 'settings'];
        stores.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        });
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        this.isReady = true;
        console.log('✅ [IndexedDB] Connected to', DB_NAME);
        resolve(this);
      };

      request.onerror = (e) => {
        console.error('❌ [IndexedDB] Error opening database:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  async get(storeName, key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async set(storeName, key, value) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async exportFullSnapshot() {
    const profile = (await this.get('profile', 'main')) || {};
    const signatures = (await this.get('signatures', 'main')) || {};
    const govDocs = (await this.get('gov_docs', 'main')) || {};
    const settings = (await this.get('settings', 'main')) || {};

    const weeks = {};
    for (let w = 1; w <= 5; w++) {
      const wData = await this.get('ojt_weeks', String(w));
      if (wData) weeks[w] = wData;
    }

    return {
      app: "Smart GovReport Hub 2.5",
      version: "2.5.0",
      architecture: "Modular ES Modules + IndexedDB",
      exportedAt: new Date().toISOString(),
      profile,
      ojtWeeklyData: weeks,
      signatures,
      govDocs,
      settings
    };
  }
}

export const storage = new StorageEngine();
