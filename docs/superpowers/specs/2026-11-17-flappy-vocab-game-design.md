# Chim bay chọn nghĩa v2: thiết kế

Ngày: 2026-11-17. Trạng thái: **chờ duyệt**. Chưa có dòng code sản phẩm nào được viết.

## 1. Ý định và lý do

Hiện `FlappyMode` ([frontend/src/features/practice/FlappyMode.jsx](../../../frontend/src/features/practice/FlappyMode.jsx), logic ở `flappyLogic.js`) chỉ chơi 12 câu từ → nghĩa trên 100 từ đã học, cột đứng yên 1 giây sau mỗi câu, điểm chỉ lưu `localStorage`.

Người dùng muốn biến nó thành bài luyện từ có chiều sâu và có động lực quay lại:

- chơi bằng **kho từ đã học** hoặc **một thư mục** tự chọn;
- hai chiều hỏi Anh → Việt và Việt → Anh, ra ngẫu nhiên;
- bay liên tục, chậm hơn, cột cách xa để kịp chọn;
- điểm được lưu, có **bảng xếp hạng toàn bộ người dùng**, từ khó (theo CEFR/IELTS) được điểm cao hơn;
- cuối ván liệt kê các từ trả lời sai;
- cách chọn đáp án phải dễ đoán;
- làm lại giao diện (nền, chim, màu), tối ưu điện thoại.

## 2. Mục tiêu, không mục tiêu, phản mục tiêu

**Mục tiêu**
- Một ván chơi trơn tru, đủ thời gian đọc và chọn, ý đồ chọn đáp án rõ ràng với người chơi.
- Bảng xếp hạng công khai mà **điểm không giả được bằng cách gửi số tùy ý**.
- Từ khó được thưởng nhiều hơn một cách nhất quán.

**Không mục tiêu (cố ý bỏ)**
- Không cập nhật SRS/mức nhớ của từ từ kết quả game (game vẫn là luyện tập tự do như các chế độ khác).
- Không có bảng xếp hạng riêng cho từng thư mục, không có bảng bạn bè riêng cho game.
- Không thêm kiểu câu hỏi khác (điền chỗ trống, nghe chọn từ), chướng ngại vật, vật phẩm, màn chơi.
- Không điều khiển ván chơi từ server (hướng C bên dưới).

**Phản mục tiêu (nếu xảy ra thì coi như thất bại dù chạy được)**
- Thư mục nhỏ chiếm top bằng cách lặp từ.
- Bảng bị phủ bởi điểm giả.
- Game biến thành thử thách phản xạ, người chơi chỉ lo né mà không nghĩ nghĩa của từ.

## 3. Ràng buộc

- Stack hiện có: Flask + SQLAlchemy + Alembic (`backend/migrations/versions`), React + canvas, test frontend chạy bằng `npm test` (loader `src/api/tests/register.mjs`), test backend dựa trên `tests/base.py` (`ApiTestCase`).
- Bảng bạn bè theo tuần (`backend/app/utils/leaderboard.py`, `routes/friends.py`) giữ nguyên, **không** trộn điểm game vào đó. Có thể dùng lại `week_start_utc` (thứ Hai 00:00 giờ VN).
- Cần tối thiểu `MIN_WORDS = 4` từ để chơi (giữ như hiện tại).
- Repo đang có nhiều thay đổi chưa commit (git status ban đầu), người thực hiện cần làm trên nền hiện trạng, không revert chúng.

## 4. Các hướng đã cân nhắc

**Về điểm đáng tin (người dùng chọn B)**
- A. Tin điểm từ trình duyệt, chặn trần: ít code nhất nhưng giả điểm dưới mức trần vẫn dễ. Loại.
- **B. Server tính lại điểm từ nhật ký ván chơi (chọn).** Trình duyệt gửi từng câu đã trả lời, server kiểm tra từ, đáp án, thời gian và tự tính điểm. Vẫn bị bot chơi thật vượt mặt nhưng không sửa được con số điểm.
- C. Server điều khiển cả ván: mạnh nhất nhưng viết lại luồng chơi và phụ thuộc mạng, trong khi app có cơ chế offline. Loại.

**Về nguồn mức độ từ (người dùng chọn danh sách có sẵn)**
- **Danh sách từ vựng có sẵn theo CEFR/học thuật (chọn).**
- AI chấm từng từ: không nhất quán giữa các lần, tốn chi phí. Loại.
- Gán tay theo thư mục: quá thô. Loại.

## 5. Các quyết định (người dùng đã duyệt trong hội thoại)

### 5.1 Chọn bộ từ trước khi chơi
- Màn đầu có chọn nguồn: **Kho từ đã học** (mặc định) hoặc **một thư mục**.
- Khi chọn thư mục có công tắc **"Gồm cả từ chưa học"**, mặc định tắt (đã duyệt: cho người chơi bật/tắt).
- Bộ chơi = đúng các từ của nguồn đã chọn, **mỗi từ đúng một lần mỗi ván**. Thư mục bao nhiêu từ thì chơi bấy nhiêu từ, không lặp để cho đủ.
- Trước khi chơi hiện thông báo điểm tối đa của bộ này, ví dụ: "Thư mục này chỉ có 5 từ nên điểm tối đa là 70."
- Dưới 4 từ: báo cần thêm từ, không cho chơi.
- Điểm tối đa được tính theo cùng công thức tính điểm ở 5.4, từ bậc của từng từ.

