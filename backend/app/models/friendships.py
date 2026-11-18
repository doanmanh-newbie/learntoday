# app/models/friendships.py - quan hệ bạn bè cho bảng xếp hạng tuần. Mỗi cặp bạn lưu 2 dòng (A->B, B->A) để truy vấn đơn giản.
import uuid
from datetime import datetime

from app import db


class Friendship(db.Model):
    __tablename__ = 'friendships'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    friend_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'friend_id', name='uq_friendship_pair'),)
