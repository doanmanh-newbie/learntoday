# Bảo mật & triển khai (đợt 1)

## Đã thay đổi gì và vì sao

| Vấn đề trước đây | Cách xử lý bây giờ |
|---|---|
| `GET /api/pass-test/<id>` trả luôn `correct_index` + `explanation` | Server chỉ gửi đề (câu hỏi + lựa chọn). Đáp án và giải thích chỉ có trong kết quả **sau khi nộp**. Chấm điểm ở server (`pass_test_logic.py`), ghi điểm có điều kiện nên 2 request nộp cùng lúc chỉ 1 request được tính. |
| Access/Refresh Token nằm trong `localStorage` (XSS đọc được, refresh token sống 7 ngày) | Refresh Token nằm trong **cookie HttpOnly** (`Path=/api/auth`). Access Token (1 giờ) chỉ ở **bộ nhớ**. `localStorage` chỉ còn cờ `has_session`. Token kiểu cũ còn sót bị xóa khi tải trang. |
| Đăng nhập không giới hạn số lần thử | Sai quá **8 lần / 15 phút** cho mỗi (IP + email) hoặc **40 lần** cho mỗi IP thì trả 429 + `Retry-After`. Chỉ lần sai bị tính; đăng nhập đúng xóa bộ đếm của (IP + email) đó. Đăng ký 10/giờ/IP, quên mật khẩu 5/giờ/IP và 3/giờ/email, đặt lại mật khẩu 10/giờ/IP. |
| `JWT_SECRET` mặc định chỉ cảnh báo | Với `APP_ENV=production` app **không khởi động** nếu `JWT_SECRET` < 32 ký tự hoặc là giá trị mặc định, `SECRET_KEY` mặc định, `EXPOSE_ERRORS=1`, hoặc cookie không `Secure`. |
| Quên mật khẩu: không có email, không có trang, token dùng lại được | Email SMTP chứa link `/reset-password#token=…` (token sau dấu `#` nên không vào log/referrer). Token hết hạn sau 15 phút và **dùng được một lần** (gắn "dấu vân tay" mật khẩu hiện tại). Có trang **Quên mật khẩu** và **Đặt mật khẩu mới**. Đổi mật khẩu xong thì đăng xuất mọi thiết bị. Phản hồi luôn như nhau dù email có tồn tại hay không; email được gửi ở luồng nền nên thời gian phản hồi không lộ gì. |
| `/api/study/heartbeat` tin số phút do client gửi | Server tự đo: mỗi lần gọi cộng tối đa **1 phút**, và chỉ khi đã qua ≥ 50 giây kể từ lần cộng trước (`users.last_heartbeat_at`). Giá trị `minutes` bị bỏ qua. |

Dọn dẹp cùng đợt: xóa `frontend/src/src/` (bản sao cũ của cả dự án), các file chết (`StatCards`, `UserResults`, `Stats`, `TopicCards`, `AppHome`, `ComingSoon`), `tailwind.config.js` (Tailwind v4 không dùng), `backend-structure.txt` (1,1 MB), các file `data/crawled/*#U*.json` trùng hệt bản có tên đúng; trang Thống kê không còn dữ liệu mẫu giả (có trạng thái đang tải/lỗi thật); thay `alert()`/`console.log` thừa trong màn học.

## Phải làm khi nâng cấp
1. `flask db upgrade` (thêm cột `users.last_heartbeat_at`; cùng với `lexicon_entries` nếu chưa chạy).
2. **Mọi người dùng phải đăng nhập lại một lần** (token cũ trong `localStorage` không còn được dùng).
3. Frontend giờ **mặc định gọi API cùng địa chỉ trang web** (đường dẫn `/api/...`). `npm run dev` đã có proxy trong `vite.config.js`. Khi triển khai thật: hoặc cho web server chuyển tiếp `/api` tới backend (khuyên dùng), hoặc đặt `VITE_API_URL=https://api.ten-mien-cua-ban.com` lúc build.

## Điều kiện để cookie đăng nhập hoạt động
* **HTTPS** khi chạy thật (cookie `Secure`).
* Frontend và API phải **cùng "site"**: cùng tên miền, hoặc `app.example.com` + `api.example.com` (đặt `REFRESH_COOKIE_DOMAIN=.example.com`). Khác site hoàn toàn (vd `xxx.vercel.app` + `yyy.onrender.com`) thì cần `REFRESH_COOKIE_SAMESITE=None`, và nhiều trình duyệt chặn cookie bên thứ ba nên người dùng có thể bị yêu cầu đăng nhập lại mỗi lần tải trang. Cách chắc ăn nhất là để web server chuyển tiếp `/api`.
* `TRUSTED_PROXIES` = số proxy đứng trước app (thường 1). Đặt sai thì giới hạn đăng nhập sẽ tính theo IP của proxy.
* Chống CSRF: các request dùng cookie (`refresh-token`, `logout`) bắt buộc header `X-Requested-With: fetch`; `SameSite=Lax` là lớp thứ hai.

## Email quên mật khẩu
Cần `SMTP_HOST/SMTP_USER/SMTP_PASS` (như email nhắc học) và `FRONTEND_URL`. Chưa cấu hình SMTP thì app vẫn chạy, chỉ ghi cảnh báo vào log và người dùng không nhận được email. Khi phát triển (`EXPOSE_ERRORS=1` hoặc debug) JSON vẫn trả `reset_token` để thử cục bộ.

## Chưa làm / giới hạn đã biết
* Bộ đếm giới hạn nằm trong bộ nhớ từng process: chạy nhiều worker gunicorn thì mỗi worker đếm riêng (giới hạn thực tế lớn hơn). Cần giới hạn chính xác thì chuyển sang Redis.
* Chưa có header bảo mật cho trang web (Content-Security-Policy, HSTS...), chưa có xác thực 2 bước, chưa khóa tài khoản theo thiết bị.
* Chưa xoay vòng Refresh Token mỗi lần làm mới (tránh đăng xuất oan khi mở nhiều tab). Đăng xuất và đổi mật khẩu thu hồi token ngay.
* Heartbeat chỉ chặn việc *gọi API để giả thời gian*; tab mở nhưng không học vẫn được tính (cần tín hiệu hoạt động thật từ giao diện).
* Bài Pass: đồng hồ 15 phút và lưu tiến độ do server đo (xem `docs/NOI_DUNG.md`). Người dùng vẫn có thể "tạm dừng" đồng hồ bằng cách thoát ra rồi mở lại (đúng yêu cầu STT 16) và tra cứu trong lúc vắng mặt; đây là bài tự kiểm tra, không phải kỳ thi giám sát.
