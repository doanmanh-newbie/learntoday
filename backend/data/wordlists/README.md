# Danh sách từ theo cấp độ

`cefr_levels.csv` (cột `word,level`, cấp A1–B2) dùng để gán bậc khó cho từ (`words.difficulty`, xem `app/utils/word_level.py`).
Mỗi từ lấy cấp dễ nhất trong các từ loại của nó; dạng viết khác nhau (vd `a.m./am`) tách thành từng dòng.

Nguồn: The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies.
http://www.cefr-j.org/download.html (lấy qua https://github.com/openlanguageprofiles/olp-en-cefrj).
Được dùng miễn phí cho nghiên cứu và thương mại khi ghi nguồn; bản quyền thuộc Tono Laboratory, TUFS.

Chưa có danh sách bậc 4 (nâng cao): từ không có trong CEFR-J là bậc 1.
Sau khi cập nhật file, chạy `python scripts/backfill_difficulty.py` trong `backend/` để điền lại DB.
