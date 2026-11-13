# app/services/email_service.py - gửi email qua SMTP (STT 13)
import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


class EmailNotConfigured(Exception):
    """Chưa đặt SMTP_HOST/SMTP_USER/SMTP_PASS trong .env."""


class EmailError(Exception):
    """Gửi thất bại (sai mật khẩu SMTP, mạng, bị từ chối...)."""


def smtp_configured() -> bool:
    return bool(os.environ.get('SMTP_HOST') and os.environ.get('SMTP_USER') and os.environ.get('SMTP_PASS'))


def send_email(to: str, subject: str, body: str) -> None:
    if not smtp_configured():
        raise EmailNotConfigured('Chưa cấu hình SMTP')

    host = os.environ['SMTP_HOST']
    port = int(os.environ.get('SMTP_PORT', 587))
    user, password = os.environ['SMTP_USER'], os.environ['SMTP_PASS']

    msg = EmailMessage()
    msg['From'] = os.environ.get('SMTP_FROM', user)
    msg['To'] = to
    msg['Subject'] = subject
    msg.set_content(body)

    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.starttls()
        with server:
            server.login(user, password)
            server.send_message(msg)
    except (smtplib.SMTPException, OSError) as e:
        logger.error('Gửi email tới %s thất bại: %s', to, e)
        raise EmailError(str(e)) from e
