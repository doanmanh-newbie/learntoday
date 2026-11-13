# Nội dung học (đợt 3)

## 1. Các folder chủ đề từ từ điển của bạn

`data/wordlists/` có **13 danh sách từ** (khoảng 920 từ, do mình tự soạn nên không dính giấy phép của bên thứ ba):
Gia đình, Trường học, Nhà cửa, Sức khỏe & cơ thể, Công việc & nghề nghiệp, Mua sắm & tiền bạc, Thời tiết & thiên nhiên,
Giao thông & di chuyển, Cảm xúc & tính cách, Động từ thông dụng, Tính từ thông dụng, Văn phòng & công sở, Từ vựng học thuật.
Danh sách chỉ chứa **từ tiếng Anh**; nghĩa tiếng Việt, loại từ, phiên âm và ví dụ lấy từ từ điển `.mobi` của bạn.

```
flask db upgrade
python scripts/import_dict.py data/eng-viet-dict.mobi                         # nạp từ điển (một lần)
python scripts/import_dict.py data/eng-viet-dict.mobi --check-lists data/wordlists   # (tùy chọn) kiểm tra offline, không ghi DB
python scripts/import_dict.py --skip-import --topics data/wordlists          # tạo/cập nhật 13 folder hệ thống
```
Chạy lại bao nhiêu lần cũng được: không tạo trùng folder/từ, chỉ thêm từ mới còn thiếu và cập nhật biểu tượng/màu/mô tả.
Từ nào không có trong từ điển hoặc thiếu nghĩa được in ra cuối mỗi folder. Folder có biểu tượng emoji và màu riêng; ảnh bìa là mặc định
của thư viện (không lấy ảnh từ mạng).

### Thêm/sửa một chủ đề
Tạo file `.txt` trong `data/wordlists/`: bốn dòng đầu là `# name: ...`, `# icon: ...` (emoji), `# color: #rrggbb`, `# description: ...`,
các dòng sau là các từ (cách nhau bằng dấu cách hoặc dấu phẩy, thứ tự là thứ tự học). Chạy lại lệnh `--topics`.
`tests/test_dict_import.py` kiểm tra mọi file danh sách đều đúng định dạng.

### Vì sao có `data/card_overrides.json`
File từ điển xếp nghĩa theo thứ tự từ nguyên chứ không theo mức độ thông dụng, nên với nhiều từ thông dụng nghĩa đầu tiên là nghĩa hiếm
hoặc cổ ("plane" → "cây tiêu huyền", "sell" → "vố chơi khăm", "test" → "vỏ tôm cua"), và một số mục bị hỏng từ trong file nguồn
("grandma" → "uây oác['grænmə,mɑ:]"). Script đã tự xử lý phần lớn: bỏ nghĩa hỏng, bỏ nhãn đầu dòng như "(thực vật học)", và chọn khối nghĩa
"dày" hơn khi khối đầu quá mỏng. Với **212 từ** trong danh sách mà cách tự động vẫn chọn sai, file này ghi đè bằng nghĩa viết tay
(mình soạn, bạn nên đọc lại một lượt). Nó chỉ ảnh hưởng **thẻ học** (flashcard) khi tạo folder và khi người dùng bấm "Lưu vào folder";
trang chi tiết từ vẫn hiện đầy đủ nghĩa của từ điển. Đổi đường dẫn bằng `--overrides FILE` hoặc biến môi trường `LEXICON_OVERRIDES_PATH`.
Cấu trúc sai thì script dừng và báo rõ; `tests/test_dict_import.py` cũng kiểm tra file này và báo nếu có mục không còn dùng cho từ nào.

Giới hạn còn lại: nghĩa tiếng Việt viết **không dấu** trong dòng động từ bất quy tắc của nguồn (vd "bought; mua") không phân biệt được
với dạng chia động từ nên bị bỏ (đã ghi đè thủ công cho "buy"). Ví dụ câu chỉ có ở khoảng 15% mục từ, nên nhiều thẻ chưa có câu ví dụ
(bài điền từ vào chỗ trống sẽ dùng nghĩa tiếng Việt thay thế).

