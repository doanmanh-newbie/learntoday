# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'options': '-c statement_cache_size=0'
        }
    }

    # JWT
    JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-key')
    JWT_ALGORITHM = 'HS256'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 giờ
    JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 ngày