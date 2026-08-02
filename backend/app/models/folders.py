from app import db
import uuid

class Folder(db.Model):
    __tablename__ = 'folders'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), default='system')
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=True)
    icon = db.Column(db.String(50))
    description = db.Column(db.Text)
    word_count = db.Column(db.Integer, default=0)
    is_default = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'type': self.type,
            'word_count': self.word_count,
            'icon': self.icon,
            'description': self.description
        }