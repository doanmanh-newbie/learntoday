# Dựng lại & kiểm tra database (Supabase)

## 0. Vì sao dữ liệu cũ mất?
Supabase gói **Free tự tạm dừng (pause) project sau ~7 ngày không có hoạt động**. Để lâu hơn thì project
có thể bị xóa hẳn và gói Free **không có backup**. Cách phòng: xem `docs/supabase-keepalive.yml`
(tự ping định kỳ) hoặc nâng cấp gói. Nếu dữ liệu không khôi phục được, làm theo các bước dưới để dựng lại
từ đầu — toàn bộ schema nằm trong `migrations/`, dữ liệu mẫu nằm trong `data/`, nên dựng lại chỉ mất vài phút.

## 1. Lấy thông tin kết nối
Supabase Dashboard → nút **Connect** → **Session pooler** (khuyên dùng; Direct chỉ có IPv6 nên nhiều
mạng ở Việt Nam không kết nối được). Ghi lại: host, port, user (`postgres.<project-ref>`), mật khẩu.
Mật khẩu quên? *Project Settings → Database → Reset database password*.

> Gợi ý: nếu tạo project mới, chọn vùng **Southeast Asia (Singapore)** để giảm độ trễ cho người dùng Việt Nam
> (vùng Mumbai/ap-south-1 xa hơn, mỗi truy vấn chậm hơn đáng kể).

## 2. Điền `backend/.env`
Sao chép `.env.example` → `.env`, điền `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` (mật khẩu để nguyên văn)
và 2 chuỗi bí mật ngẫu nhiên `SECRET_KEY`, `JWT_SECRET`.

## 3. Chẩn đoán kết nối (làm bước này trước tiên)
```bash
cd backend
venv\Scripts\activate            # Windows   (macOS/Linux: source venv/bin/activate)
python scripts/diagnose_db.py
```
Script kiểm tra từng bước: DNS → TCP → đăng nhập → độ trễ → có đủ bảng chưa → migration → số dòng dữ liệu,
và gợi ý cách sửa bằng tiếng Việt cho từng lỗi.

## 4. Tạo bảng + nạp dữ liệu
```bash
flask db upgrade                 # tạo toàn bộ bảng/chỉ mục (8 migration)
python seed.py                   # 6 folder hệ thống + 70 từ (đã có nghĩa tiếng Việt)
python seed.py --admin           # (tùy chọn) cần ADMIN_EMAIL, ADMIN_PASSWORD trong .env
python scripts/diagnose_db.py    # kiểm tra lại: kỳ vọng "Mọi bước đều ổn"
```

## 5. Chạy thử
```bash
python run.py                    # http://127.0.0.1:5000/api/health  -> {"connected": true, ...}
python -m unittest discover -s tests -t .      # 23 test (chạy trên SQLite, không đụng DB thật)
```

## 6. Bảng lỗi thường gặp
| Thông báo | Nguyên nhân | Cách sửa |
|---|---|---|
| `password authentication failed` | sai mật khẩu, hoặc mật khẩu có `%`/`@`/`#` bị đọc sai trong `DATABASE_URL` | dùng `DB_PASSWORD` rời; hoặc reset mật khẩu |
| `Tenant or user not found` | user/host pooler sai vùng | copy lại chuỗi ở nút Connect (user dạng `postgres.<ref>`) |
| `Network is unreachable` / treo lúc kết nối | dùng host Direct (IPv6) | đổi sang host **pooler** |
| `max clients reached` / `MaxClientsInSessionMode` | quá nhiều kết nối tới Session pooler | giữ pool nhỏ (mặc định 3+2), dùng cổng 6543 |
| `SSL connection has been closed unexpectedly` | pooler cắt kết nối rảnh | đã xử lý bằng `pool_pre_ping` + `pool_recycle` |
| API trả `503 DB_UNAVAILABLE` | không kết nối được DB (project pause, mạng) | chạy `diagnose_db.py` |
| `relation "users" does not exist` | chưa chạy migration | `flask db upgrade` |

## 7. Bảo mật — làm ngay
File `.env` cũ (kèm mật khẩu DB và `JWT_SECRET`) đã bị đóng trong file zip gửi đi. Hãy **đổi mật khẩu database**
và **sinh `JWT_SECRET` mới**, đồng thời không bao giờ đưa `.env`/`venv` vào zip hay git.
