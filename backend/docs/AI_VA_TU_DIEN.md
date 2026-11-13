# AI chấm câu & Từ điển thật

## 1. Từ điển thật + kho từ vựng trong database
**Tra từ** `GET /api/dictionary/lookup?q=<từ>`
0. **Từ điển Anh-Việt tích hợp** (bảng `lexicon_entries`, nạp từ file `.mobi` — xem mục 3). Có → trả ngay, không gọi mạng.
   Tra "went" thì trả mục "go" (kèm `redirected_from`); tra "studies" (không có mục riêng) thì đoán dạng gốc "study" (kèm `matched_from`).
1. Không có → tìm trong bảng `dictionary_entries` (kho cache). Có → trả ngay (nhanh, không gọi mạng).
2. Chưa có → gọi Free Dictionary API (dictionaryapi.dev) lấy *mọi nghĩa của mọi loại từ*, phiên âm, audio UK/US,
   ví dụ, đồng/trái nghĩa → dịch nghĩa sang tiếng Việt (deep-translator/Google) → **lưu vào kho** → trả về.
3. Từ không có trong từ điển được nhớ 24 giờ (khỏi hỏi lại); lỗi mạng KHÔNG bị nhớ là "không có từ".
4. Dịch lỗi thì ô tiếng Việt để TRỐNG (`vi_complete=false`), tự thử dịch lại ở lần tra sau (cách nhau ≥ 10 phút).
   Hệ thống không bao giờ lưu tiếng Anh vào chỗ dành cho nghĩa tiếng Việt.

**Gợi ý khi gõ** `GET /api/dictionary/suggest?q=<tiền tố>`: từ điển tích hợp (từ nhiều nghĩa/ví dụ — thường gặp — lên đầu) + kho cache + bảng `words`;
chỉ khi từ điển tích hợp không có kết quả mới bổ sung từ Datamuse; nguồn ngoài lỗi thì bỏ qua.

**Lưu từ** `POST /api/dictionary/save {word, folder_id}`:
từ được ghi vào bảng `words` (kho từ dùng chung, nếu chưa có; nếu đã có bản biên soạn tay thì dùng lại, không nhân đôi)
rồi gắn vào thư mục cá nhân (`folder_words`). Từ đã lưu **đi vào luồng học/ôn SRS** như mọi từ khác và được tính vào
"Từ được lưu nhiều nhất" (STT 10, `GET /api/search/popular`).

## 2. AI chấm & sửa câu (STT 17)
Chọn nhà cung cấp bằng `AI_PROVIDER` (`auto` mặc định: có `GEMINI_API_KEY` thì dùng **Gemini**, không thì dùng Claude nếu có `ANTHROPIC_API_KEY`).
Lấy khóa Gemini miễn phí tại https://aistudio.google.com (Get API key). Xem `.env.example`.
* `GET /api/ai-practice/sentence?level=B1&mode=vi_en[&folder_id=...]`: AI soạn câu theo trình độ; có `folder_id` thì
  câu phải dùng một từ trong folder (ưu tiên từ bạn đã học).
* `POST /api/ai-practice/check {token, answer}`: AI chấm công bằng với MỌI cách dịch đúng (không chỉ khớp đáp án mẫu),
  trả điểm ngữ pháp/từ vựng/tự nhiên (0-10), danh sách lỗi + giải thích tiếng Việt, câu đã sửa, cách dịch khác.
* Câu hỏi được **ký** bằng khóa server (hết hạn sau 3 giờ, gắn với người dùng): client không thể gửi đề tùy ý để dùng AI
  như chatbot miễn phí. Câu trả lời tối đa 500 ký tự; mỗi người tối đa `AI_RATE_LIMIT_PER_HOUR` lượt/giờ
  (giới hạn theo từng process; chạy nhiều worker cần Redis nếu muốn chính xác tuyệt đối).
* Chưa có khóa / AI lỗi: trang vẫn chạy bằng câu mẫu cố định và so khớp đáp án, **không có điểm** và hiện thông báo rõ.
* Tên model: Gemini mặc định `gemini-flash-lite-latest` (bí danh trỏ tới Flash-Lite mới nhất; đổi bằng `GEMINI_MODEL`); Claude mặc định
  `claude-haiku-5-5` (`ANTHROPIC_MODEL`). Sai tên thì API báo lỗi và trang hiển thị "Cấu hình AI chưa đúng".