### Chưa có
* Folder **"3000 từ thông dụng"**, IELTS, TOEIC đầy đủ: cần một danh sách tần suất/kỳ thi có giấy phép phù hợp (script đã hỗ trợ `--freq` + `--make-folder`).
  Mình không soạn từ trí nhớ danh sách 3000 từ vì khó đảm bảo đúng tần suất.
* Ảnh bìa riêng cho từng folder chủ đề mới.

## 2. Bài kiểm tra Pass (`app/services/pass_test_logic.py`)

Trước đây: một đoạn văn ~60 từ cho mọi mốc (chỉ đổi con số), và câu 5 hỏi "bài này mừng mốc nào?" nên không kiểm tra tiếng Anh.
Nay: **4 bài đọc hiểu 229–254 từ** (đúng yêu cầu 200–300 từ), xoay vòng theo mốc (50, 100, 150, 200, rồi 250 quay lại bài đầu):
*Why We Need Sleep*, *Bicycles in the City*, *The Journey of Coffee*, *Learning a Language as an Adult*.
Mỗi bài có 5 câu: ý chính, hai câu chi tiết, một câu suy luận, một câu từ vựng trong ngữ cảnh. Mỗi câu có `evidence` là đoạn nguyên văn
trong bài làm căn cứ (test kiểm tra có thật trong bài) và giải thích tiếng Việt, chỉ hiện **sau khi nộp** (cùng đáp án đúng và đáp án bạn đã chọn).
`tests/test_pass_content.py` kiểm tra: độ dài, 4 lựa chọn không trùng, đáp án đúng rải đều 4 vị trí, đáp án đúng không phải lúc nào cũng là lựa chọn dài nhất,
bốn mốc đầu cho bốn bài khác nhau, đề gửi client không lộ đáp án.

Các sự kiện trong bài (thời gian ngủ, thí nghiệm lái xe, Copenhagen, lịch sử cà phê...) mình viết theo hiểu biết phổ biến và đã dùng cách nói
thận trọng ("nearly half", "about", "is said to"); nếu dùng thật bạn nên tự đối chiếu nguồn.
Thêm bài mới: thêm một mục vào `PASSAGES` rồi chạy test.

### Đồng hồ 15 phút và lưu tiến độ (STT 16)

Server giữ đồng hồ (`app/utils/pass_timer.py`), không tin đồng hồ trình duyệt:
* **Mở bài** (`GET /api/pass-test/<id>`) bắt đầu một phiên và trả `progress` (`remaining_seconds`, `answers` đã lưu, `resumed`).
* **Lưu tiến độ** (`PUT .../progress`): trang gọi mỗi khi chọn đáp án (chờ 0,7 giây) và mỗi 30 giây. Hết giờ trả 409 `TIME_UP`.
* **Thoát** (`POST .../leave`, nút "Thoát", hoặc tự gọi khi đóng tab/chuyển trang): lưu câu đã trả lời và **dừng đồng hồ**.
  Quay lại bấm "Tiếp tục" (danh sách ghi "Đang làm dở · còn mm:ss") và làm tiếp đúng câu đã chọn với đúng thời gian còn lại.
* **Tắt tab đột ngột / mất mạng** (không kịp gọi leave): phiên đó chỉ tốn thời gian **tới lần lưu cuối cùng**, không phải tới lúc quay lại.
* **Hết giờ**: trang tự nộp. Server cho dư 30 giây để bù độ trễ mạng; nộp muộn hơn thì chỉ chấm các câu **đã lưu trước khi hết giờ**
  (kết quả có `late: true`). Nộp bài mà chưa từng mở thì vẫn chấm như trước.
* Bộ đếm "bài kiểm tra sẽ có sau hh:mm:ss" hiển thị đúng định dạng của STT 16 (số giây được tải lúc mở trang, chưa tự đếm lại).

Giới hạn: đồng hồ dừng khi thoát (đúng STT 16) nên người dùng có thể tạm dừng để tra cứu; mở bài ở hai tab cùng lúc thì phiên mới nhất giữ đồng hồ.

Vẫn chưa làm: đề sinh bằng AI theo các từ người dùng đã học.
