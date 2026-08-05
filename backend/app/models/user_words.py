# app/models/user_words.py
from app import db
from datetime import datetime
import uuid

class UserWord(db.Model):
    __tablename__ = 'user_words'

    # ===== KHÓA CHÍNH =====
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # ===== KHÓA NGOẠI =====
    # Lưu ý: KHÔNG dùng ondelete='CASCADE' cho word_id, đúng chính sách đã
    # thống nhất trong DBML v1.1 (words chỉ soft-delete, không hard-delete)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    word_id = db.Column(db.String(36), db.ForeignKey('words.id'), nullable=False)

    # ===== SRS (STT 8) =====
    level = db.Column(db.Integer, default=0, nullable=False)  # 0: Chưa học, 1-6: SRS Levels
    next_review = db.Column(db.DateTime, nullable=True)      # Thời điểm cần ôn tập

    # ===== THỐNG KÊ =====
    review_count = db.Column(db.Integer, default=0, nullable=False)
    correct_count = db.Column(db.Integer, default=0, nullable=False)
    wrong_count = db.Column(db.Integer, default=0, nullable=False)
    last_reviewed = db.Column(db.DateTime, nullable=True)

    # Lưu ý: KHÔNG lưu is_mastered / is_learning làm cột riêng - đây là dữ liệu
    # suy ra được từ "level" (đã quyết định bỏ khi review DBML v1.1), tránh
    # rủi ro cột và level lệch nhau. Xem phương thức is_mastered()/is_learning()
    # bên dưới để tính trực tiếp từ level khi cần.

    # ===== TIMESTAMPS =====
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # ===== RÀNG BUỘC DUY NHẤT + INDEX =====
    __table_args__ = (
        db.UniqueConstraint('user_id', 'word_id', name='uq_user_word'),
        db.Index('idx_user_words_next_review', 'user_id', 'next_review'),
    )

    # ===== PHƯƠNG THỨC =====

    def to_dict(self):
        """Chuyển đổi thành dictionary để trả về API"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'word_id': str(self.word_id),
            'level': self.level,
            'next_review': self.next_review.isoformat() if self.next_review else None,
            'review_count': self.review_count,
            'correct_count': self.correct_count,
            'wrong_count': self.wrong_count,
            'last_reviewed': self.last_reviewed.isoformat() if self.last_reviewed else None,
            'is_mastered': self.is_mastered(),
            'is_learning': self.is_learning(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def is_mastered(self):
        """Đã thành thạo (level >= 6) - tính trực tiếp từ level, không lưu riêng"""
        return self.level >= 6

    def is_learning(self):
        """Đang trong quá trình học (1 <= level < 6) - tính trực tiếp từ level"""
        return 1 <= self.level < 6

    @classmethod
    def get_by_user_and_word(cls, user_id, word_id):
        """Lấy bản ghi UserWord theo user_id và word_id"""
        return cls.query.filter_by(user_id=user_id, word_id=word_id).first()

    @classmethod
    def get_words_by_level(cls, user_id, level):
        """Lấy danh sách từ của user theo level cụ thể (level >= 1, đã có bản ghi)"""
        return cls.query.filter_by(user_id=user_id, level=level).all()

    @classmethod
    def get_due_reviews(cls, user_id, limit=None):
        """
        Lấy danh sách từ cần ôn tập (next_review <= now)
        Dùng cho STT 5 - Ôn tập SRS
        """
        query = cls.query.filter(
            cls.user_id == user_id,
            cls.level > 0,
            cls.next_review <= datetime.utcnow()
        ).order_by(cls.next_review.asc())

        if limit:
            query = query.limit(limit)

        return query.all()

    @classmethod
    def get_words_for_learning(cls, user_id, folder_id, limit=None):
        """
        Lấy danh sách từ CHƯA HỌC trong 1 folder, dùng cho STT 6 - Học từ mới.

        Quy ước thống nhất trong toàn dự án: "chưa học" nghĩa là KHÔNG có bản
        ghi nào trong user_words cho cặp (user, word) đó - vì theo STT 6, hệ
        thống chỉ tạo dòng user_words SAU KHI user học xong 1 từ (gán level=1),
        không tạo sẵn dòng level=0 cho từ chưa động tới.
        """
        from .folder_words import FolderWord
        from .words import Word

        query = db.session.query(Word).join(
            FolderWord, FolderWord.word_id == Word.id
        ).outerjoin(
            cls, db.and_(cls.word_id == Word.id, cls.user_id == user_id)
        ).filter(
            FolderWord.folder_id == folder_id,
            Word.deleted_at == None,
            cls.id == None  # chưa có bản ghi user_words nào -> chưa học
        )

        if limit:
            query = query.limit(limit)

        return query.all()

    def __repr__(self):
        return f'<UserWord user_id={self.user_id} word_id={self.word_id} level={self.level}>'