### Dùng Gemini gói miễn phí: cần biết
* **Hạn mức tính chung cho cả project Google**, không theo từng người dùng, và Google có thể đổi con số bất cứ lúc nào (xem trong Google AI Studio).
  Vì vậy ngoài giới hạn theo người dùng (`AI_RATE_LIMIT_PER_HOUR`) còn có trần chung `GEMINI_RPM` (mặc định 10 lượt/phút/process) để một lượt đông
  người không làm hết hạn mức của mọi người; vượt trần thì trang báo "AI đang đông người dùng" kèm số giây chờ. Gặp 429/503 từ Google, server thử lại 1 lần.
  Chỉnh `GEMINI_RPM` theo hạn mức thật của khóa bạn (mỗi worker gunicorn đếm riêng nên đặt ≈ hạn mức / số worker).
* **Đừng gắn tài khoản thanh toán vào project chứa khóa này** nếu muốn giữ miễn phí (gắn billing là chuyển sang tính tiền).
* **Gói miễn phí: Google có thể dùng nội dung gửi lên để cải thiện sản phẩm và người kiểm duyệt có thể đọc.** Câu luyện tập thường vô hại, nhưng hãy
  ghi điều này vào chính sách quyền riêng tư của app và đừng khuyến khích người học nhập thông tin cá nhân. Khi có người dùng thật, nên chuyển sang gói trả phí
  (Flash-Lite rất rẻ) để dữ liệu không bị dùng cho mục đích đó.
* Model "suy nghĩ" tính cả token suy nghĩ vào giới hạn đầu ra; code đã để dư. Muốn nhanh/rẻ hơn thì đặt `GEMINI_THINKING_BUDGET=0` (chỉ khi model hỗ trợ,
  nếu API báo 400 thì bỏ biến này).
* Khóa API gửi qua header `x-goog-api-key`, không nằm trong URL và không bị ghi log. Đừng đưa khóa vào mã frontend.

## 3. Nạp từ điển Anh-Việt (file .mobi)
1. `flask db upgrade` (tạo bảng `lexicon_entries`).
2. Xem thử, không ghi DB: `python scripts/import_dict.py /đường/dẫn/eng-viet-dict.mobi --dry-run`
   (thêm `--export out/lexicon.jsonl` để soát lỗi bằng mắt).
3. Nạp thật: `python scripts/import_dict.py /đường/dẫn/eng-viet-dict.mobi` (khoảng 10–30 giây; nạp lại: thêm `--replace`).
   Với file `eng-viet-dict.mobi` hiện có: ~63.600 từ, ~19 MB JSON (Supabase Free còn dư nhiều).
4. Tạo các folder chủ đề từ `data/wordlists/` (Gia đình, Trường học, Nhà cửa...): xem `docs/NOI_DUNG.md`.
5. (Tùy chọn) Có danh sách từ theo tần suất (mỗi dòng 1 từ, phổ biến nhất ở trên): `--skip-import --freq data/freq.txt --make-folder "3000 từ thông dụng" --top 3000`.
   Danh sách tần suất KHÔNG kèm sẵn; kiểm tra giấy phép của danh sách bạn chọn.

Cách tách dữ liệu và các giới hạn đã biết của file nguồn:
* Mỗi mục được tách thành: loại từ (+ ghi chú chia động từ/số nhiều), các nghĩa, ví dụ, thành ngữ, nghĩa chuyên ngành (kỹ thuật, kinh tế, y học...).
  Nghĩa chuyên ngành hiện ở tab riêng "CHUYÊN NGÀNH", không lẫn vào nghĩa thường; ~5.700 từ chỉ có nghĩa chuyên ngành.
* Phiên âm là kiểu cũ của file (vd `/gou/`, `/'disiplin/`), ~63% mục có phiên âm. Nghe phát âm dùng giọng trình duyệt nên không phụ thuộc phiên âm này.
* **Lỗi có sẵn trong nguồn** (script không tự sửa vì không thể đoán đúng): nhãn kiểu "(giải phẫu)" bị hỏng thành thẻ rác nên bị bỏ đi
  (một số mục mất nhãn lĩnh vực), vài lỗi chính tả (ví dụ "bạn rộn" thay vì "bận rộn"), một số dạng biến thể gắn nhầm phiên âm của từ gốc.
* Chưa có tính năng tra ngược Việt → Anh; chưa có định nghĩa tiếng Anh/audio cho từ trong từ điển tích hợp (tab "ANH - ANH" tự ẩn).
* **Giấy phép**: chưa xác minh được nguồn gốc file. Nếu công bố app hoặc kiếm tiền, hãy kiểm tra điều khoản của chủ sở hữu từ điển.
