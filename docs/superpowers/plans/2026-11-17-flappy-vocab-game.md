# Chim bay chọn nghĩa v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến game Flappy học từ thành bài luyện bay liên tục theo bộ từ tự chọn, hai chiều hỏi, điểm theo bậc từ do server tính và bảng xếp hạng toàn bộ người dùng.

**Architecture:** Logic game thuần (`flappyLogic.js`) viết lại thành dòng chơi liên tục và sinh ra nhật ký từng câu. Trình duyệt gửi nhật ký lên `POST /api/game/flappy/runs`; server tự chấm lại đáp án, tính điểm theo `words.difficulty` (bậc 1–4) rồi lưu vào bảng `game_runs`. Bảng xếp hạng đọc từ `game_runs` (một ván tốt nhất mỗi người, theo tuần và mọi thời gian).

**Tech Stack:** Flask + SQLAlchemy + Alembic, unittest (`python -m unittest discover -s tests`), React + canvas, `node --test` qua `npm test`.

**Spec:** [docs/superpowers/specs/2026-11-17-flappy-vocab-game-design.md](../specs/2026-11-17-flappy-vocab-game-design.md)

## Global Constraints

- Mỗi từ xuất hiện đúng **một lần** mỗi ván; không lặp từ để cho đủ. Tối thiểu `MIN_WORDS = 4` từ để chơi.
- Hai chiều hỏi ngẫu nhiên: `en_vi` (hiện từ, chọn nghĩa) và `vi_en` (hiện nghĩa, chọn từ); đáp án nhiễu dùng `meaningChoices` / `wordChoices` ở `frontend/src/features/learning/quizChoices.js`.
- Bảng điểm cơ bản theo bậc: bậc 1 = 10, bậc 2 = 13, bậc 3 = 16, bậc 4 = 20. Thưởng chuỗi: +2 cho mỗi câu đúng liên tiếp sau câu đầu, tối đa +10. Sai: chuỗi về 0 và mất 1 mạng; tối đa `LIVES = 3`.
- Bậc từ lấy từ `words.difficulty`; không có trong danh sách nào thì bậc 1. Ánh xạ: A1/A2 → 1, B1 → 2, B2 → 3, có trong NAWL mà chưa ở A1–B2 → 4.
- Điểm do **server** tính; client không bao giờ gửi điểm.
- Bảng xếp hạng: hai kỳ `week` (từ thứ Hai 00:00 giờ VN, dùng `week_start_utc`) và `all`; xếp theo điểm một ván tốt nhất; hiển thị `username` công khai.
- Hằng số nhịp chơi: `SPEED_START = 90`, `SPEED_STEP = 4`, `SPEED_MAX = 150` (px/s); `GAP_PX = 520`; server `MIN_ANSWER_GAP_MS = 2500`, `MAX_ANSWERS = 200`, `MAX_RUNS_PER_DAY = 30`.
- Không sửa bảng bạn bè (`routes/friends.py`, `utils/leaderboard.py`) và không ghi kết quả game vào SRS.
- Repo đang có nhiều thay đổi chưa commit; chỉ `git add` các file của task, không revert thay đổi khác.

## Review Focus

- Chuỗi tiếng Việt có dấu mã hóa khác nhau (NFC/NFD) hoặc hoa/thường: server vẫn chấm đúng (Task 1).
- Từ có `difficulty` rỗng hoặc ngoài 1–4: coi là bậc 1, không lỗi (Task 1).
- Gửi nhật ký có từ của người khác, từ trong thư mục cá nhân của người khác, từ lặp, hoặc tiếp tục trả lời sau mạng thứ ba: bị từ chối (Task 3).
- Người chơi nằm ngoài top: vẫn thấy hạng của chính mình (Task 3).
- Thư mục nhiều hơn 100 từ, thư mục rỗng/dưới 4 từ, hoặc tab bị treo giữa ván (`dt` rất lớn) không làm hỏng ván (Tasks 4, 5).

---

### Task 1: Chấm điểm phía server (hàm thuần)

**Files:**
- Create: `backend/app/utils/game_score.py`
- Create: `backend/tests/test_game_score.py`

