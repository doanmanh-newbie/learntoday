// Chế độ sáng đảo màu cả trang (index.css) nên emoji cũng bị đảo màu (🔥 thành nâu, 📊 thành ô đen).
// Bọc emoji vào <span class="keep-color"> để đảo lại về màu gốc.
// Chỉ xử lý phần tử có ĐÚNG MỘT nút chữ: React cập nhật loại này bằng textContent (xoá luôn span của ta rồi
// observer bọc lại), không giữ tham chiếu tới nút chữ -> không làm React lỗi khi cập nhật/gỡ phần tử.
// shortcut: emoji nằm cạnh {biến} (React tách nhiều nút chữ, vd "📖 {word}") vẫn bị đảo màu; muốn sửa thì bọc emoji đó trong <span> ở JSX.

const EMOJI = /\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*/gu;
const COLORED = /\p{Emoji_Presentation}|️/u;    // ✔ © ↔... hiển thị như chữ thường, không phải icon màu

/** "🔥 Chuỗi" -> [{ text: '🔥', emoji: true }, { text: ' Chuỗi', emoji: false }]; không có emoji màu -> null */
export function splitEmoji(text) {
  const parts = [];
  let last = 0;
  for (const m of String(text).matchAll(EMOJI)) {
    if (!COLORED.test(m[0])) continue;
    if (m.index > last) parts.push({ text: text.slice(last, m.index), emoji: false });
    parts.push({ text: m[0], emoji: true });
    last = m.index + m[0].length;
  }
  if (!parts.length) return null;
  if (last < text.length) parts.push({ text: text.slice(last), emoji: false });
  return parts;
}

// Đã được đảo lại màu ở tổ tiên (đảo thêm lần nữa sẽ sai) hoặc là ô nhập liệu
const SKIP = '.keep-color, svg, textarea, input, select, option, script, style, [contenteditable], [style*="linear-gradient(135deg, rgb(15, 118, 110)"]';

function wrapElement(el) {
  if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3 || el.closest(SKIP)) return;
  // Nút chữ có fiber riêng = React giữ tham chiếu tới nó (con dạng mảng) -> không được thay
  if (Object.keys(el.firstChild).some((k) => k.startsWith('__reactFiber'))) return;
  const parts = splitEmoji(el.firstChild.nodeValue);
  if (!parts) return;
  const doc = el.ownerDocument;
  el.replaceChildren(...parts.map((p) => {
    if (!p.emoji) return doc.createTextNode(p.text);
    const span = doc.createElement('span');
    span.className = 'keep-color';
    span.textContent = p.text;
    return span;
  }));
}

export function startEmojiIcons(root = globalThis.document?.body) {
  if (!root || typeof MutationObserver === 'undefined') return;
  const pending = new Set();
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    for (const node of pending) {
      if (!node.isConnected) continue;
      wrapElement(node);
      node.querySelectorAll?.('*').forEach(wrapElement);
    }
    pending.clear();
  };
  const queue = (node) => {
    const el = node.nodeType === 3 ? node.parentElement : node;
    if (el?.nodeType !== 1) return;
    pending.add(el);
    if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
  };
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') queue(r.target);
      else r.addedNodes.forEach(queue);
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
  queue(root);
}
