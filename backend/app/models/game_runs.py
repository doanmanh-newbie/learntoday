# app/models/game_runs.py - mỗi ván game từ vựng đã được server chấm điểm (bảng xếp hạng flappy)
import uuid
from datetime import datetime

from app import db


class GameRun(db.Model):
    __tablename__ = 'game_runs'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    game = db.Column(db.String(20), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    answered = db.Column(db.Integer, nullable=False)
    correct = db.Column(db.Integer, nullable=False)
    duration_ms = db.Column(db.Integer, nullable=False)
    folder_id = db.Column(db.String(36), nullable=True)   # null = kho từ đã học
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)  # UTC naive
    __table_args__ = (
        db.Index('idx_game_runs_game_created', 'game', 'created_at'),
        db.Index('idx_game_runs_user_created', 'user_id', 'created_at'),
    )
