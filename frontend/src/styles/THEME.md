# Giao diện: xám + xanh ngọc (phụ: đỏ, xanh rêu)

Một bộ màu/font dùng chung cho **Trang giới thiệu · Đăng nhập/Đăng ký · Ứng dụng**. Nguồn duy nhất: `styles/theme.css`.
Mở `styles/palette-preview.html` bằng trình duyệt để xem toàn bộ bảng màu và độ tương phản.

| Vai trò | Màu | Dùng cho |
|---|---|---|
| Chủ đạo | **Xám** `bg` `surface` `surface-2/3` `line`, chữ `ink` `ink-muted` `ink-subtle` | nền, thẻ, đường kẻ, chữ |
| Chủ đạo | **Xanh ngọc** `brand-50…900` | nút chính, liên kết, mục đang chọn, tiêu điểm bàn phím |
| Phụ | **Đỏ** `red-*` | lỗi, cảnh báo, nút xóa, chuỗi ngày học (streak), điểm nhấn nhỏ |
| Phụ | **Xanh rêu** `moss-*` | đúng/thành công, đã học/đã thuộc, tiến độ hoàn thành |

## Cách dùng
* Tailwind: `bg-surface`, `text-ink`, `text-ink-muted`, `border-line`, `text-brand-300`, `bg-brand-700`, `text-moss-400`, `text-red-400`…
* Inline style: `var(--color-brand-500)`… (các biến luôn có sẵn nhờ `@theme static`).
* Font: tiêu đề `font-display` (Outfit), nội dung `font-body` (Inter).
* Logo: `components/brand/BrandLogo.jsx`. Icon: `components/brand/icons.jsx` (dùng `currentColor`, không dùng ảnh ngoài).

## Quy tắc tương phản
* Chữ trắng chỉ đặt trên `brand-700`, `red-600`, `moss-700` (≥ 4.8:1). **Không** dùng chữ trắng trên `brand-600` hoặc `moss-600`.
* Chữ trên nền tối dùng `ink`, `ink-muted`, `ink-subtle`, `brand-300/400`, `red-300/400`, `moss-300/400`.

## Giữ cho đồng nhất
* `node --test src/styles/tests/palette.test.mjs` — báo lỗi nếu màu cũ (chàm/tím/cam/…) lọt lại vào mã và kiểm tra độ tương phản.
* Lỡ dán code có màu cũ: `python src/styles/tools/recolor.py src` sẽ quy về bảng màu hiện tại.