**Interfaces:**
- Produces:
  - `TIER_POINTS = {1: 10, 2: 13, 3: 16, 4: 20}`, `LIVES = 3`, `MIN_ANSWER_GAP_MS = 2500`, `MAX_ANSWERS = 200`
  - `tier_of(difficulty: int | None) -> int` (kẹp về 1..4, `None`/lạ → 1)
  - `points_for(tier: int, streak: int) -> int` (`streak` là độ dài chuỗi đúng **sau** câu này, ≥ 1)
  - `max_score(tiers: list[int]) -> int` (tất cả đúng; không phụ thuộc thứ tự)
  - `class RunError(ValueError)` với thuộc tính `.message` (tiếng Việt)
  - `score_run(answers: list[dict], words: dict[str, "WordLike"]) -> dict` trả `{'score': int, 'correct': int, 'answered': int}`. Mỗi `answer` có `word_id: str`, `dir: 'en_vi'|'vi_en'`, `choice: str`, `t_ms: int`. `WordLike` có `.word`, `.meaning`, `.difficulty`.

- [ ] **Step 1: Write the failing tests** trong `backend/tests/test_game_score.py` (unittest thuần, không cần DB):
  - `test_points_for_tiers_and_streak_cap`: `points_for(1,1)==10`, `points_for(1,2)==12`, `points_for(1,6)==20`, `points_for(1,50)==20`, `points_for(4,1)==20`, `points_for(4,6)==30`.
  - `test_max_score_five_tier1_words_is_70`: `max_score([1]*5) == 70`; `max_score([4]) == 20`.
  - `test_tier_of_clamps_and_defaults`: `tier_of(None)==1`, `tier_of(0)==1`, `tier_of(9)==4`, `tier_of(3)==3`.
  - `test_score_run_marks_correct_by_direction`: với `en_vi` đúng khi `choice` khớp `word.meaning`, với `vi_en` đúng khi khớp `word.word`; điểm cộng theo bậc của từng từ và chuỗi; sai đặt chuỗi về 0.
  - `test_score_run_unicode_and_case_insensitive`: choice `'LỊCH TRÌNH'` và dạng NFD của `'lịch trình'` đều đúng với meaning `'lịch trình'`.
  - `test_score_run_rejects`: mỗi trường hợp ném `RunError`: từ lạ (không có trong `words`), `word_id` lặp, `t_ms` không tăng dần, khoảng cách < `MIN_ANSWER_GAP_MS` (kể cả câu đầu tính từ 0), quá `MAX_ANSWERS`, còn trả lời sau khi đã sai đủ `LIVES`, `dir` không hợp lệ, danh sách rỗng.
- [ ] **Step 2: Run to verify it fails:** `cd backend && python -m unittest tests.test_game_score -v` → FAIL (`ModuleNotFoundError`).
- [ ] **Step 3: Implement** các hàm trên trong `backend/app/utils/game_score.py`. Chuẩn hóa so sánh: `unicodedata.normalize('NFC', s).lower()` rồi gộp khoảng trắng (cùng quy tắc `normalizeText` ở `quizChoices.js`).
- [ ] **Step 4: Run tests** → PASS.
- [ ] **Step 5: Commit:** `git add backend/app/utils/game_score.py backend/tests/test_game_score.py && git commit -m "feat(game): server-side flappy scoring"`

### Task 2: Bậc từ (CEFR/NAWL) và điền `words.difficulty`

**Files:**
- Create: `backend/app/utils/word_level.py`
- Create: `backend/data/wordlists/cefr_levels.csv` (cột `word,level`, level ∈ A1, A2, B1, B2), `backend/data/wordlists/nawl.txt` (mỗi dòng một từ)
- Create: `backend/scripts/backfill_difficulty.py`
- Create: `backend/tests/test_word_level.py`
- Modify: các chỗ tạo `Word(...)` đang gán `difficulty=1`: `backend/seed.py:104`, `backend/app/services/lexicon_service.py:357`, `backend/app/routes/translate.py:111`, `backend/scripts/import_dict.py:190`, để dùng `tier_for_word(word)`.
- Create (credits): mục ghi nguồn trong `docs/NOI_DUNG.md` hoặc trang giới thiệu của app (người thực hiện chọn nơi có sẵn), đúng yêu cầu giấy phép.

