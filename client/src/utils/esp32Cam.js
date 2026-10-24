const DEFAULT_CAM = 'http://192.168.1.77';

const MEDIA_EXT = /\.(jpe?g|png|gif|bmp|webp|mp4|webm|ogg|avi|mjpe?g|mjpg|mov)$/i;

export function cameraBaseUrl() {
  const raw = import.meta.env.VITE_ESP32_CAM_URL || DEFAULT_CAM;
  return String(raw).replace(/\/$/, '');
}

export function cameraPageUrl() {
  return `${cameraBaseUrl()}/`;
}

export function cameraStreamUrl() {
  const base = cameraBaseUrl();
  try {
    const url = new URL(base);
    const streamPort = import.meta.env.VITE_ESP32_CAM_STREAM_PORT || '81';
    return `${url.protocol}//${url.hostname}:${streamPort}/stream`;
  } catch {
    return `${base}:81/stream`;
  }
}

export function cameraHostLabel() {
  try {
    return new URL(cameraBaseUrl()).host;
  } catch {
    return cameraBaseUrl();
  }
}

function isLocalDev() {
  return typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

/** Same-origin proxy in Vite so SD-card listing is not blocked by CORS. */
export function cameraApiUrl(path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (isLocalDev()) return `/esp32-cam${p}`;
  return `${cameraBaseUrl()}${p}`;
}

/** MJPEG stream, proxied on localhost so enrollment captures are not CORS-tainted. */
export function cameraStreamDisplayUrl() {
  if (isLocalDev()) return '/esp32-cam-stream/stream';
  return cameraStreamUrl();
}

export function cameraFileUrl(name) {
  const file = String(name || '').replace(/^\/+/, '');
  return `${cameraBaseUrl()}/${file}`;
}

export function isMediaFileName(name) {
  return MEDIA_EXT.test(String(name || ''));
}

export function recordingKind(name, mime = '') {
  const value = `${name} ${mime}`.toLowerCase();
  if (/\.(jpe?g|png|gif|bmp|webp)\b/.test(value) || mime.startsWith('image/')) return 'image';
  return 'video';
}

function parseListPayload(text, contentType = '') {
  const files = [];
  const seen = new Set();
  const add = (name, size = 0) => {
    const clean = String(name || '').split('?')[0].replace(/^\/+/, '').trim();
    if (!clean || seen.has(clean) || !isMediaFileName(clean)) return;
    seen.add(clean);
    files.push({
      id: `sd:${clean}`,
      name: clean.split('/').pop(),
      path: clean,
      size: Number(size) || 0,
      kind: recordingKind(clean),
      source: 'sd',
      url: cameraFileUrl(clean),
    });
  };

  const trimmed = String(text || '').trim();
  if (!trimmed) return files;

  if (contentType.includes('json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      const rows = Array.isArray(data) ? data : data.files || data.list || data.records || [];
      rows.forEach((row) => {
        if (typeof row === 'string') add(row);
        else add(row.name || row.file || row.path || row.filename, row.size || row.length);
      });
      return files;
    } catch {
      /* fall through to text/html parsing */
    }
  }

  const hrefs = trimmed.matchAll(/href=["']([^"']+)["']/gi);
  for (const match of hrefs) add(decodeURIComponent(match[1]));

  trimmed.split(/\r?\n/).forEach((line) => {
    const [name, size] = line.split(/[:\t,]/);
    if (name) add(name.trim(), size);
  });

  return files;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function snapshotFromElement(el) {
  const width = el.naturalWidth || el.videoWidth || 640;
  const height = el.naturalHeight || el.videoHeight || 480;
  const max = 400;
  const scale = Math.min(1, max / width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext('2d').drawImage(el, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.65);
}

/** Grab a still from the ESP32-CAM `/capture` endpoint, used for face enrollment. */
export async function captureEsp32Still() {
  const urls = [cameraApiUrl(`/capture?_=${Date.now()}`), cameraApiUrl('/capture')];
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, 8000);
      if (!response.ok) continue;
      const type = response.headers.get('content-type') || '';
      if (type.includes('html') || type.includes('text/')) continue;
      const blob = await response.blob();
      if (!blob || blob.size < 400) continue;
      return await blobToDataUrl(blob);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Could not capture a still from the ESP32-CAM.');
}

async function fetchWithTimeout(url, ms = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function listSdRecordings() {
  const paths = ['/list?dir=/', '/list', '/sd', '/sdcard', '/files'];
  const results = await Promise.allSettled(
    paths.map(async (path) => {
      const response = await fetchWithTimeout(cameraApiUrl(path));
      if (!response.ok) throw new Error(String(response.status));
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      const files = parseListPayload(text, contentType);
      if (!files.length) throw new Error('empty');
      return files;
    }),
  );
  const hit = results.find((row) => row.status === 'fulfilled');
  if (hit) return hit.value;
  const failed = results.find((row) => row.status === 'rejected');
  if (failed) throw failed.reason;
  return [];
}

export async function fetchSdRecording(path) {
  const file = String(path || '').replace(/^\/+/, '');
  const urls = [
    cameraApiUrl(`/download?file=${encodeURIComponent(file)}`),
    cameraApiUrl(`/${file}`),
    cameraFileUrl(file),
  ];
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, 15000);
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob && blob.size > 0) return blob;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Could not download ${file} from the SD card.`);
}
