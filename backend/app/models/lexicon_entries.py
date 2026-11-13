# app/models/lexicon_entries.py - từ điển Anh-Việt tích hợp (nhập từ file .mobi bằng scripts/import_dict.py)
import json

from sqlalchemy import false

from app import db


class LexiconEntry(db.Model):
    """Một mục từ của từ điển offline. Khác `dictionary_entries` (bộ nhớ đệm các từ đã tra từ dịch vụ ngoài):
    bảng này là kho CHÍNH, chỉ đọc khi chạy app, nạp một lần bằng scripts/import_dict.py."""
    __tablename__ = 'lexicon_entries'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    word = db.Column(db.String(60), nullable=False)                 # chữ thường
    ipa = db.Column(db.String(120))                                 # phiên âm gốc của file (kiểu cũ, vd /gou/)
    pos_list = db.Column(db.String(120), nullable=False, default='', server_default='')   # noun,verb,...
    main_meaning = db.Column(db.Text)                               # nghĩa ngắn cho flashcard
    example_en = db.Column(db.Text)
    example_vi = db.Column(db.Text)
    see_also = db.Column(db.String(60))                             # "xem go": trỏ sang từ gốc
    has_domain = db.Column(db.Boolean, nullable=False, default=False, server_default=false())
    weight = db.Column(db.Integer, nullable=False, default=0, server_default='0')   # độ "phổ biến" ước lượng (số nghĩa + ví dụ)
    freq_rank = db.Column(db.Integer)                                  # thứ hạng tần suất (nếu nhập kèm danh sách --freq)
    data = db.Column(db.Text, nullable=False)                       # JSON: senses / idioms / domains

    __table_args__ = (
        db.Index('ix_lexicon_entries_word', 'word', unique=True),
        db.Index('ix_lexicon_entries_weight', 'weight'),
    )

    def as_record(self):
        """Dạng dict mà app.services.dict_import.to_api_entry() nhận."""
        return {
            'word': self.word, 'ipa': self.ipa, 'pos_list': self.pos_list, 'main_meaning': self.main_meaning,
            'see_also': self.see_also, 'has_domain': self.has_domain, 'data': self.data,
        }

    def payload(self):
        return json.loads(self.data)
