import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFolderWords, describePool } from '../flappyPool.js';

const mkRaw = (n, from = 1, extra = {}) => Array.from({ length: n }, (_, i) => ({ id: from + i, word: `w${from + i}`, meaning: `nghia${from + i}`, difficulty: 1, level: 1, ...extra }));
const mk = (n) => mkRaw(n).map((w) => ({ ...w, lv: w.level }));

/** Giả API phân trang theo `limit`; ghi lại các trang đã gọi. */
function pager(all) {
  const calls = [];
  const fetchPage = async (page, limit) => {
    calls.push({ page, limit });
    const words = all.slice((page - 1) * limit, page * limit);
    return { words, pagination: { page, limit, total: all.length, has_more: page * limit < all.length } };
  };
  return { fetchPage, calls };
}

test('loadFolderWords duyệt mọi trang (230 từ -> 3 trang limit 100)', async () => {
  const { fetchPage, calls } = pager(mkRaw(230));
  const out = await loadFolderWords(1, fetchPage, { includeUnlearned: true });
  assert.equal(out.length, 230);
  assert.deepEqual(calls.map((c) => c.page), [1, 2, 3]);
  assert.ok(calls.every((c) => c.limit === 100));
});

test('loadFolderWords lọc level >= 1 khi tắt công tắc, giữ tất cả khi bật', async () => {
  const all = [...mkRaw(3, 1, { level: 0 }), ...mkRaw(4, 10, { level: 2 })];
  assert.equal((await loadFolderWords(1, pager(all).fetchPage, { includeUnlearned: false })).length, 4);
  assert.equal((await loadFolderWords(1, pager(all).fetchPage, { includeUnlearned: true })).length, 7);
});

test('loadFolderWords: thư mục rỗng -> []; trang rỗng dù has_more=true không lặp vô hạn', async () => {
  assert.deepEqual(await loadFolderWords(1, pager([]).fetchPage, { includeUnlearned: true }), []);
  let n = 0;
  const stuck = async () => { n++; return { words: [], pagination: { has_more: true } }; };
  assert.deepEqual(await loadFolderWords(1, stuck, { includeUnlearned: true }), []);
  assert.equal(n, 1);
});

test('loadFolderWords bỏ từ trùng và từ thiếu nghĩa', async () => {
  const all = [...mkRaw(4), { id: 99, word: 'w1', meaning: 'x', level: 1 }, { id: 100, word: 'zzz', meaning: '', level: 1 }];
  assert.equal((await loadFolderWords(1, pager(all).fetchPage, { includeUnlearned: true })).length, 4);
});

test('describePool: 5 từ bậc 1 -> maxScore 70, chơi được, có ghi chú', () => {
  const d = describePool(mk(5));
  assert.deepEqual([d.count, d.maxScore, d.playable], [5, 70, true]);
  assert.equal(d.note, 'Thư mục này chỉ có 5 từ nên điểm tối đa là 70.');
});

test('describePool: 3 từ -> không chơi được; từ trùng/thiếu nghĩa bị loại', () => {
  const d = describePool(mk(3));
  assert.equal(d.playable, false);
  assert.equal(d.note, 'Cần ít nhất 4 từ để chơi.');
  assert.equal(describePool([...mk(4), { id: 9, word: 'w1', meaning: 'x' }, { id: 8, word: 'q', meaning: ' ' }]).count, 4);
});

test('describePool: trên 200 từ chỉ tính điểm tối đa cho 200 từ và ghi chú rõ', () => {
  const d = describePool(mk(250));
  assert.equal(d.count, 250);
  assert.equal(d.maxScore, describePool(mk(200)).maxScore);
  assert.match(d.note, /tối đa 200 từ/);
});

test('describePool: nguồn kho từ đã học dùng câu "Kho từ của bạn"', () => {
  assert.equal(describePool(mk(5), 'learned').note, 'Kho từ của bạn chỉ có 5 từ nên điểm tối đa là 70.');
});
