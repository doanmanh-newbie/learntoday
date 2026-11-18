# app/models/study_tickets.py - "vé phiên học": server ghi lại ĐÃ giao những từ nào, lúc nào (xem services/ticket_service.py)
import json
import uuid
from datetime import datetime

from app import db


class StudyTicket(db.Model):
    __tablename__ = 'study_tickets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    kind = db.Column(db.String(10), nullable=False)               # 'learn' | 'review'
    word_ids = db.Column(db.Text, nullable=False)                 # JSON: các từ được giao trong vé này
    done_ids = db.Column(db.Text, nullable=False, default='[]')   # JSON: các từ đã hoàn thành (tính điểm) bằng vé này
    issued_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (db.Index('idx_study_tickets_user_issued', 'user_id', 'issued_at'),)

    def words(self):
        return json.loads(self.word_ids or '[]')

    def done(self):
        return json.loads(self.done_ids or '[]')
