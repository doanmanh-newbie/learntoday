// Ảnh người dùng chọn cho từ vựng. Trước đây lưu base64 (tới 5 MB/ảnh) vào localStorage: giới hạn chỉ ~5 MB cho TOÀN BỘ
// trang, nên vài ảnh là đầy, và hàng đợi tiến độ học (api/outbox.js, cũng ở localStorage) ghi hỏng theo.
// Nay: thu nhỏ ảnh rồi lưu trong IndexedDB (dung lượng lớn hơn nhiều). Không có IndexedDB thì giữ tạm trong bộ nhớ.

const DB_NAME = 'learntoday';
const STORE = 'word_images';
const LEGACY_KEY = 'word_images';
export const MAX_SIDE = 800;           // cạnh dài tối đa sau khi thu nhỏ (px)
export const JPEG_QUALITY = 0.82;

const memory = new Map();              // dự phòng khi IndexedDB bị chặn (chế độ riêng tư...)
let dbPromise = null;

/** Kích thước mới giữ nguyên tỉ lệ, cạnh dài không vượt `max`; ảnh nhỏ hơn thì giữ nguyên. */
export function fitSize(width, height, max = MAX_SIDE) {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') { resolve(null); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbPromise;
}

function run(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

/** Đưa ảnh cũ (base64 trong localStorage) sang IndexedDB một lần, rồi xóa khỏi localStorage để giải phóng chỗ. */
async function migrateLegacy(db) {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const old = JSON.parse(raw) || {};
    for (const [id, dataUrl] of Object.entries(old)) if (typeof dataUrl === 'string') await run(db, 'readwrite', (s) => s.put(dataUrl, String(id)));
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* JSON hỏng hoặc ghi lỗi: giữ nguyên bản cũ, lần sau thử lại */ }
}

export async function getWordImage(wordId) {
  const key = String(wordId);
  const db = await openDb();
  if (!db) return memory.get(key) || null;
  try {
    await migrateLegacy(db);
    return (await run(db, 'readonly', (s) => s.get(key))) || null;
  } catch { return memory.get(key) || null; }
}

export async function setWordImage(wordId, dataUrl) {
  const key = String(wordId);
  memory.set(key, dataUrl);
  const db = await openDb();
  if (!db) return;
  try { await run(db, 'readwrite', (s) => s.put(dataUrl, key)); } catch { /* vẫn còn bản trong bộ nhớ */ }
}

/** Đọc file ảnh, thu nhỏ bằng canvas, trả data URL JPEG (thường < 150 KB thay vì vài MB). */
export async function shrinkImageFile(file, max = MAX_SIDE, quality = JPEG_QUALITY) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Không đọc được ảnh'));
      el.src = url;
    });
    const { width, height } = fitSize(img.naturalWidth, img.naturalHeight, max);
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';                     // PNG trong suốt -> nền trắng khi chuyển sang JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally { URL.revokeObjectURL(url); }
}
