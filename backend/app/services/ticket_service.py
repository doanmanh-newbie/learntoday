# app/services/ticket_service.py - "VÉ PHIÊN HỌC" (chống gian lận mức 2; xem docs/SRS.md > Chống gian lận)
"""
Trước đây server tin client hoàn toàn: gọi complete-learn cho 3000 từ trong vòng lặp là có 30.000 điểm xếp hạng.

Cách làm (vẫn chạy được khi mất mạng, vì server không phải chấm từng đáp án):
  1. Khi client xin từ mới / từ đến hạn (kèm ?ticket=1), server ghi lại "đã giao các từ X, Y, Z lúc T" và trả về mã vé.
  2. complete-learn / complete-review phải kèm vé: từ phải nằm trong vé, vé chưa quá TICKET_TTL, và đã trôi qua đủ thời gian
     tối thiểu: lần hoàn thành thứ k của vé phải cách lúc giao ít nhất k * MIN_SECONDS_PER_WORD giây.
     Chỉ cần cận DƯỚI nên gửi bù sau khi offline vẫn hợp lệ (thời gian chỉ tăng lên).
Giới hạn: người tự gõ đủ chậm mà không học thật thì không chặn được (cần chấm từng bước ở server, mất tính offline).
Điểm xếp hạng còn có trần theo ngày (utils/leaderboard.py).
"""
import json
from datetime import datetime, timedelta

from flask import current_app

from app import db
from app.models import StudyTicket
from app.services.study_service import ServiceError

TICKET_TTL = timedelta(hours=24)
MIN_SECONDS_PER_WORD = 5        # 4 bước (chính tả + 3 dạng) không thể xong dưới ~5 giây/từ
MAX_LIVE_TICKETS = 40           # mỗi người giữ tối đa chừng này vé gần nhất (tải lại trang mỗi lần sinh 1 vé)
DUE_GRACE = timedelta(seconds=60)   # sai lệch đồng hồ khi kiểm tra "đã đến hạn ôn"


def ticket_required():
    return bool(current_app.config.get('STUDY_TICKET_REQUIRED', False))


def issue_ticket(user_id, kind, word_ids, now=None):
    """Ghi lại việc giao từ và trả mã vé. Dọn vé hết hạn/quá nhiều của chính người dùng này."""
    now = now or datetime.utcnow()
    ticket = StudyTicket(user_id=user_id, kind=kind, word_ids=json.dumps([str(w) for w in word_ids]),
                         done_ids='[]', issued_at=now)
    db.session.add(ticket)
    db.session.flush()
    old = (StudyTicket.query.filter(StudyTicket.user_id == user_id)
           .order_by(StudyTicket.issued_at.desc()).offset(MAX_LIVE_TICKETS).all())
    stale = StudyTicket.query.filter(StudyTicket.user_id == user_id, StudyTicket.issued_at < now - TICKET_TTL - TICKET_TTL).all()
    for t in {t.id: t for t in old + stale}.values():
        db.session.delete(t)
    db.session.commit()
    return ticket.id


def verify(user_id, kind, ticket_id, word_id, counted, now=None):
    """Kiểm tra vé cho 1 lần hoàn thành. Trả về vé (để `consume`) hoặc None khi không bắt buộc vé.

    counted=False cho lượt "bỏ qua" (không tính điểm, không cần đợi đủ thời gian).
    """
    if not ticket_required():
        return None
    if not ticket_id or not isinstance(ticket_id, str):
        raise ServiceError('Thiếu mã phiên học. Hãy tải lại trang rồi học tiếp.', 400)
    now = now or datetime.utcnow()
    ticket = db.session.get(StudyTicket, ticket_id)
    if not ticket or ticket.user_id != user_id or ticket.kind != kind:
        raise ServiceError('Mã phiên học không hợp lệ.', 403)
    if now - ticket.issued_at > TICKET_TTL:
        raise ServiceError('Phiên học đã quá 24 giờ. Hãy tải lại trang để lấy phiên mới.', 403)
    if str(word_id) not in ticket.words():
        raise ServiceError('Từ này không nằm trong phiên học của bạn.', 403)
    if counted:
        needed = (len(ticket.done()) + 1) * MIN_SECONDS_PER_WORD
        elapsed = (now - ticket.issued_at).total_seconds()
        if elapsed < needed:
            raise ServiceError(f'Bạn hoàn thành quá nhanh, hãy học kỹ hơn (thử lại sau {int(needed - elapsed) + 1} giây).', 429)
    return ticket


def consume(ticket, word_id):
    """Đánh dấu từ đã hoàn thành bằng vé này. Gọi TRƯỚC db.session.commit() của thao tác chính."""
    if ticket is None:
        return
    done = ticket.done()
    if str(word_id) not in done:
        done.append(str(word_id))
        ticket.done_ids = json.dumps(done)
