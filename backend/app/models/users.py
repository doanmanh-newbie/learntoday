from app import db
import uuid

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    level = db.Column(db.String(10), default='A1')
    daily_goal = db.Column(db.Integer, default=10)
    review_limit = db.Column(db.Integer, default=10)
    email_reminder = db.Column(db.Boolean, default=True)

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
            'streak': self.streak
        }