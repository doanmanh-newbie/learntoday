// src/api/tickets.js - "vé phiên học" (xem backend/app/services/ticket_service.py).
// Khi xin từ mới / từ đến hạn, server trả kèm mã vé. Mỗi từ nhớ vé của mình; khi hoàn thành từ (outbox) mã vé đi kèm.
// Mã vé được GHI VÀO mục trong hàng đợi lúc tạo, nên vẫn đúng sau khi tải lại trang hoặc gửi bù lúc có mạng lại.
const MAX_ENTRIES = 500;
const byWord = new Map();      // wordId -> ticket

export function rememberTicket(wordIds, ticket) {
  if (!ticket || !Array.isArray(wordIds)) return;
  for (const id of wordIds) {
    byWord.delete(String(id));                         // đưa xuống cuối để thứ tự cũ-mới đúng
    byWord.set(String(id), ticket);
  }
  while (byWord.size > MAX_ENTRIES) byWord.delete(byWord.keys().next().value);
}

export function ticketFor(wordId) {
  return byWord.get(String(wordId)) || null;
}

export function clearTickets() {
  byWord.clear();
}
