const DB_NAME = 'monitoring-eye-playback';
const STORE = 'recordings';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export async function listDownloadedRecordings() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => {
      const rows = (request.result || []).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      );
      resolve(rows);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveDownloadedRecording({ name, blob, source = 'download' }) {
  const db = await openDb();
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name || 'recording',
    type: blob.type || '',
    size: blob.size || 0,
    source,
    createdAt: Date.now(),
    blob,
  };
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  return record;
}

export async function deleteDownloadedRecording(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
