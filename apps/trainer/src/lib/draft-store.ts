/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/* ================================================================== */
/*  IndexedDB draft persistence for video uploads                      */
/*  Raw IndexedDB wrapper — no external dependencies                  */
/* ================================================================== */

const DB_NAME = "holora_upload_drafts";
const DB_VERSION = 3;
const STORE_NAME = "drafts";

export interface UploadDraft {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  metadata: {
    title: string;
    description: string;
    visibility: string;
    content_type: string;
    difficulty: string;
    sport_tags: string[];
    audio_license: string;
    is_short: boolean;
  };
  thumbnailDataUrl: string | null;
  thumbnailOptions: string[];
  selectedThumbnailIdx: number;
  videoId: string | null;
  uploadProgress: number;
  status: "draft" | "uploading" | "processing" | "completed" | "failed";
  step: number;
  edl: any | null;
  createdAt: number;
  updatedAt: number;
}

let _dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    // Reuse existing connection if open
    if (_dbInstance && _dbInstance.objectStoreNames.contains(STORE_NAME)) {
      try {
        // Test if connection is still alive
        _dbInstance.transaction(STORE_NAME, "readonly");
        resolve(_dbInstance);
        return;
      } catch {
        _dbInstance = null;
      }
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Delete old store and recreate to handle schema changes
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => {
      _dbInstance = request.result;
      _dbInstance.onclose = () => { _dbInstance = null; };
      resolve(_dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

export const draftStore = {
  async save(draft: UploadDraft): Promise<boolean> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put({ ...draft, updatedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  async get(id: string): Promise<UploadDraft | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  async getAll(): Promise<UploadDraft[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => {
          const drafts = (req.result || []) as UploadDraft[];
          resolve(
            drafts
              .filter((d) => d.status !== "completed")
              .sort((a, b) => b.updatedAt - a.updatedAt)
          );
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },
};
