// Bộ nhớ đệm "hiện ngay, cập nhật sau" (stale-while-revalidate) cho các GET ít đổi (danh sách folder...).
// Server ở xa (Supabase + tunnel) nên mỗi lần vào trang phải chờ 1-3 giây; với cache, lần vào thứ 2 trở đi hiện ngay
// dữ liệu đã có rồi mới làm tươi ở nền.
const store = new Map();   // key -> { value, at }

export const peek = (key) => store.get(key)?.value;
export const setCached = (key, value) => store.set(key, { value, at: Date.now() });
export const invalidate = (prefix = '') => { for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k); };

/**
 * Trả dữ liệu cũ (nếu có) qua `onData` ngay lập tức, rồi gọi `fetcher` lấy dữ liệu mới và gọi `onData` lần nữa.
 * Trả Promise của lần lấy mới (lỗi mạng chỉ ném ra khi KHÔNG có dữ liệu cũ để hiển thị).
 */
export async function swr(key, fetcher, onData) {
  const cached = store.get(key);
  if (cached) onData(cached.value, true);
  try {
    const fresh = await fetcher();
    setCached(key, fresh);
    onData(fresh, false);
    return fresh;
  } catch (err) {
    if (cached) return cached.value;
    throw err;
  }
}
