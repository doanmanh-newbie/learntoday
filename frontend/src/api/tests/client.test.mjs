// Kiểm tra luồng đăng nhập của api/client.js: Access Token chỉ ở bộ nhớ, Refresh Token ở cookie HttpOnly (client chỉ
// gửi cookie bằng credentials:'include' + header chống CSRF). Chạy:  npm test   (hoặc: node --test src/api/tests)
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

class MemoryStorage {
  constructor(initial = {}) { this.map = new Map(Object.entries(initial)); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  get keys() { return [...this.map.keys()]; }
}

let calls;      // mọi lần gọi fetch: { url, init }
let script;     // hàm trả về Response giả theo từng request
let loadCount = 0;

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

async function freshClient(storageInit = {}) {
  globalThis.localStorage = new MemoryStorage(storageInit);
  globalThis.window = new EventTarget();
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return script(url, init, calls);
  };
  return import(`../client.js?load=${++loadCount}`);          // bản mới của module (trạng thái trong bộ nhớ trống) như vừa tải lại trang
}

const auth = (call) => call.init.headers?.Authorization;
const events = (name) => { const seen = []; window.addEventListener(name, () => seen.push(name)); return seen; };

describe('lưu token', () => {
  beforeEach(() => { script = () => json(200, {}); });

  it('xóa access_token/refresh_token kiểu cũ còn sót trong localStorage', async () => {
    await freshClient({ access_token: 'old-a', refresh_token: 'old-r', other: 'giữ' });
    assert.deepEqual(localStorage.keys, ['other']);
  });

  it('Access Token chỉ ở bộ nhớ; localStorage chỉ có cờ has_session', async () => {
    const c = await freshClient();
    const seen = events('auth:session');
    c.setAccessToken('AT-1');
    assert.equal(c.getAccessToken(), 'AT-1');
    assert.deepEqual(localStorage.keys, ['has_session']);
    assert.ok(![...localStorage.map.values()].some((v) => v.includes('AT-1')));
    assert.equal(seen.length, 1);                              // để outbox gửi nốt tiến độ còn kẹt
    c.clearSession();
    assert.equal(c.getAccessToken(), null);
    assert.deepEqual(localStorage.keys, []);
    assert.equal(c.hasSession(), false);
  });

  it('tải lại trang: còn cờ thì hasSession() đúng nhưng chưa có Access Token', async () => {
    const c = await freshClient({ has_session: '1' });
    assert.equal(c.hasSession(), true);
    assert.equal(c.getAccessToken(), null);
  });
});

