# app/utils/pass_timer.py - đồng hồ 15 phút của bài kiểm tra Pass (STT 16). Thuần Python, không đụng database.
"""
Quy tắc (STT 16): làm bài 15 phút; thoát giữa chừng thì LƯU câu đã trả lời + thời gian còn lại, quay lại làm tiếp.

Server giữ đồng hồ (không tin đồng hồ của trình duyệt):
  * mở bài (GET)      -> bắt đầu một "phiên"; phiên cũ chưa đóng (tắt tab) chỉ được tính tới LẦN HOẠT ĐỘNG CUỐI,
                         nên bị mất mạng/đóng tab không làm mất thời gian oan.
  * lưu tiến độ (PUT) -> cập nhật lần hoạt động cuối + câu trả lời (client gọi mỗi khi chọn đáp án và mỗi ~30 giây).
  * thoát (POST leave)-> đóng phiên: cộng thời gian đã dùng vào time_spent_seconds, đồng hồ DỪNG trong lúc vắng mặt.
  * nộp bài           -> quá giờ (+ GRACE_SECONDS cho độ trễ mạng) thì chỉ chấm các câu ĐÃ LƯU trước đó.
Dùng cho state là dict: time_spent, session_started_at, last_activity_at, started_at.
"""
from datetime import datetime

TIME_LIMIT_SECONDS = 15 * 60
GRACE_SECONDS = 30


def _seconds(start, end):
    return max(0, int((end - start).total_seconds()))


def elapsed_seconds(state, now):
    """Thời gian đã dùng tính đến `now` (gồm phiên đang mở, nếu có)."""
    spent = state.get('time_spent') or 0
    started = state.get('session_started_at')
    return spent + (_seconds(started, now) if started else 0)


def displayed_elapsed(state):
    """Thời gian đã dùng để HIỂN THỊ ở danh sách (không phụ thuộc giờ hiện tại): phiên đang mở chỉ tính tới lần hoạt động cuối."""
    spent = state.get('time_spent') or 0
    started = state.get('session_started_at')
    if started:
        spent += _seconds(started, state.get('last_activity_at') or started)
    return min(spent, TIME_LIMIT_SECONDS)


def remaining_seconds(elapsed):
    return max(0, TIME_LIMIT_SECONDS - elapsed)


def is_overtime(elapsed):
    return elapsed > TIME_LIMIT_SECONDS + GRACE_SECONDS


def start_or_resume(state, now):
    """Mở (hoặc mở lại) bài: đóng phiên cũ chưa đóng (chỉ tính tới lần hoạt động cuối) rồi mở phiên mới. Trả state mới."""
    spent = state.get('time_spent') or 0
    old = state.get('session_started_at')
    if old:
        spent += _seconds(old, state.get('last_activity_at') or old)
    return {
        'time_spent': min(spent, TIME_LIMIT_SECONDS + GRACE_SECONDS),
        'session_started_at': now,
        'last_activity_at': now,
        'started_at': state.get('started_at') or now,
    }


def touch(state, now):
    """Ghi nhận hoạt động (lưu tiến độ). Chỉ có nghĩa khi đang có phiên mở."""
    return {**state, 'last_activity_at': now}


def leave(state, now):
    """Đóng phiên: cộng thời gian đã dùng, đồng hồ dừng cho tới lần mở sau."""
    return {**state, 'time_spent': min(elapsed_seconds(state, now), TIME_LIMIT_SECONDS + GRACE_SECONDS),
            'session_started_at': None, 'last_activity_at': now}


def clean_answers(answers, questions):
    """Chỉ giữ câu trả lời hợp lệ: {question_id: chỉ_số_nguyên trong phạm vi lựa chọn}. Bool/chuỗi/ngoài phạm vi bị bỏ."""
    if not isinstance(answers, dict):
        return {}
    out = {}
    for q in questions:
        picked = answers.get(q['id'])
        if type(picked) is int and 0 <= picked < len(q['options']):
            out[q['id']] = picked
    return out


def answers_for_grading(saved, submitted, overtime):
    """Đáp án dùng để chấm: đúng giờ -> đáp án nộp ghi đè đáp án đã lưu; quá giờ -> chỉ các câu đã lưu trước đó."""
    return dict(saved) if overtime else {**saved, **submitted}