**Interfaces:**
- Produces:
  - `tier_for(word: str, cefr: dict[str, str], nawl: set[str]) -> int` (thuần; ánh xạ theo Global Constraints, không phân biệt hoa/thường, không tìm thấy → 1)
  - `tier_for_word(word: str) -> int` (nạp hai file dữ liệu một lần và gọi `tier_for`)
  - `scripts/backfill_difficulty.py`: cập nhật `words.difficulty` cho mọi từ chưa xóa; chạy hai lần cho kết quả giống nhau; in số từ theo bậc.

- [ ] **Step 1: Xác nhận giấy phép (chặn các bước sau).** Mở trang chính thức của CEFR-J Wordlist (cefr-j.org) và NAWL (newgeneralservicelist.org) để đọc điều khoản hiện hành. Chỉ tiếp tục nếu cả hai cho phép dùng thương mại kèm ghi nguồn (CC BY-SA 4.0 cho NAWL: kiểm tra việc chỉ lưu bậc suy ra, không phân phối lại danh sách, có thỏa điều kiện ShareAlike). Nếu không chắc, dừng và hỏi người dùng.
- [ ] **Step 2: Write the failing tests** `backend/tests/test_word_level.py`: `tier_for('abandon', {'abandon': 'B2'}, set()) == 3`; A1 và A2 → 1; B1 → 2; từ chỉ có trong `nawl` → 4; từ ở cả hai nguồn lấy theo CEFR (B2 → 3); `'ABANDON'` khớp `'abandon'`; từ lạ → 1; chuỗi rỗng → 1.
- [ ] **Step 3: Run** `python -m unittest tests.test_word_level -v` → FAIL.
- [ ] **Step 4: Implement** `word_level.py`; thêm hai file dữ liệu từ nguồn đã xác nhận ở Step 1.
- [ ] **Step 5: Implement** `scripts/backfill_difficulty.py` (dùng app context, cập nhật theo lô) và thay `difficulty=1` ở bốn chỗ tạo `Word` bằng `tier_for_word(<từ>)`.
- [ ] **Step 6: Verify:** chạy script hai lần trên DB dev; số từ theo bậc in ra giống nhau ở hai lần. Chạy `python -m unittest discover -s tests` → PASS.
- [ ] **Step 7: Commit** các file của task, kể cả mục ghi nguồn.

### Task 3: Bảng `game_runs`, API gửi ván và bảng xếp hạng

**Files:**
- Create: `backend/app/models/game_runs.py`, `backend/app/routes/game.py`, migration mới trong `backend/migrations/versions/` với `down_revision = 'a7b8c9d0e1f2'` (head hiện tại)
- Modify: `backend/app/models/__init__.py` (thêm `from .game_runs import GameRun`), `backend/app/routes/__init__.py` (thêm `from .game import bp as game_bp`), `backend/app/__init__.py:47-51` (đưa `game_bp` vào cả hai danh sách đăng ký)
- Test: `backend/tests/test_game_api.py`

**Interfaces:**
- Consumes: `score_run`, `RunError`, `max_score`, `tier_of`, `MAX_ANSWERS` từ Task 1; `week_start_utc`, `rank` ở `app/utils/leaderboard.py`; `VN_TZ` ở `app/models/learning_logs.py`.
- Produces:
  - Model `GameRun`: `id` (uuid str), `user_id` (FK), `game` (`'flappy'`), `score`, `answered`, `correct`, `duration_ms`, `folder_id` (null = kho từ đã học), `created_at` (UTC naive). Index `(game, created_at)` và `(user_id, created_at)`.
  - `POST /api/game/flappy/runs` body `{"answers": [{"word_id","dir","choice","t_ms"}], "folder_id": str|null}` → `201 {"score","correct","answered","max_score","rank_week","rank_all"}`; lỗi `400 {"message"}` (kể cả `RunError`), `403` (thư mục cá nhân của người khác), `429` (quá `MAX_RUNS_PER_DAY` ván/ngày giờ VN).
  - `GET /api/game/flappy/leaderboard?period=week|all` → `{"period", "rows": [{"rank","username","score","correct","is_me"}], "me": {"rank","score"} | null}`; `rows` tối đa 50; mặc định `week`; `period` lạ → 400.
  - Quyền dùng từ: từ phải chưa xóa và (người chơi đã học nó, tức `UserWord.level >= 1`) hoặc (`folder_id` được gửi, từ thuộc thư mục đó, và thư mục là hệ thống hoặc cá nhân của chính người chơi).

