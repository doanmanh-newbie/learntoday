# Prompt chi tiết để AI dịch từ vựng (dùng thay cho PROMPT.md khi cần kết quả chuẩn hơn)

Dán toàn bộ khối prompt bên dưới, rồi dán nội dung một file `batch_XXX.txt` (hoặc chỉ một phần của file) ngay sau dòng `DANH SÁCH:`.

```
Bạn là biên tập viên từ điển Anh–Việt cho người Việt học tiếng Anh. Nhiệm vụ: dịch danh sách từ tiếng Anh bên dưới sang tiếng Việt theo đúng quy định.

QUY ĐỊNH ĐẦU RA (bắt buộc):
- Mỗi từ đầu vào tạo đúng MỘT dòng, theo đúng thứ tự, không bỏ sót, không gộp, không thêm từ mới.
- Mỗi dòng có 3 cột, cách nhau bằng ký tự TAB (không dùng dấu phẩy hay dấu chấm phẩy để ngăn cột):
  từ<TAB>loại từ<TAB>nghĩa tiếng Việt
- Cột 1: giữ nguyên chính xác từ đầu vào (kể cả chữ thường).
- Cột 2: CHỈ dùng một trong các mã sau: noun, verb, adjective, adverb, preposition, pronoun, conjunction, determiner, interjection, number, other.
- Cột 3: nghĩa tiếng Việt ngắn gọn, 1 đến 4 từ, là nghĩa PHỔ BIẾN NHẤT của từ ứng với loại từ ở cột 2. Nếu có nhiều nghĩa gần nhau thì cách bằng dấu phẩy, tối đa 3 nghĩa.
- Không in tiêu đề, không giải thích, không đánh số dòng, không bọc khối code, không dùng bảng markdown, không viết câu ví dụ.

QUY TẮC NGHĨA:
- Dịch nghĩa của chính từ đó, không dịch nghĩa của từ gần giống. Ví dụ "cards" là dạng số nhiều của "card" (thẻ), nên dòng là: cards<TAB>noun<TAB>thẻ, không phải "quét".
- Dạng biến cách (số nhiều, quá khứ, so sánh hơn...) vẫn dịch nghĩa gốc, không thêm chữ "số nhiều" hay "quá khứ". Ví dụ "blurts" (dạng ngôi thứ 3 của "blurt") -> blurts<TAB>verb<TAB>buột miệng nói.
- Từ hiếm, từ chuyên ngành, tên riêng hoặc từ không rõ nghĩa: vẫn ghi nghĩa phổ biến nhất có thể, KHÔNG để trống và KHÔNG viết "không rõ".
- Nếu một từ không phải tiếng Anh thông dụng (ví dụ tên người, địa danh, viết tắt): loại từ = other, nghĩa = mô tả ngắn bằng tiếng Việt (ví dụ "tên riêng, thành phố ở Pháp").

VÍ DỤ ĐÚNG (chỉ để tham khảo định dạng):
beginner<TAB>noun<TAB>người mới bắt đầu
repaint<TAB>verb<TAB>sơn lại
firstly<TAB>adverb<TAB>thứ nhất, trước hết
cards<TAB>noun<TAB>thẻ
blurts<TAB>verb<TAB>buột miệng nói

DANH SÁCH:
```

## Cách dùng và kiểm tra

1. Chia danh sách thành lô không quá 300 từ để AI không bị cắt giữa chừng.
2. Lưu kết quả thành `done_XXX.tsv`, cùng số với file gốc.
3. Nếu AI trả thiếu dòng hoặc sai định dạng, nhắn: "Làm lại lô này, đủ đúng số dòng, mỗi dòng 3 cột cách nhau bằng TAB."
4. Gửi mình các file `done_XXX.tsv`. Mình sẽ kiểm tra: đủ số dòng, đúng 3 cột, mã loại từ hợp lệ, không có nghĩa trống, rồi mới nạp vào database.
