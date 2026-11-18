# Đợt phản hồi 4 (11 mục) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa 4 phản hồi UI (cài đặt, trình độ, dịch trong tra cứu, chế độ sáng) và thêm 7 tính năng (tổng kết phiên + streak freeze, từ hay sai, học từ bài đọc, chấm phát âm, PWA + nhắc học, test trình độ, bảng xếp hạng bạn bè).

**Architecture:** Mỗi tính năng có một module logic thuần (test bằng `node --test` / pytest thuần không cần DB) + một component React mỏng. Backend thêm 1 migration (`streak_freezes`, `level_tested_at`, bảng `friendships`), 1 blueprint `friends`, vài endpoint nhỏ trong `history`/`translate`.

**Tech Stack:** React + Vite + Tailwind4 (inline style), Flask + SQLAlchemy + Alembic, Gemini qua `ai_service`, Web Speech API, Service Worker.

**Spec:** tin nhắn phản hồi của Kota ngày 2026-11-13 (11 mục).

## Global Constraints
- Không cài thêm package (sandbox chặn mạng; người dùng cũng không phải cài thêm).
- Giao diện tiếng Việt; mã nguồn theo kiểu sẵn có (inline style, màu teal).
- Mọi tiến độ học vẫn đi qua `api/outbox.js`.
- Migration mới `f1a2b3c4d5e6`, down_revision `e1f2a3b4c5d6`.
- Level hợp lệ: `A1, B1, B2, C1, IELTS` (giữ `VALID_LEVELS`).

## Review Focus
1. Trình duyệt không hỗ trợ SpeechRecognition (Firefox/Safari cũ) → báo rõ, không crash.
2. Người dùng chưa có từ sai nào → trang "Từ hay sai" hiện hướng dẫn thay vì trống/crash.
3. Văn bản dán toàn từ đã biết / rỗng / quá dài → thông báo, giới hạn 20.000 ký tự.
4. Bỏ lỡ nhiều ngày hơn số freeze → chuỗi về 1, không âm freeze.
5. Thêm bạn bằng tên không tồn tại / chính mình / đã là bạn → lỗi 404/400/409 rõ ràng.

---

### Task 1: Cài đặt & trang cá nhân (mục 1, 2)
**Files:** Modify `frontend/src/pages/app/SettingsPage.jsx`
- [ ] Bỏ khối "Trình độ" khỏi tab Cài đặt (mục Đặt câu đã có bộ chọn riêng).
- [ ] Tab Trang cá nhân: thẻ "Trình độ" chỉ đọc — level + ngày test (`user.level_tested_at`), nút "Làm bài test trình độ" → `/app/kiem-tra-trinh-do`; hiển thị số streak freeze.

### Task 2: Dịch gộp vào tra cứu (mục 3)
**Files:** Create `frontend/src/components/sections/dashboard/queryKind.js` (+test); Modify `DictionaryPage.jsx`, `pages/WordDetailPage.jsx`, `api/client.js`, `backend/app/routes/translate.py`, `backend/app/services/ai_service.py`, `backend/app/services/lexicon_service.py`
**Interfaces:** `queryKind(q: string) -> 'empty'|'word'|'translate'`; `translateApi.batch(texts: string[]) -> {translations: (string|null)[]}`; `ai_service.translate_texts(texts, target='vi') -> list[str|None]`.
- [ ] Test: `queryKind('network')==='word'`, `queryKind('look up')==='word'`, `queryKind('xin chào')==='translate'`, `queryKind('I love my family.')==='translate'`, `queryKind('  ')==='empty'`.
- [ ] Ô tìm kiếm: `word` → trang chi tiết; `translate` → thẻ dịch ngay dưới ô.
- [ ] Trang chi tiết: nghĩa/ví dụ "chưa dịch" được tự dịch bằng `translateApi.batch` (Gemini dự phòng khi deep-translator lỗi).

### Task 3: Chế độ sáng (mục 4)
**Files:** Modify `frontend/src/index.css`, `components/sections/dashboard/DashboardHome.jsx`
- [ ] Thẻ nền `rgba(255,255,255,0.0x)` → trắng; nền trang xám nhạt; nút chính giữ màu teal gốc; ô tick kế hoạch không bị đảo màu.
- [ ] Kiểm chứng bằng Playwright trên trang mô phỏng (style gán qua `element.style` như React) + đo tương phản.