- [ ] **Step 1: Write the failing tests** `backend/tests/test_game_api.py` (dùng `ApiTestCase`, `seed_folder`, `register`): 3 từ `w0..w2` trong `f1`; học `w0` bằng `complete-learn` rồi đặt `UserWord.level=1`. Tests:
  - `test_submit_scores_on_server_ignoring_client_score`: gửi nhật ký đúng 1 từ đã học, kèm `"score": 9999` trong body → phản hồi `score == 10` (bậc 1).
  - `test_submit_with_folder_allows_unlearned_words`: gửi `folder_id='f1'` với `w1`,`w2` (chưa học) → 201; không gửi `folder_id` thì `w1` → 400.
  - `test_rejects_other_users_personal_folder` → 403; `test_rejects_duplicate_word_and_fast_answers_and_after_third_wrong` → 400 cho từng trường hợp.
  - `test_daily_run_limit` → ván thứ `MAX_RUNS_PER_DAY + 1` trả 429.
  - `test_leaderboard_week_and_all_best_run_only`: một người nộp hai ván (10 và 12 điểm) → chỉ một hàng với 12; ván tạo trước thứ Hai tuần này (đặt `created_at` thủ công) có trong `all` nhưng không có trong `week`.
  - `test_leaderboard_me_when_outside_top`: tạo hơn 50 người dùng điểm cao hơn → `rows` có 50 hàng không có `is_me`, `me` có hạng thật.
  - `test_leaderboard_requires_auth` → 401.
- [ ] **Step 2: Run** `python -m unittest tests.test_game_api -v` → FAIL.
- [ ] **Step 3: Implement** model, migration (`flask db migrate` rồi rà tay) và `routes/game.py`. Cùng điểm cùng hạng: truyền `points=score` vào `rank()`.
- [ ] **Step 4: Run** toàn bộ `python -m unittest discover -s tests` (gồm `test_migrations.py`: một head, schema khớp models) → PASS.
- [ ] **Step 5: Commit** các file của task.

### Task 4: Logic game thuần: dòng chơi liên tục

**Files:**
- Modify (viết lại): `frontend/src/features/practice/flappyLogic.js`
- Modify (viết lại): `frontend/src/features/practice/tests/flappyLogic.test.mjs`
- Modify: `frontend/src/api/adapters.js` (hàm `toUiWord`: thêm `difficulty: w.difficulty || 1`)

**Interfaces:**
- Consumes: `shuffle` (`utils/helpers`), `usableWords`, `meaningChoices`, `wordChoices`, `sameText` (`quizChoices.js`).
- Produces (xuất từ `flappyLogic.js`):
  - Hằng: `LIVES = 3`, `BIRD_R = 15`, `BIRD_X = 110`, `SPEED_START = 90`, `SPEED_STEP = 4`, `SPEED_MAX = 150`, `GAP_PX = 520`, `ENDING_S = 1.2`, `MIN_ANSWER_GAP_MS = 2500`, `TIER_POINTS`.
  - `pointsFor(tier, streak)`, `maxScore(words)` (cùng công thức server; `words[i].difficulty`).
  - `laneAt(y, lanes, h)`.
  - `buildQuestions(words, { distractorPool = words, random = Math.random }) -> Question[]`, mỗi từ đúng một câu; `Question = { word, dir: 'en_vi'|'vi_en', prompt: string, choices: string[], answerIndex: number }`; bỏ từ không đủ 2 lựa chọn.
  - `createGame(words, { world: { w, h } = { w: 640, h: 420 }, distractorPool, random }) -> Game`; `Game` có `questions`, `columns: [{ qi, x, colW, resolved, feedback: null | { picked, correctIndex, ok } }]`, `promptIndex` (câu chưa chốt đầu tiên, hoặc `questions.length` khi hết), `lives`, `score`, `streak`, `bestStreak`, `correct`, `answered`, `speed`, `phase: 'ready'|'playing'|'ending'|'over'`, `log: [{ word_id, dir, choice, t_ms }]`, `wrong: Question[]`.
  - `flap(g) -> boolean` (true nếu đổi phase), `tick(g, dt) -> Event[]` với `Event = { type: 'answer', ok, lane, points, question } | { type: 'over', reason: 'lives'|'done' }`.
  - `wrapText` giữ nguyên chữ ký hiện tại.