describe('gọi API và làm mới phiên bằng cookie', () => {
  it('mọi request đều gửi cookie (credentials include) và Bearer Access Token', async () => {
    script = () => json(200, { ok: true });
    const c = await freshClient();
    c.setAccessToken('AT-1');
    await c.apiRequest('/api/folders');
    assert.equal(calls[0].init.credentials, 'include');
    assert.equal(auth(calls[0]), 'Bearer AT-1');
    assert.equal(calls[0].url, '/api/folders');               // mặc định gọi cùng origin (qua proxy của Vite)
  });

  it('tải lại trang: 401 -> xin Access Token mới bằng cookie -> gửi lại request, người dùng không thấy gì', async () => {
    script = (url, init) => {
      if (url === '/api/auth/refresh-token') return json(200, { access_token: 'AT-NEW' });
      return init.headers.Authorization === 'Bearer AT-NEW' ? json(200, { user: { id: 'u1' } }) : json(401, { message: 'hết hạn' });
    };
    const c = await freshClient({ has_session: '1' });
    const data = await c.authApi.me();
    assert.deepEqual(data, { user: { id: 'u1' } });
    const refresh = calls.find((x) => x.url === '/api/auth/refresh-token');
    assert.equal(refresh.init.method, 'POST');
    assert.equal(refresh.init.credentials, 'include');
    assert.equal(refresh.init.headers['X-Requested-With'], 'fetch');       // chống CSRF
    assert.equal(refresh.init.body, '{}');                                   // KHÔNG gửi token trong body: token nằm ở cookie
    assert.equal(auth(refresh), undefined);
    assert.equal(c.getAccessToken(), 'AT-NEW');
    assert.deepEqual(calls.map((x) => x.url), ['/api/auth/me', '/api/auth/refresh-token', '/api/auth/me']);
  });

  it('nhiều request cùng 401 chỉ làm mới phiên MỘT lần', async () => {
    script = (url, init) => {
      if (url === '/api/auth/refresh-token') return json(200, { access_token: 'AT-NEW' });
      return init.headers.Authorization === 'Bearer AT-NEW' ? json(200, { url }) : json(401, {});
    };
    const c = await freshClient({ has_session: '1' });
    await Promise.all([c.apiRequest('/api/a'), c.apiRequest('/api/b'), c.apiRequest('/api/c')]);
    assert.equal(calls.filter((x) => x.url === '/api/auth/refresh-token').length, 1);
  });

  it('cookie hết hạn/bị thu hồi (401 khi refresh) -> xóa phiên + phát auth:expired', async () => {
    script = (url) => (url === '/api/auth/refresh-token' ? json(401, { message: 'hết hạn' }) : json(401, {}));
    const c = await freshClient({ has_session: '1' });
    const expired = events('auth:expired');
    await assert.rejects(c.apiRequest('/api/folders'), (e) => e.code === 'SESSION_EXPIRED' && e.status === 401);
    assert.equal(expired.length, 1);
    assert.equal(c.hasSession(), false);
    assert.deepEqual(localStorage.keys, []);
  });

  it('server/mạng lỗi tạm thời khi làm mới phiên: KHÔNG đăng xuất người dùng', async () => {
    for (const refreshReply of [() => json(503, {}), () => { throw new TypeError('network'); }]) {
      script = (url) => (url === '/api/auth/refresh-token' ? refreshReply() : json(401, {}));
      const c = await freshClient({ has_session: '1' });
      const expired = events('auth:expired');
      await assert.rejects(c.apiRequest('/api/folders'), (e) => e.code === 'NETWORK');
      assert.equal(expired.length, 0);
      assert.equal(c.hasSession(), true);
    }
  });

  it('chưa đăng nhập: 401 không gây gọi refresh', async () => {
    script = () => json(401, { message: 'cần đăng nhập' });
    const c = await freshClient();
    await assert.rejects(c.apiRequest('/api/folders'), (e) => e.status === 401);
    assert.ok(!calls.some((x) => x.url === '/api/auth/refresh-token'));
  });

  it('401 của đăng nhập sai KHÔNG bị coi là hết phiên', async () => {
    script = () => json(401, { message: 'Email hoặc mật khẩu không đúng!' });
    const c = await freshClient({ has_session: '1' });
    const expired = events('auth:expired');
    await assert.rejects(c.authApi.login('a@b.c', 'sai'), (e) => e.message.includes('mật khẩu'));
    assert.equal(expired.length, 0);
    assert.equal(calls.length, 1);
    assert.equal(auth(calls[0]), undefined);                  // endpoint đăng nhập không gửi Authorization
  });

  it('đăng xuất gọi server (xóa cookie) kèm header chống CSRF; không gửi token trong body', async () => {
    script = () => json(200, { message: 'ok' });
    const c = await freshClient();
    c.setAccessToken('AT-1');
    await c.authApi.logout();
    assert.equal(calls[0].url, '/api/auth/logout');
    assert.equal(calls[0].init.headers['X-Requested-With'], 'fetch');
    assert.equal(calls[0].init.body, '{}');
    assert.equal(calls[0].init.credentials, 'include');
  });

  it('quên/đặt lại mật khẩu: đúng đường dẫn, không kèm Authorization, 401 không làm văng phiên', async () => {
    script = (url) => (url.endsWith('reset-password') ? json(401, { message: 'Liên kết đã dùng' }) : json(200, { message: 'ok' }));
    const c = await freshClient({ has_session: '1' });
    const expired = events('auth:expired');
    await c.authApi.forgotPassword('a@b.c');
    assert.deepEqual(JSON.parse(calls[0].init.body), { email: 'a@b.c' });
    await assert.rejects(c.authApi.resetPassword('tok', 'matkhau-moi-1'), (e) => e.status === 401);
    assert.deepEqual(JSON.parse(calls[1].init.body), { reset_token: 'tok', new_password: 'matkhau-moi-1' });
    assert.equal(expired.length, 0);
    assert.ok(calls.every((x) => auth(x) === undefined));
  });
});
