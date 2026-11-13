
## Trang chủ & Luyện tập (giao diện mới)
- Trang chủ chỉ đưa ra MỘT việc nên làm (`homeLogic.nextStep`): người mới → chọn chủ đề; có từ đến hạn → ôn; chưa đủ mục tiêu → học từ mới; xong → luyện tập.
- Tab **Luyện tập** (`/app/luyen-tap/<chế độ>`): Thẻ nhanh, Trắc nghiệm, Ghép cặp, Nghe & chép. Dùng các từ đã học (tối thiểu 4 từ). Các trò này chỉ để luyện, không đổi level SRS.
- Đặt câu và Kiểm tra Pass được gom vào tab Luyện tập.

## Thứ tự từ theo độ phổ biến
- Từ trong folder hệ thống được xếp theo mức phổ biến (từ dễ/thường gặp học trước): ưu tiên `freq_rank` thật (nạp bằng `--freq`), sau đó danh sách gần đúng `data/common_words.txt`, còn lại từ ngắn trước.
- Folder tạo mới (`--topics`, `--make-folder`) tự xếp. Folder đã có: `python scripts/import_dict.py --skip-import --sort-folders`.
- `common_words.txt` chỉ là xấp xỉ viết tay; muốn chính xác hãy nạp danh sách tần suất thật (vd NGSL, Google 10k) bằng `--freq file.txt` rồi chạy lại `--sort-folders`.

## Giao diện (đợt phản hồi 2)
- Tốc độ: danh sách folder dùng cache "hiện ngay, cập nhật sau" (`api/cache.js`), cache bị xóa khi tiến độ/folder thay đổi; câu AI kế tiếp được tải trước; tổng số từ folder hệ thống cache 60 giây ở backend.
- Lộ trình 5 giai đoạn + hướng dẫn 4 bước nằm ở trang chủ (`features/path/`). Hướng dẫn hiện lần đầu, mở lại bằng nút "Cách học".
- Hình minh họa từ: emoji (`components/word/wordEmoji.js`, thêm từ mới vào đó) → ảnh Wikipedia cho danh từ khác → chữ cái đầu.
- Chế độ sáng/tối: nút ở Header; cài đặt bằng CSS đảo màu (`index.css`), là bản xấp xỉ.
- Bài Pass chặn bôi đen/copy/chuột phải/in (`utils/antiCopy.js`) — chỉ là rào cản, không chống được người rành kỹ thuật.

## Đợt phản hồi 3
- Màn đúng/sai trong buổi học: nhấn Enter để sang câu tiếp.
- Bài trắc nghiệm luôn đủ 4 lựa chọn: đáp án nhiễu lấy từ nhóm đang học + từ đã học trước đó + ngân hàng dự phòng (`features/learning/distractorBank.js`).
- Sau mỗi nhóm từ mới có vòng "ôn nhanh 4 từ cũ" (chỉ luyện, không ghi vào lịch SRS).
- Folder cụm từ là dữ liệu thật (`features/phrases/phrasesData.js`, 48 cụm, thêm cụm mới ở file này); mở bằng `/app/thuvien/phrase-<id>`.
- Chế độ sáng: bỏ bóng/vầng sáng/hiệu ứng chuyển màu.
