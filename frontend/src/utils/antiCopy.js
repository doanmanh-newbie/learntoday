// Chặn sao chép nội dung bài kiểm tra Pass (bôi đen, Ctrl+C, chuột phải, kéo thả, in).
// LƯU Ý: đây chỉ là rào cản cho người dùng thông thường. Người rành kỹ thuật vẫn chép được (DevTools, chụp màn hình...);
// phần đáp án thì đã chấm ở server nên không lộ ra client.

/** Phím tắt cần chặn: Ctrl/Cmd + C, X, A, U (xem nguồn), S (lưu), P (in). */
export function isCopyShortcut(e) {
  if (!(e.ctrlKey || e.metaKey)) return false;
  return ['c', 'x', 'a', 'u', 's', 'p'].includes(String(e.key || '').toLowerCase());
}

const stop = (e) => e.preventDefault();

/** Spread vào phần tử cần bảo vệ: <form {...noCopyProps}> */
export const noCopyProps = {
  className: 'no-copy',
  onCopy: stop,
  onCut: stop,
  onContextMenu: stop,
  onDragStart: stop,
  onKeyDown: (e) => { if (isCopyShortcut(e)) e.preventDefault(); },
};

export const NO_COPY_CSS = `
.no-copy, .no-copy * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
.no-copy input, .no-copy textarea { -webkit-user-select: text; user-select: text; }
@media print { .no-copy { display: none !important; } }
`;