- [ ] **Step 1: Write the failing tests** (thay nội dung `flappyLogic.test.mjs`, giữ các test `laneAt`, `wrapText`, ready/trọng lực; cập nhật theo luật mới):
  - `buildQuestions`: mỗi từ đúng một câu, không lặp `word.id`; có cả hai `dir` khi `random` luân phiên; `en_vi` có `choices[answerIndex] === word.meaning`, `vi_en` có `choices[answerIndex] === word.word`; thư mục nhỏ hơn 4 từ nhưng `distractorPool` đủ thì mỗi câu vẫn có 4 ô; không đủ thì ít ô hơn nhưng không trùng nhau.
  - `test_column_keeps_flying_after_answer`: sau sự kiện `answer`, `bird.y` không bị đặt lại, cột vừa chốt vẫn còn trong `columns` với `feedback` và `x` tiếp tục giảm, `phase` vẫn `'playing'`, cột kế tiếp xuất hiện ở `x >= BIRD_X + BIRD_R + GAP_PX`.
  - `test_prompt_switches_when_previous_resolved`: ngay sau `answer`, `promptIndex === qi + 1`.
  - `test_speed_slower_and_capped`: `g.speed` khởi đầu `SPEED_START`, tăng `SPEED_STEP` mỗi câu đúng, không vượt `SPEED_MAX`.
  - `test_min_answer_gap_matches_server`: `GAP_PX / SPEED_MAX * 1000 >= MIN_ANSWER_GAP_MS`.
  - `test_scoring_uses_tier_and_streak`: từ bậc 3 đúng liên tiếp cho 16, 18, 20; sai → chuỗi 0, `lives - 1`, câu sai nằm trong `g.wrong`.
  - `test_max_score_matches_all_correct_run`: `maxScore` của 5 từ bậc 1 là 70 và bằng điểm một ván đúng hết.
  - `test_over_on_lives_or_done`: hết 3 mạng hoặc hết câu → `phase 'ending'` rồi sau `ENDING_S` có sự kiện `over` với `reason` tương ứng; sau `over`, `tick` trả `[]`.
  - `test_log_records_choice_text_and_time`: mỗi `answer` thêm một dòng `{ word_id, dir, choice, t_ms }` với `choice` là **chữ** của ô được chọn và `t_ms` tăng dần tính từ lần `flap` đầu.
  - `test_huge_dt_is_clamped`: `tick(g, 5)` không đưa chim ra ngoài khung và không bỏ qua một câu.
- [ ] **Step 2: Run** `cd frontend && npm test -- src/features/practice/tests/flappyLogic.test.mjs` (hoặc lệnh `node --import ./src/api/tests/register.mjs --test <file>`) → FAIL.
- [ ] **Step 3: Implement** theo Interfaces. Cột chốt đáp án khi `x <= BIRD_X + BIRD_R`, theo ô ngang tầm tâm chim (`laneAt`); không còn pha `feedback` đứng yên; `dt` kẹp 0.05 như hiện tại.
- [ ] **Step 4: Run** `npm test` toàn bộ → PASS (đồng thời sửa test khác nếu import tên cũ).
- [ ] **Step 5: Commit** các file của task.

### Task 5: Chọn bộ từ trước khi chơi

**Files:**
- Create: `frontend/src/features/practice/flappyPool.js` (logic thuần), `frontend/src/features/practice/FlappySetup.jsx`
- Test: `frontend/src/features/practice/tests/flappyPool.test.mjs`
- `PracticePage.jsx` giữ nguyên: chế độ vẫn nhận `words` đã học qua prop, việc chọn thư mục nằm trong `FlappySetup`.

