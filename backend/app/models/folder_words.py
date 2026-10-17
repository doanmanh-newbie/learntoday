from app import db
import uuid

class FolderWord(db.Model):
    __tablename__ = 'folder_words'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    folder_id = db.Column(db.String(36), db.ForeignKey('folders.id'), nullable=False)
    word_id = db.Column(db.String(36), db.ForeignKey('words.id'), nullable=False)
    order_index = db.Column(db.Integer, default=0)
    note = db.Column(db.Text)

    __table_args__ = (
        db.UniqueConstraint('folder_id', 'word_id', name='uq_folder_word'),
        db.Index('idx_folder_words_folder_order', 'folder_id', 'order_index'),
        db.Index('idx_folder_words_word', 'word_id'),
    )
