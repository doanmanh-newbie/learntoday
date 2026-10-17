from app import db
import uuid

class Word(db.Model):
    __tablename__ = 'words'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    word = db.Column(db.String(100), nullable=False)
    pronunciation = db.Column(db.String(100))
    word_type = db.Column(db.String(30))
    meaning = db.Column(db.Text, nullable=False)          # nghĩa TIẾNG VIỆT (hiển thị cho người học)
    meaning_en = db.Column(db.Text)                       # định nghĩa tiếng Anh gốc (từ Dictionary API)
    example = db.Column(db.Text)
    example_meaning = db.Column(db.Text)
    difficulty = db.Column(db.Integer, default=1)
    category = db.Column(db.String(50))
    audio_url = db.Column(db.String(255))
    deleted_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (
        db.Index('idx_words_word', 'word'),
        db.Index('idx_words_category', 'category'),
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'word': self.word,
            'pronunciation': self.pronunciation,
            'word_type': self.word_type,
            'meaning': self.meaning,
            'meaning_en': self.meaning_en,
            'example': self.example,
            'example_meaning': self.example_meaning,
            'difficulty': self.difficulty,
            'category': self.category,
            'audio_url': self.audio_url,
        }