### 5.2 Câu hỏi
- Mỗi từ ra ngẫu nhiên một trong hai chiều: **Anh → Việt** (hiện từ, chọn nghĩa) hoặc **Việt → Anh** (hiện nghĩa, chọn từ).
- Đáp án nhiễu dùng `meaningChoices` / `wordChoices` trong `frontend/src/features/learning/quizChoices` (đã có, `buildQuiz` đã dùng).
- Mỗi câu 2–4 ô như hiện tại (loại trùng nghĩa).

### 5.3 Dòng chơi (thay cho "cột đứng yên rồi reset")
- Chim **bay liên tục**: sau khi cột chạm chim và đáp án được chốt, chim không bị đặt lại vị trí và cột cũ tiếp tục trôi ra khỏi màn hình, mang màu đúng/sai.
- Cột kế tiếp xuất hiện sau một khoảng cách xa; từ/nghĩa của câu kế hiện ở phần đầu ngay khi cột trước được chốt, để người chơi có thời gian đọc trước khi cột tới.
- Tốc độ khởi đầu **chậm hơn** hiện tại (hiện 130 px/s) và tăng dần theo số câu đúng, có trần thấp hơn hiện tại (hiện 220). Giá trị cụ thể là việc của người thực hiện (xem 7).
- Kết thúc ván: **hết 3 mạng hoặc hết từ**, tùy cái nào đến trước.
- Chạm trần/sàn vẫn chỉ bị chặn lại, không phạt.

### 5.4 Cách chọn đáp án dễ đoán
- Ô đang nằm ngang tầm chim luôn sáng rõ, kèm vạch ngắm nối từ chim sang cột để người chơi thấy trước mình sắp chọn ô nào.
- Giữ nguyên luật: ô ngang tầm chim lúc cột chạm tới là đáp án.

### 5.5 Điểm
- Mỗi từ có **bậc 1–4** lấy từ `words.difficulty` (xem 5.6). Điểm cơ bản mỗi câu đúng:

| Bậc | Mức từ | Điểm cơ bản |
|---|---|---|
| 1 | A1–A2 hoặc không xác định | 10 |
| 2 | B1 | 13 |
| 3 | B2 (tương đương IELTS khoảng 5.5–6.5) | 16 |
| 4 | Nâng cao (học thuật, trên B2; IELTS 7+) | 20 |

- Thưởng chuỗi đúng liên tiếp như hiện tại: +2 cho mỗi câu đúng liên tiếp sau câu đầu, tối đa +10. Sai thì chuỗi về 0 và mất 1 mạng.
- Điểm một câu = điểm cơ bản của bậc + thưởng chuỗi. **Server** là nơi tính điểm cuối cùng, không dùng điểm client gửi.

### 5.6 Mức độ của từ (nguồn dữ liệu)
- Hiện `words.difficulty` đều bằng 1 ([seed.py:104](../../../backend/seed.py)) nên cần điền lại.
- Nguồn dự kiến, **cần kiểm tra giấy phép trước khi dùng**:
  - **CEFR-J Wordlist** (Tono Laboratory, TUFS): gán A1–B2. Các nguồn thứ cấp cho biết dùng miễn phí cả thương mại nếu ghi nguồn. Cần xác nhận lại ở cefr-j.org vì tôi chưa mở trang chính thức.
  - **Cập nhật 2026-11-17: người dùng chọn chỉ dùng CEFR-J (bản 1.5), chưa dùng NAWL nên hiện chưa có bậc 4.** Nguồn ghi ở `backend/data/wordlists/README.md`.
  - **NAWL** (New Academic Word List): CC BY-SA 4.0. Dùng để đánh dấu từ học thuật nâng cao (bậc 4) với những từ không nằm trong A1–B2 của CEFR-J. Cần kiểm tra điều kiện "ShareAlike" có ảnh hưởng đến cách lưu bậc trong DB hay không.
- Quy tắc ánh xạ: A1/A2 → 1, B1 → 2, B2 → 3, từ có trong NAWL mà chưa ở A1–B2 → 4. **Không tìm thấy trong danh sách nào → bậc 1** (đã duyệt), nghĩa là từ người dùng tự thêm không mất điểm oan nhưng cũng không được thưởng.
- Cần một script điền lại cho từ hiện có, và từ mới tạo sau này cũng được tra bảng bậc khi tạo.
- Cần ghi nguồn (credits) đúng yêu cầu giấy phép ở đâu đó trong app.

