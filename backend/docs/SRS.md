# SRS, chuỗi ngày và bài học (đợt 2)

## Lịch ôn (đã đổi so với STT 8)

| Cấp | Tên | Hẹn ôn sau | Trước đây |
|---|---|---|---|
| 1 | Mới học | 20 phút | 20 phút |
| 2 | Biết | 10 giờ | 10 giờ |
| 3 | Gần thuộc | 1 ngày | 24 giờ |
| 4 | Đã thuộc | **3 ngày** | 1 ngày (trùng cấp 3) |
| 5 | Nhớ dai | **7 ngày** | 3 ngày |
| 6 | Không quên | **21 ngày** | 5 ngày (mãi mãi) |

Lý do: cấp 3 và cấp 4 trùng nhau nên một cấp vô nghĩa; và vì cấp cao nhất chỉ dãn tới 5 ngày nên lượng từ phải ôn mỗi ngày tăng tuyến tính theo số từ đã học (500 từ ≈ 100 từ/ngày), người dùng sẽ bỏ cuộc.
**Đây là thay đổi so với bảng STT 8 của bạn.** Muốn đổi: sửa `SRS_INTERVALS` trong `app/utils/srs.py` và `SRS_SECONDS` + `SRS_INTERVAL_LABEL` trong `frontend/src/constants/srs.js`; `tests/test_srs.py` báo lỗi ngay nếu hai nơi lệch nhau. Từ đã học từ trước giữ nguyên `next_review` cũ, chỉ lượt ôn kế tiếp mới dùng lịch mới.

## Khi hoàn thành một lượt ôn (`app/utils/srs.py::decide_review`)

| Tình huống | Kết quả | Cấp mới | Hẹn lại |
|---|---|---|---|
| Người dùng chọn rõ (`quay_ve_lv1` / `lui_1_lv` / `bo_qua`) | đúng như chọn, **bất kể số lần sai** | LV1 / −1 / giữ | 20 phút / theo cấp mới / **12 giờ** |
| 0 lần sai | `hoan_thanh` | +1 (tối đa 6) | theo cấp mới |
| 1–3 lần sai | `giu_level` (**mới**) | giữ nguyên | theo cấp hiện tại |
| ≥ 4 lần sai, chưa chọn | `lui_1_lv` | −1 | theo cấp mới |

Các lỗi đã sửa:
* Sai tối đa 3 lần vẫn **lên cấp** (từ nhớ chưa chắc bị đẩy ra xa).
* "Bỏ qua" khi ôn: giữ `next_review` cũ nên từ hiện lại ngay; và nếu sai < 4 lần thì server **bỏ qua `choice` và cho lên cấp**.
* Sai ≥ 4 lần: server trả 400 vì thiếu `choice` (hộp thoại `SuggestionDialog` đã viết sẵn nhưng **chưa từng được nối vào màn học**), rồi outbox bỏ mục đó trong im lặng. Từ không bao giờ được lưu và cứ đến hạn lại.
* "Nhắc lại sau" khi ôn: gửi `snooze` rồi vẫn hoàn thành từ như bình thường → từ lên cấp và hẹn do "nhắc lại" bị ghi đè.
* "Bỏ qua" khi học mới ghi từ là **đã học** (cấp 1); từ "bỏ qua/nhắc lại" cũng được cộng vào bộ đếm "đã học/đã ôn".

Cách xử lý ở màn học (`LearningSession.jsx`): sai ≥ 4 lần khi ôn thì hiện `SuggestionDialog` sau khi cả nhóm 5 từ xong 4 dạng; "Bỏ qua" khi ôn gửi `bo_qua`, khi học mới gửi `skip`; "Nhắc lại sau" chỉ hiện khi ôn tập (server không hoãn được từ chưa học) và chỉ gửi `snooze`.

## Chuỗi ngày (streak) — `app/utils/streak.py`

Một ngày (giờ Việt Nam) được tính khi đạt **một trong ba**:
1. học đủ mục tiêu từ mới (như trước);
2. học ≥ 15 phút (STT 12: trước đây **không** tăng chuỗi, chỉ cấp huy hiệu);
3. ôn tập xong ≥ 5 từ, hoặc ôn xong **hết** từ đến hạn nếu hôm nay có ít hơn 5 (lượt "Bỏ qua" không tính).

Chuỗi hiển thị về 0 khi đã bỏ lỡ từ hôm kia trở đi (cột `users.streak` chỉ đổi khi có hoạt động nên trước đây vẫn hiện số cũ).

## Lỗi học khác đã sửa
* **Đáp án trùng nghĩa** (bài 2 và 3): hai từ cùng nghĩa (vd "beautiful"/"pretty" = "đẹp") có thể cùng xuất hiện làm 2 lựa chọn "đúng" mà chỉ 1 được chấm, hoặc cho 2 lựa chọn giống hệt nhau. Nay đáp án nhiễu trùng nghĩa/trùng chữ bị loại (`quizChoices.js`); so sánh đáp án chuẩn hóa Unicode, hoa/thường và khoảng trắng (cả bài chính tả và bài nghe).
* **Che từ trong câu ví dụ** (`blankWord`): che mọi chỗ xuất hiện (trước đây chỉ che chỗ đầu tiên nên chỗ sau vẫn lộ), nhận dạng bất quy tắc thường gặp (ran, went, children, studied/studies, running...), và nếu sau khi che vẫn còn dạng lạ của từ thì bỏ câu đó thay vì để lộ.
  *Đính chính nhận xét lần trước:* mình đã viết rằng dạng bất quy tắc "lộ đáp án". Thực tế code cũ trả `null` rồi dùng câu dự phòng nên **không lộ**; chỗ lộ thật là các lần xuất hiện thứ hai trở đi. Nay vừa không lộ vừa giữ được nhiều câu ví dụ hơn.
* **Tiến độ bị server từ chối** (400/403/404) không còn bị bỏ trong im lặng: `SyncBanner` hiện cảnh báo kèm lý do cho tới khi bấm "Đã hiểu" (cả sau khi tải lại trang).
* Trang Ôn tập (`ReviewLanding`) tự khai báo một lịch ôn riêng (cấp 4 = 3 ngày, cấp 5 = 7 ngày, cấp 6 = 5 ngày) khác cả backend lẫn `constants/srs.js`; nay dùng chung `constants/srs.js`. Văn bản trang giới thiệu cũng đã cập nhật.

## Chưa làm
* **Chấm điểm vẫn ở client.** `/api/words/<id>/check-answer` không được dùng; client có thể gửi `complete-learn` mà không học thật. Với app cá nhân điều này chỉ làm sai tiến độ của chính người đó; nó chỉ thành vấn đề khi có bảng xếp hạng hoặc phần thưởng thật. Chuyển sang chấm ở server cần đổi cả luồng 4 dạng bài (server phải giữ trạng thái từng lượt).
* Chưa có "đóng băng streak" khi bận, chưa có SM-2/FSRS (mức "dễ/vừa/khó"), chưa có chế độ ôn nhanh bằng thẻ lật.
* Màn hình tổng kết cuối buổi ôn (STT 5: "Đã ôn X/X, Tăng level, Lùi level...") vẫn chưa có.
* Bài "chính tả" vẫn bắt gõ cho mỗi từ kể cả trên điện thoại.
