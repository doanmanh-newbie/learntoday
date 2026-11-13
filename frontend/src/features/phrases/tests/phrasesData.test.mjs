import test from 'node:test';
import assert from 'node:assert/strict';
import { PHRASE_GROUPS, groupById, phraseIdFromFolderId, toPracticeWords } from '../phrasesData.js';

test('dữ liệu cụm từ đầy đủ, không trùng', () => {
  assert.equal(PHRASE_GROUPS.length, 4);
  const seen = new Set();
  for (const gr of PHRASE_GROUPS) {
    assert.ok(gr.phrases.length >= 10);
    for (const p of gr.phrases) {
      assert.ok(p.phrase && p.meaning && p.en && p.vi, `thiếu dữ liệu: ${p.phrase}`);
      assert.ok(!seen.has(p.phrase), `trùng: ${p.phrase}`);
      seen.add(p.phrase);
    }
  }
});
test('phraseIdFromFolderId / groupById', () => {
  assert.equal(phraseIdFromFolderId('phrase-pf1'), 'pf1');
  assert.equal(phraseIdFromFolderId('b8e00121-1f6c'), null);
  assert.equal(groupById('pf2').name, 'Thành ngữ thông dụng');
  assert.equal(groupById('xx'), null);
});
test('toPracticeWords: mỗi từ có id duy nhất và nghĩa', () => {
  const words = toPracticeWords(PHRASE_GROUPS[0]);
  assert.equal(new Set(words.map((w) => w.id)).size, words.length);
  assert.ok(words.every((w) => w.word && w.meaning));
  const w = words.find((x) => x.word === 'take the lead');
  assert.ok(w.examples[0].en.includes('___'));
});
