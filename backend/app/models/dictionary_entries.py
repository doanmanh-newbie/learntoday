# app/models/dictionary_entries.py - KHO TỪ ĐIỂN trong database
import json
import uuid
from datetime import datetime

from app import db


class DictionaryEntry(db.Model):
    """Một từ đã tra cứu: dữ liệu đầy đủ (mọi nghĩa/loại từ + bản dịch tiếng Việt) lưu lại để
    lần sau trả ngay từ database, không gọi lại dịch vụ ngoài (nhanh hơn, không dính giới hạn tốc độ).

    found=False là "cache âm": từ không có trong từ điển, nhớ 24 giờ để khỏi hỏi lại liên tục.
    """
    __tablename__ = 'dictionary_entries'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    word = db.Column(db.String(60), nullable=False, unique=True, index=True)   # chữ thường, đã chuẩn hóa
    found = db.Column(db.Boolean, nullable=False, default=True)
    data = db.Column(db.Text)                       # JSON đã chuẩn hóa (xem lexicon_service.parse_entry)
    source = db.Column(db.String(40), default='dictionaryapi.dev')
    lookups = db.Column(db.Integer, nullable=False, default=0, server_default='0')   # độ phổ biến
    fetched_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def entry(self):
        return json.loads(self.data) if self.data else None
