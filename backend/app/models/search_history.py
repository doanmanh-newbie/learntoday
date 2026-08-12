from datetime import datetime
import uuid

from app import db


class SearchHistory(db.Model):
    __tablename__ = 'search_history'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    query = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': str(self.id),
            'query': self.query,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