**Interfaces:**
- Consumes: `maxScore`, `toUiWord`, `usableWords`, `MIN_WORDS`, `foldersApi.list()`, `foldersApi.words(id, { page, limit })`.
- Produces:
  - `loadFolderWords(folderId, fetchPage, { includeUnlearned }) -> Promise<Word[]>` duyệt **mọi trang** (`limit=100` cho tới khi `pagination.has_more` là false), chỉ giữ từ `level >= 1` khi `includeUnlearned` là false, rồi `usableWords`.
  - `describePool(words) -> { count, maxScore, playable: boolean, note: string }` với `playable = count >= MIN_WORDS`; `note` là câu thông báo cho người chơi, ví dụ `Thư mục này chỉ có 5 từ nên điểm tối đa là 70.`; dưới 4 từ: `Cần ít nhất 4 từ để chơi.`.
  - Component `FlappySetup({ learnedWords, onStart(pool: { words, folderId: string | null, distractorPool }) })`: nút nguồn "Kho từ đã học" (mặc định) và danh sách thư mục từ `foldersApi.list()`; công tắc "Gồm cả từ chưa học" chỉ hiện khi chọn thư mục, mặc định tắt; hiện `note` trước nút Chơi; nút Chơi bị khóa khi `playable` là false. `distractorPool` = từ đã học của người chơi (để đủ 4 ô khi thư mục nhỏ).

- [ ] **Step 1: Write the failing tests** cho `flappyPool.test.mjs`: `loadFolderWords` gọi trang 1, 2, 3 cho tới khi hết (thư mục 230 từ trả về 230 từ); lọc `level >= 1` khi tắt công tắc và giữ tất cả khi bật; thư mục rỗng → `[]`; `describePool` với 5 từ bậc 1 cho `maxScore 70` và `playable true`; 3 từ → `playable false`; từ trùng và từ thiếu nghĩa bị loại.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** hai file. **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Commit** các file của task.

### Task 6: Chế độ chơi: bay liên tục, ô đang chọn, từ sai, gửi điểm

**Files:**
- Modify (viết lại): `frontend/src/features/practice/FlappyMode.jsx`
- Modify: `frontend/src/api/client.js` (thêm `gameApi`)
- Test: `frontend/src/api/tests/api.test.mjs` (thêm ca cho `gameApi`)

**Interfaces:**
- Consumes: `createGame`, `tick`, `flap`, `maxScore` (Task 4); `FlappySetup` (Task 5); `ModeShell`, `RoundSummary`, `SpeakButton`; `saveBestIfBetter`, `readBest`.
- Produces: `gameApi = { submitFlappy: (answers, folderId) => POST /api/game/flappy/runs với { answers, folder_id }, leaderboard: (period) => GET /api/game/flappy/leaderboard?period= }` trong `client.js` (cùng kiểu với `friendsApi`).

- [ ] **Step 1: Write the failing test** trong `api.test.mjs`: `gameApi.submitFlappy([...], 'f1')` gửi `POST` đúng URL và body `{ answers, folder_id: 'f1' }` (không có trường `score`); `gameApi.leaderboard('week')` gọi đúng URL.
- [ ] **Step 2: Run** `npm test` → FAIL. **Step 3: Implement** `gameApi`.
- [ ] **Step 4: Rewrite `FlappyMode.jsx`:** hiện `FlappySetup` trước; sau `onStart` tạo game bằng `createGame(pool.words, { distractorPool: pool.distractorPool })`.
  - Phần đầu hiện `prompt` của `questions[promptIndex]` (chiều hỏi nào cũng đọc được; nút nghe chỉ hiện với từ tiếng Anh).
  - Vẽ mọi cột trong `g.columns`; cột đã chốt tô xanh/đỏ và tiếp tục trôi; ô ngang tầm chim sáng lên; thêm vạch ngắm đứt đoạn nối chim với cột đang tới.
  - Khi `over`: lưu kỷ lục cục bộ bằng `saveBestIfBetter('flappy', score)`, gọi `gameApi.submitFlappy(g.log, pool.folderId)`; thành công thì hiện hạng tuần/mọi thời gian; lỗi mạng thì hiện "Chưa lưu được vào bảng xếp hạng" và không thử lại.
  - Màn tổng kết: điểm, đúng/sai, chuỗi dài nhất, hạng, và **danh sách `g.wrong`** (từ, nghĩa, nút 🔊).