### Task 4: Streak freeze + tổng kết phiên (mục 5)
**Files:** Modify `backend/app/utils/streak.py`, `services/streak_service.py`, `models/users.py`, `routes/history.py`; Create migration; Create `frontend/src/features/learning/sessionSummary.js` (+test); Modify `LearningSession.jsx`.
**Interfaces:** `effective_streak(streak, last, today, freezes=0)`; `advance_streak(streak, last, today, freezes) -> (streak, freezes)`; `FREEZE_EVERY=7`, `MAX_FREEZES=2`; `summarizeSession({words, wrongCounts, answered, correct}) -> {count, accuracy, hardest, reminder}`; `GET /api/history/tomorrow -> {due_tomorrow}`.
- [ ] Test: bỏ lỡ 1 ngày có 1 freeze → giữ chuỗi +1, freeze 0; bỏ lỡ 2 ngày có 1 freeze → chuỗi 1; đạt 7 ngày → +1 freeze, tối đa 2.
- [ ] Test: accuracy = round(correct/answered*100); hardest = tối đa 3 từ wrong ≥1, sắp giảm dần.

### Task 5: Từ hay sai (mục 6)
**Files:** Create `frontend/src/features/practice/hardWords.js` (+test), `HardWordsMode.jsx`; Modify `modes.js`, `PracticePage.jsx`, `api/client.js`, `backend/app/routes/history.py`, `services/study_service.py` (learn nhận `wrong_count`).
**Interfaces:** `hardScore(wrong, correct)`; `buildHardQueue(words, n, random) -> word[]` (trọng số theo điểm sai, không lặp liền nhau); `requeue(queue, pos, word, gap=3)`; `GET /api/history/hard-words?limit=30`.
- [ ] Test: từ điểm cao xuất hiện nhiều hơn; không có 2 từ giống nhau đứng liền; requeue chèn sau `gap` vị trí.

### Task 6: Học từ bài đọc (mục 7)
**Files:** Create `frontend/src/features/reader/extractWords.js` (+test), `ReaderPage.jsx`; Modify `modes.js`, `Dashboard.jsx`.
**Interfaces:** `extractCandidates(text, known: Set<string>, {limit=60}) -> [{word, count, sentence}]`.
- [ ] Test: bỏ stopword, số, từ < 3 chữ, từ đã biết (kể cả dạng `-s/-ed/-ing`), đếm tần suất, kèm câu ví dụ.

### Task 7: Chấm phát âm (mục 8)
**Files:** Create `frontend/src/features/speech/pronunciation.js` (+test), `SpeakMode.jsx`.
**Interfaces:** `judge(target, alternatives[]) -> {ok, issue: 'final-s'|'final-ed'|null, heard}`; `endingLesson(word) -> {ending, sound, rule}`.
- [ ] Test: `judge('cats',['cat'])` → issue final-s; `judge('worked',['work'])` → final-ed; `endingLesson('wanted').sound==='/ɪd/'`, `'played'→'/d/'`, `'watches'→'/ɪz/'`.
- [ ] Sai âm cuối → bắt buộc xem bài âm cuối rồi nói lại đến khi đúng (bỏ qua sau 3 lần).

### Task 8: PWA + nhắc học (mục 9)
**Files:** Create `frontend/public/manifest.webmanifest`, `public/sw.js`, `public/icon-192.png`, `public/icon-512.png`, `frontend/src/utils/pwa.js` (+test); Modify `index.html`, `main.jsx`, `SettingsPage.jsx`.
**Interfaces:** `msUntilReminder(now: Date, hour: number) -> number`.

### Task 9: Test trình độ đầu vào (mục 10)
**Files:** Create `frontend/src/features/placement/placement.js` (+test), `PlacementTest.jsx`; Modify `Dashboard.jsx`, `DashboardHome.jsx`, `backend/app/routes/profile.py`.
**Interfaces:** `initPlacement()`, `answerPlacement(state, correct)`, `placementResult(state) -> {level, stageIndex}`; profile nhận `level_source:'test'` → ghi `level_tested_at`.
- [ ] Test: 3 câu/mức, đúng ≥2 lên mức tiếp, dừng khi trượt; đúng hết → IELTS.

### Task 10: Bảng xếp hạng bạn bè (mục 11)
**Files:** Create `backend/app/models/friendships.py`, `backend/app/routes/friends.py`, `backend/app/utils/leaderboard.py` (+test), `frontend/src/features/friends/LeaderboardPage.jsx`; Modify routes `__init__`, `app/__init__`, `api/client.js`.
**Interfaces:** `week_start(now_vn) -> datetime` (thứ Hai 00:00); `points(learned, reviewed) = learned*10 + reviewed*5`; `rank(rows)`.

### Task 11: Kiểm chứng & bàn giao
- [ ] `npm test` 0 fail; pytest thuần (runner bỏ qua `app/__init__`); kiểm tra import tương đối; Playwright chế độ sáng; zip.
