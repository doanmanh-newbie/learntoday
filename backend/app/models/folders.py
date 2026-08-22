from app import db
import uuid

class Folder(db.Model):
    __tablename__ = 'folder'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)
    level = db.Column(db.String(10), default='A1')
    daily_goal = db.Column(db.Integer, default=10)
    review_limit = db.Column(db.Integer, default=10)
    email_reminder = db.Column(db.Boolean, default=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    # STT 13/14: giờ nhận email nhắc nhở, ví dụ '20:00:00'. Bị thiếu ở bản trước, bổ sung lại.
    reminder_time = db.Column(db.Time, nullable=True)

    streak = db.Column(db.Integer, default=0)
    total_words_learned = db.Column(db.Integer, default=0)
    total_study_minutes = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'level': self.level,
            'streak': self.streak,
            'role': self.role,
            'daily_goal': self.daily_goal,
            'review_limit': self.review_limit,
            'email_reminder': self.email_reminder,
            'reminder_time': self.reminder_time.isoformat() if self.reminder_time else None,
            'total_words_learned': self.total_words_learned,
            'total_study_minutes': self.total_study_minutes
        }