- [ ] **Step 5: Verify bằng tay trên trình duyệt** (`npm run dev`): chơi một ván thư mục 5 từ; cột chạm chim mà chim không bị đặt lại; mạng thứ ba kết thúc ván; mất mạng khi gửi → thấy thông báo, kỷ lục cục bộ vẫn lưu. Chụp màn hình để người dùng duyệt.
- [ ] **Step 6: Run** `npm test` → PASS. **Step 7: Commit** các file của task.

### Task 7: Giao diện bảng xếp hạng

**Files:**
- Create: `frontend/src/features/practice/FlappyLeaderboard.jsx`, `frontend/src/features/practice/tests/flappyLeaderboard.test.mjs` (hàm định dạng thuần)
- Modify: `frontend/src/features/practice/FlappySetup.jsx` (gắn tab "Xếp hạng" cạnh phần chọn bộ từ), `frontend/src/features/practice/FlappyMode.jsx` (nút "Xem bảng xếp hạng" ở màn tổng kết)

**Interfaces:**
- Consumes: `gameApi.leaderboard(period)` (Task 6).
- Produces: component `FlappyLeaderboard()` với hai tab "Tuần này" / "Mọi thời gian"; hàng của chính người chơi được tô nổi; nếu `me` không nằm trong `rows` thì hiện hàng riêng cuối bảng (`#hạng · điểm`); trạng thái tải, lỗi, và bảng trống ("Chưa có ván nào tuần này"). Hàm thuần `mergeMe(rows, me) -> Row[]` (đặt `me` ở cuối khi ngoài top, không trùng lặp khi đã có `is_me`).

- [ ] **Step 1: Write the failing test** cho `mergeMe`: `me` ngoài top → thêm một hàng cuối `is_me: true`; `me` đã trong `rows` → không thêm; `me` null → giữ nguyên.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `mergeMe` và component. **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Verify bằng tay:** hai tab chuyển được, hạng của chính mình hiện kể cả khi ngoài top. **Step 6: Commit.**

### Task 8: Làm lại nền, chim, màu và tối ưu điện thoại

**Files:**
- Modify: `frontend/src/features/practice/FlappyMode.jsx` (phần vẽ canvas), `frontend/src/features/practice/FlappySetup.jsx`, `frontend/src/features/practice/FlappyLeaderboard.jsx` (bố cục)
- Create nếu cần tách file: `frontend/src/features/practice/flappyDraw.js` (các hàm vẽ nền, chim, cột)

**Interfaces:**
- Consumes: `createGame(..., { world })` (Task 4). Chiều ngang < 520 px dùng world dọc `{ w: 360, h: 560 }`, ngược lại `{ w: 640, h: 420 }`; chọn một lần khi bắt đầu ván.
- Produces: cùng giao diện component `FlappyMode({ words, onExit })` như hiện tại.

- [ ] **Step 1: Trình bày hướng hình ảnh để người dùng duyệt trước khi tô vẽ chi tiết:** đề xuất giữ tông xanh ngọc tối của app, thêm lớp nền xa/gần cuộn chậm và chim mới đọc rõ ở cỡ nhỏ; chụp một ảnh thử rồi chờ phản hồi (đây là phần spec chưa chốt).
- [ ] **Step 2: Implement** nền, chim, bảng màu theo hướng đã duyệt; chữ trên canvas tối thiểu khoảng 14px khi hiển thị thực tế; điều khiển chạm một tay (chạm bất kỳ chỗ nào trong canvas); màn chọn bộ từ và bảng xếp hạng dùng tốt ở chiều dọc.
- [ ] **Step 3: Verify bằng tay** ở 375×812 và 1280×800: ván chơi được, chữ đọc được, không cuộn ngang. Chụp màn hình cả hai kích thước.
- [ ] **Step 4: Run** `npm test` và `npm run build` → PASS. **Step 5: Commit.**