### 5.7 Lưu điểm và bảng xếp hạng
- Bảng DB mới (ví dụ `game_runs`): người chơi, game, điểm do server tính, số câu, số câu đúng, thời lượng, thời điểm.
- API mới: gửi một ván (nhật ký), lấy bảng xếp hạng theo kỳ.
- **Nhật ký ván gửi lên** mỗi câu gồm: id từ, chiều hỏi, đáp án đã chọn, mốc thời gian. **Không** gửi điểm.
- **Server kiểm tra:**
  - từ có tồn tại và người chơi có quyền dùng (từ đã học của họ, hoặc thuộc thư mục của họ khi bật công tắc từ chưa học);
  - mỗi từ tối đa một lần trong một ván;
  - đáp án đúng hay sai: so với dữ liệu từ trên server;
  - khoảng cách giữa hai câu liên tiếp không nhanh hơn mức bay thực tế (đặt ngưỡng thận trọng, thấp hơn mức nhanh nhất hợp lệ);
  - dừng tính sau mạng thứ ba bị trừ;
  - giới hạn số ván xếp hạng mỗi ngày để tránh cày.
- Server tính điểm theo 5.5 và lưu. Ván không hợp lệ bị từ chối hoặc không vào bảng.
- **Bảng có hai tab:** tuần này (reset thứ Hai 00:00 giờ VN) và mọi thời gian. Xếp theo **điểm của một ván tốt nhất** trong kỳ, không cộng dồn nhiều ván.
- **Hiển thị username công khai** (đã duyệt), kèm hạng, điểm, số câu đúng. Người chơi luôn thấy hạng của mình kể cả khi ngoài top.
- Mọi ván, kể cả thư mục nhỏ hay bật từ chưa học, đều vào bảng; điểm tự giới hạn vì mỗi từ chỉ một lần. Không có ngưỡng số từ tối thiểu ngoài 4 từ để chơi.
- Điểm cao nhất cá nhân vẫn lưu cục bộ như hiện nay (`saveBestIfBetter`), và là chỗ hiển thị khi không gửi lên server được.

### 5.8 Cuối ván
- Màn tổng kết có điểm, số đúng, chuỗi dài nhất, hạng, **danh sách các từ trả lời sai** (từ, nghĩa, nút phát âm).
- Nếu không gửi được kết quả (mất mạng), báo "chưa lưu được vào bảng xếp hạng" và không tự xếp hàng đợi gửi lại.

### 5.9 Giao diện
- Làm lại **nền, chim, màu**; **tối ưu điện thoại**: chạm một tay, chữ trên canvas đủ đọc trên màn hình nhỏ (hiện world 640×420 co về cỡ nhỏ), màn chọn bộ từ và bảng xếp hạng dùng tốt trên chiều dọc.
- Hướng hình ảnh cụ thể (phong cách nền, kiểu chim, bảng màu) **chưa chốt**. Cần chọn khi xem bản chạy thử đầu tiên. Gợi ý ban đầu: giữ tông xanh ngọc tối của app nhưng thêm lớp nền xa/gần để có cảm giác bay, và một con chim mới đọc được rõ ở kích thước nhỏ.

## 6. Test cần có
- Logic game thuần (`flappyLogic.js`): bộ từ đúng một lần/từ, hai chiều hỏi ngẫu nhiên, đúng/sai và chuỗi, kết thúc khi hết mạng hoặc hết từ, tốc độ có trần mới, cột không đứng lại sau khi chốt.
- Tính điểm theo bậc và điểm tối đa của một bộ từ.
- Backend: điểm do server tính khớp với client cho cùng một nhật ký; từ chối từ lạ, từ lặp, đáp án sai kiểu dữ liệu, thời gian quá nhanh, vượt giới hạn ván/ngày; xếp hạng tuần và mọi thời gian; hạng của người chơi ngoài top.
- Script điền bậc từ chạy được hai lần cho cùng kết quả.

## 7. Việc để người thực hiện quyết định
- Giá trị cụ thể của tốc độ đầu/trần, khoảng cách giữa các cột, ngưỡng thời gian tối thiểu giữa hai câu ở server, giới hạn số ván/ngày, số dòng top hiển thị.
- Tên bảng/endpoint, cách chia file, đưa hằng số dùng chung giữa client và server thế nào (miễn không để server tin vào điểm client).
- Chiến lược chọn đáp án nhiễu khi bộ từ nhỏ hơn 4 (được lấy thêm từ kho từ đã học của người chơi nhưng không tính vào câu hỏi).
- Cách thiết kế chim, nền, bảng màu và bố cục điện thoại cụ thể.

## 8. Rủi ro đã biết
- Bot chơi thật vẫn có thể lên bảng; hướng B không ngăn được.
- Bảng toàn bộ người dùng thiên về người có nhiều từ đã học hơn; tab "tuần này" làm giảm điều đó nhưng không xóa.
- Từ không có trong danh sách nào bị xếp bậc 1 nên từ khó nhưng hiếm có thể bị đánh giá thấp.
- Giấy phép các danh sách từ chưa xác nhận từ nguồn chính thức. Đây là việc đầu tiên khi bắt đầu làm 5.6.
