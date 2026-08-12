from datetime import datetime
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

    __table_args__ = (
        db.UniqueConstraint('user_id', 'milestone', name='uq_user_milestone'),
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'milestone': self.milestone,
            'reached_at': self.reached_at.isoformat() if self.reached_at else None,
            'test_available_at': self.test_available_at.isoformat() if self.test_available_at else None,
            'tested_at': self.tested_at.isoformat() if self.tested_at else None,
            'score': self.score,
            'is_tested': self.tested_at is not None,
            'is_available': datetime.utcnow() >= self.test_available_at if self.test_available_at else False,
        }
