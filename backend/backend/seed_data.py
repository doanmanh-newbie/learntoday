# File này được GỘP vào seed.py (một seeder duy nhất, chạy lại nhiều lần an toàn).
#   python seed.py            -> folder + từ vựng (kèm bản dịch tiếng Việt)
#   python seed.py --admin    -> thêm admin (ADMIN_EMAIL / ADMIN_PASSWORD trong .env)
# Giữ lại tên file cũ để lệnh cũ không bị gãy.
import sys

from seed import main

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
