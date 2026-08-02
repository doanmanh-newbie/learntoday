import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
     # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
        
        # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-key')
    JWT_ALGORITHM = 'HS256'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 giờ
    JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 ngày
    JWT_RESET_TOKEN_EXPIRES = 900  # 15 phút
# app/config.py
import os
from dotenv import load_dotenv

