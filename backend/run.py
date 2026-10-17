# run.py
import os

from app import create_app

app = create_app()

if __name__ == '__main__':
    # Mặc định chỉ lắng nghe trên máy bạn (127.0.0.1). Trước đây host='0.0.0.0' + debug=True làm lộ
    # Werkzeug debugger (chạy được mã Python từ xa) ra toàn mạng LAN. Cần truy cập từ điện thoại/máy
    # khác thì đặt FLASK_HOST=0.0.0.0 và TẮT debug (FLASK_DEBUG=0).
    app.run(
        host=os.environ.get('FLASK_HOST', '127.0.0.1'),
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('FLASK_DEBUG', '1') == '1',
    )
