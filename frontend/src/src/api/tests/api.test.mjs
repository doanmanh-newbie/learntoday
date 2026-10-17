// Chạy:  node --test src/api/tests/        (Node >= 20, không cần cài thêm gì)
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// ---- giả lập môi trường trình duyệt TRƯỚC khi import module ----
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = new EventTarget();
globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
store.set('access_token', `${b64({ alg: 'HS256' })}.${b64({ user_id: 'u1' })}.sig`);
store.set('refresh_token', 'rt-1');

let calls = [];
let handler = async () => ({ status: 200, body: {} });
globalThis.fetch = async (url, opts = {}) => {
  calls.push({ url: String(url), method: opts.method || 'GET', headers: opts.headers || {} });
  const { status, body } = await handler(String(url), opts);
  return { ok: status >= 200 && status < 300, status, json: async () => body };
};

const { toUiWord, blankWord, shortPos } = await import('../adapters.js');
const { apiRequest, ApiError } = await import('../client.js');
const { enqueueProgress, flushOutbox, getSyncSnapshot } = await import('../outbox.js');

const waitFor = async (cond, ms = 1000) => {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error('hết thời gian chờ điều kiện');
    await new Promise((r) => setImmediate(r));   // không dùng setTimeout vì có test giả lập timer
  }
};
const reset = () => { calls = []; };

// ───────────────────────── adapters ─────────────────────────
test('blankWord che từ (kể cả biến thể -s/-ed/-ing) và KHÔNG che từ khác', () => {
  assert.equal(blankWord('My luggage is ready.', 'luggage'), 'My ___ is ready.');
  assert.equal(blankWord('They negotiated a price.', 'negotiate'), 'They ___ a price.');   // negotiate + d
  assert.equal(blankWord('He is simmering soup.', 'simmer'), 'He is ___ soup.');          // simmer + ing
  assert.equal(blankWord('Cloud storage is cheap.', 'cloud'), '___ storage is cheap.');   // không phân biệt hoa/thường
  assert.equal(blankWord('The sky is cloudy.', 'cloud'), null);                           // "cloudy" là từ khác
  assert.equal(blankWord('He is running.', 'run'), null);                                 // biến thể bất quy tắc: không đoán mò -> dùng ví dụ dự phòng
  assert.equal(blankWord('', 'x'), null);
});

test('toUiWord: ví dụ luôn bị che từ, không lộ đáp án; có dự phòng khi không có ví dụ', () => {
  const w = toUiWord({ id: 'a', word: 'passport', pronunciation: '/p/', word_type: 'noun', meaning: 'hộ chiếu',
                       example: 'Bring your passport.', example_meaning: 'Mang theo hộ chiếu.', level: 2 });
  assert.equal(w.examples[0].en, 'Bring your ___.');
  assert.equal(w.examples[0].vi, 'Mang theo hộ chiếu.');
  assert.equal(w.example, 'Bring your passport.');            // câu gốc vẫn còn (dùng cho form sửa từ)
  assert.equal(w.pos, 'n');
  assert.equal(w.lv, 2);

  const noEx = toUiWord({ id: 'b', word: 'gravity', meaning: 'trọng lực' });
  assert.equal(noEx.examples[0].en, '___');
  assert.equal(noEx.examples[0].vi, 'trọng lực');
  assert.equal(noEx.lv, 0);
});

test('toUiWord: bản dịch ví dụ trùng câu tiếng Anh (dữ liệu crawl lỗi) không bị hiển thị là tiếng Việt', () => {
  const w = toUiWord({ id: 'c', word: 'recipe', meaning: 'công thức', example: 'A recipe for success.', example_meaning: 'A recipe for success.' });
  assert.equal(w.examples[0].vi, '');
});

test('shortPos', () => {
  assert.deepEqual(['noun', 'verb', 'adjective', 'adverb', null].map(shortPos), ['n', 'v', 'adj', 'adv', 'n']);
});

// ───────────────────────── apiRequest ─────────────────────────
test('đăng nhập sai mật khẩu (401) KHÔNG bị coi là hết phiên: không refresh, không phát auth:expired', async () => {
  reset();
  let expired = 0;
  window.addEventListener('auth:expired', () => { expired++; });
  handler = async () => ({ status: 401, body: { message: 'Email hoặc mật khẩu không đúng!' } });
  await assert.rejects(() => apiRequest('/api/auth/login', { method: 'POST', body: '{}' }), (e) => {
    assert.ok(e instanceof ApiError);
    assert.equal(e.status, 401);
    assert.equal(e.message, 'Email hoặc mật khẩu không đúng!');
    return true;
  });
  assert.equal(calls.length, 1);
  assert.equal(expired, 0);
  assert.ok(localStorage.getItem('access_token'), 'token không bị xóa');
});

test('401 ở API thường: refresh 1 lần rồi gọi lại với token mới', async () => {
  reset();
  let n = 0;
  handler = async (url) => {
    if (url.endsWith('/api/auth/refresh-token')) return { status: 200, body: { access_token: 'NEW' } };
    return ++n === 1 ? { status: 401, body: { message: 'hết hạn' } } : { status: 200, body: { ok: true } };
  };
  const data = await apiRequest('/api/review/due-count');
  assert.deepEqual(data, { ok: true });
  assert.equal(calls.length, 3);
  assert.equal(calls[2].headers.Authorization, 'Bearer NEW');
});

