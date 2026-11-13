from datetime import datetime
import json
import uuid

from app import db


class UserMilestone(db.Model):
    """Mốc kiểm tra Pass (STT 16)."""
    __tablename__ = 'user_milestones'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    milestone = db.Column(db.Integer, nullable=False)  # 50, 100, 150...
    reached_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    test_available_at = db.Column(db.DateTime, nullable=False)
    tested_at = db.Column(db.DateTime, nullable=True)
    score = db.Column(db.Integer, nullable=True)

    # Làm bài dở dang (STT 16): đồng hồ 15 phút do SERVER đo, xem app/utils/pass_timer.py
    started_at = db.Column(db.DateTime, nullable=True)                 # lần đầu mở bài
    time_spent_seconds = db.Column(db.Integer, nullable=False, default=0, server_default='0')   # thời gian đã dùng ở các phiên đã đóng
    session_started_at = db.Column(db.DateTime, nullable=True)         # phiên đang mở (NULL = không có)
    last_activity_at = db.Column(db.DateTime, nullable=True)
    saved_answers = db.Column(db.Text, nullable=True)                  # JSON {question_id: chỉ_số}

    __table_args__ = (
        db.UniqueConstraint('user_id', 'milestone', name='uq_user_milestone'),
    )

    def timer_state(self):
        return {'time_spent': self.time_spent_seconds or 0, 'session_started_at': self.session_started_at,
                'last_activity_at': self.last_activity_at, 'started_at': self.started_at}

    def apply_timer_state(self, state):
        self.time_spent_seconds = state['time_spent']
        self.session_started_at = state['session_started_at']
        self.last_activity_at = state['last_activity_at']
        self.started_at = state['started_at']

    def answers(self):
        try:
            data = json.loads(self.saved_answers or '{}')
        except ValueError:
            return {}
        return data if isinstance(data, dict) else {}

    def to_dict(self):
        from app.utils.pass_timer import displayed_elapsed, remaining_seconds
        in_progress = self.tested_at is None and self.started_at is not None
        return {
            'id': str(self.id),
            'milestone': self.milestone,
            'reached_at': self.reached_at.isoformat() if self.reached_at else None,
            'test_available_at': self.test_available_at.isoformat() if self.test_available_at else None,
            'tested_at': self.tested_at.isoformat() if self.tested_at else None,
            'score': self.score,
            'is_tested': self.tested_at is not None,
            'in_progress': in_progress,                       # đã mở bài nhưng chưa nộp: có thể "Tiếp tục"
            'remaining_seconds': remaining_seconds(displayed_elapsed(self.timer_state())) if in_progress else None,
            'is_available': datetime.utcnow() >= self.test_available_at if self.test_available_at else False,
        }
