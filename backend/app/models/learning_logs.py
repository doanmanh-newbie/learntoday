# app/models/learning_logs.py
from app import db
from datetime import datetime
from zoneinfo import ZoneInfo
import uuid
import pytz

VN_TZ = pytz.timezone('Asia/Ho_Chi_Minh')
UTC_TZ = pytz.UTC


class LearningLog(db.Model):
    __tablename__ = 'learning_logs'

    # ===== KHÓA CHÍNH =====
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # ===== KHÓA NGOẠI =====
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    word_id = db.Column(db.String(36), db.ForeignKey('words.id'), nullable=False)

    # ===== THÔNG TIN LOG =====
    action = db.Column(db.String(20), nullable=False)   # 'learn' | 'review'
    choice = db.Column(db.String(20), nullable=True)    # 'hoan_thanh' | 'quay_ve_lv1' | 'lui_1_lv' | 'bo_qua'
    level_before = db.Column(db.Integer, nullable=True)
    level_after = db.Column(db.Integer, nullable=True)
    
    # ✅ THÊM CỘT MỚI - Lưu số lần sai trong buổi học/ôn tập
    wrong_count = db.Column(db.Integer, default=0, nullable=True)

    # ===== TIMESTAMPS =====
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # ===== INDEX =====
    __table_args__ = (
        db.Index('idx_learning_logs_user_word', 'user_id', 'word_id'),
        db.Index('idx_learning_logs_user_created', 'user_id', 'created_at'),
    )

    # ===== PHƯƠNG THỨC =====
    def to_dict(self):
        """Chuyển đổi thành dictionary để trả về API"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'word_id': str(self.word_id),
            'action': self.action,
            'choice': self.choice,
            'level_before': self.level_before,
            'level_after': self.level_after,
            'wrong_count': self.wrong_count,  # ✅ THÊM
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def count_learned_today(cls, user_id):
        """
        Đếm số từ đã học mới (action='learn') trong ngày hôm nay - dùng cho STT 6.
        Mốc "hôm nay" tính theo giờ Việt Nam (UTC+7).
        """
        now_vn = datetime.now(VN_TZ)
        start_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0)
        today_start_utc = start_vn.astimezone(UTC_TZ).replace(tzinfo=None)

        return cls.query.filter(
            cls.user_id == user_id,
            cls.action == 'learn',
            cls.created_at >= today_start_utc
        ).count()

    def __repr__(self):
        return f'<LearningLog user_id={self.user_id} word_id={self.word_id} action={self.action}>'