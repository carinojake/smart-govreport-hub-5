/**
 * Smart GovReport Hub V3 - Native IndexedDB Promisified Adapter
 * Zero external dependencies, 100% offline-ready, auto-migrates from LocalStorage
 * Author: ทีมงาน SmartGov 2026 (พี่แจ็ค M1 Architecture)
 */

class SmartGovDBAdapter {
  constructor(dbName = 'SmartGov_OJT_V3', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Generic Key-Value store for drop-in LocalStorage compatibility & configs
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }

        // Activities store
        if (!db.objectStoreNames.contains('activities')) {
          const actStore = db.createObjectStore('activities', { keyPath: 'id' });
          actStore.createIndex('user_id', 'user_id', { unique: false });
          actStore.createIndex('week_number', 'week_number', { unique: false });
          actStore.createIndex('activity_date', 'activity_date', { unique: false });
        }

        // User Profiles
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'user_id' });
        }

        // Attachments & Compressed Images
        if (!db.objectStoreNames.contains('attachments')) {
          const attStore = db.createObjectStore('attachments', { keyPath: 'id' });
          attStore.createIndex('activity_id', 'activity_id', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        try {
          await this.autoMigrateLegacyStorage();
        } catch (e) {
          console.warn('[SmartGovDB] Auto-migration check error:', e);
        }
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[SmartGovDB] Failed to open IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async get(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => reject(req.error);
    });
  }

  async set(storeName, key, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      let req;
      if (store.keyPath) {
        if (typeof value === 'object' && value !== null) {
          if (!value[store.keyPath]) value[store.keyPath] = key;
          req = store.put(value);
        } else {
          req = store.put({ [store.keyPath]: key, data: value });
        }
      } else {
        req = store.put(value, key);
      }
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Key-Value Sugar Methods (Drop-in localStorage replacements)
  async getItem(key) {
    const val = await this.get('keyval', key);
    return val !== null ? val : localStorage.getItem(key);
  }

  async setItem(key, value) {
    await this.set('keyval', key, value);
    // Safe mirror for small strings to localStorage as dual backup
    if (typeof value === 'string' && value.length < 500000) {
      try { localStorage.setItem(key, value); } catch (e) {}
    }
  }

  async removeItem(key) {
    await this.delete('keyval', key);
    try { localStorage.removeItem(key); } catch (e) {}
  }

  // Auto-migration from LocalStorage into IndexedDB
  async autoMigrateLegacyStorage() {
    const migrationFlagKey = '__smartgov_v3_migrated__';
    const alreadyMigrated = await this.get('keyval', migrationFlagKey);
    if (alreadyMigrated) {
      return { status: 'already_migrated' };
    }

    const migratedKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('smartgov_') ||
        key.startsWith('gov_') ||
        key.startsWith('ojt_') ||
        key.startsWith('prof_') ||
        key.startsWith('proj_') ||
        key.startsWith('PDPA_')
      )) {
        const rawVal = localStorage.getItem(key);
        if (rawVal !== null) {
          await this.set('keyval', key, rawVal);
          migratedKeys.push(key);
        }
      }
    }

    await this.set('keyval', migrationFlagKey, {
      migrated_at: new Date().toISOString(),
      count: migratedKeys.length,
      keys: migratedKeys
    });

    console.info(`[SmartGovDB] Auto-migrated ${migratedKeys.length} legacy keys from LocalStorage to IndexedDB.`);
    return { status: 'success', count: migratedKeys.length, keys: migratedKeys };
  }

  async estimateStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        usageMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
        quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
        percentage: estimate.quota ? (((estimate.usage || 0) / estimate.quota) * 100).toFixed(1) : 0
      };
    }
    return { usage: 0, quota: 0, usageMB: 'N/A', quotaMB: 'N/A', percentage: '0' };
  }
}

// Global Singleton Instance
window.SmartGovDB = new SmartGovDBAdapter();