test('nhiều request cùng gặp 401 chỉ gọi refresh ĐÚNG 1 lần', async () => {
  reset();
  store.set('access_token', `${b64({})}.${b64({ user_id: 'u1' })}.sig`);
  const seen = new Set();
  handler = async (url, opts) => {
    if (url.endsWith('/api/auth/refresh-token')) { await new Promise((r) => setTimeout(r, 20)); return { status: 200, body: { access_token: 'NEW2' } }; }
    const auth = opts.headers?.Authorization;
    if (auth === 'Bearer NEW2') return { status: 200, body: { ok: true } };
    seen.add(url);
    return { status: 401, body: {} };
  };
  await Promise.all([apiRequest('/api/a'), apiRequest('/api/b'), apiRequest('/api/c')]);
  assert.equal(calls.filter((c) => c.url.endsWith('/api/auth/refresh-token')).length, 1);
});

test('refresh token hỏng -> phát auth:expired và ném SESSION_EXPIRED; mất mạng thì KHÔNG đăng xuất', async () => {
  reset();
  store.set('refresh_token', 'bad');
  let expired = 0;
  const onExp = () => { expired++; };
  window.addEventListener('auth:expired', onExp);
  handler = async (url) => (url.endsWith('/api/auth/refresh-token') ? { status: 401, body: {} } : { status: 401, body: {} });
  await assert.rejects(() => apiRequest('/api/x'), (e) => e.code === 'SESSION_EXPIRED');
  assert.equal(expired, 1);

  // mất mạng khi refresh: giữ nguyên token
  store.set('access_token', `${b64({})}.${b64({ user_id: 'u1' })}.sig`);
  store.set('refresh_token', 'rt-2');
  const realFetch = globalThis.fetch;
  let first = true;
  globalThis.fetch = async (url, opts) => {
    if (String(url).endsWith('/api/auth/refresh-token')) throw new TypeError('Failed to fetch');
    if (first) { first = false; return { ok: false, status: 401, json: async () => ({}) }; }
    return realFetch(url, opts);
  };
  await assert.rejects(() => apiRequest('/api/y'), (e) => e.retryable === true && e.code === 'NETWORK');
  assert.ok(localStorage.getItem('refresh_token'), 'không xóa token khi chỉ là lỗi mạng');
  globalThis.fetch = realFetch;
  window.removeEventListener('auth:expired', onExp);
});

test('mất mạng / DB sập trả ApiError có retryable', async () => {
  reset();
  store.set('access_token', `${b64({})}.${b64({ user_id: 'u1' })}.sig`);
  handler = async () => ({ status: 503, body: { message: 'Không kết nối được cơ sở dữ liệu', code: 'DB_UNAVAILABLE' } });
  await assert.rejects(() => apiRequest('/api/folders'), (e) => e.status === 503 && e.code === 'DB_UNAVAILABLE' && e.retryable);
  handler = async () => ({ status: 200, body: {} });
});

// ───────────────────────── outbox ─────────────────────────
test('outbox: gửi thành công thì hàng đợi rỗng và gọi đúng endpoint', async () => {
  reset();
  handler = async () => ({ status: 200, body: {} });
  enqueueProgress('learn', 'w1');
  await waitFor(() => getSyncSnapshot().pending === 0);
  assert.ok(calls.some((c) => c.url.includes('/api/words/w1/complete-learn') && c.method === 'POST'));
});

test('outbox: 409 (đã ghi nhận) coi như thành công', async () => {
  reset();
  handler = async () => ({ status: 409, body: { message: 'Từ này đã được học rồi!' } });
  enqueueProgress('learn', 'w2');
  await waitFor(() => getSyncSnapshot().pending === 0);
});

test('outbox: lỗi 400 vĩnh viễn bị bỏ, không kẹt hàng đợi', async () => {
  reset();
  handler = async () => ({ status: 400, body: { message: 'sai' } });
  enqueueProgress('review', 'w3', { wrong_count: 0 });
  await waitFor(() => getSyncSnapshot().pending === 0);
});

test('outbox: DB/mạng lỗi -> GIỮ trong hàng đợi (bền qua F5), giữ thứ tự, gửi lại được khi hết lỗi', async () => {
  reset();
  mock.timers.enable({ apis: ['setTimeout'] });                      // chặn tự thử lại để test xác định
  try {
    handler = async () => ({ status: 503, body: { message: 'DB bận', code: 'DB_UNAVAILABLE' } });
    enqueueProgress('learn', 'w4');
    enqueueProgress('review', 'w5', { wrong_count: 1 });
    await waitFor(() => getSyncSnapshot().lastError !== '');
    const snap = getSyncSnapshot();
    assert.equal(snap.pending, 2);
    assert.equal(snap.lastError, 'DB bận');
    assert.equal(calls.filter((c) => c.url.includes('/api/words/')).length, 1, 'dừng ở mục đầu để giữ thứ tự');
    const persisted = JSON.parse(localStorage.getItem('lt_outbox_v1'));
    assert.deepEqual(persisted.map((e) => e.wordId), ['w4', 'w5']);

    // hết lỗi -> gửi nốt theo đúng thứ tự
    calls = [];
    handler = async () => ({ status: 200, body: {} });
    await flushOutbox();
    assert.equal(getSyncSnapshot().pending, 0);
    assert.deepEqual(calls.filter((c) => c.url.includes('/api/words/')).map((c) => c.url.split('/api/words/')[1]),
      ['w4/complete-learn', 'w5/complete-review']);
  } finally {
    mock.timers.reset();
  }
});

test('outbox: loại tiến độ không hợp lệ bị từ chối ngay', () => {
  assert.throws(() => enqueueProgress('xoa-het', 'w1'), /không hợp lệ/);
});
