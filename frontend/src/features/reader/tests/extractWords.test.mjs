import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCandidates, baseForms } from '../extractWords.js';

const text = 'The government announced new policies. Policies on climate change were debated. In 2024, 3 experts said the economy grows.';

test('extractCandidates: bỏ stopword, số, từ ngắn', () => {
  const out = extractCandidates(text, new Set()).map((x) => x.word);
  assert.ok(!out.includes('the') && !out.includes('on') && !out.includes('2024') && !out.includes('in'));
  assert.ok(out.includes('government'));
});
test('extractCandidates: gộp dạng số nhiều và đếm tần suất, kèm câu', () => {
  const out = extractCandidates(text, new Set());
  const p = out.find((x) => x.word === 'policy');
  assert.ok(p, 'policies -> policy');
  assert.equal(p.count, 2);
  assert.match(p.sentence, /policies/i);
  assert.equal(out[0].word, 'policy');           // xuất hiện nhiều nhất lên đầu
});
test('extractCandidates: bỏ từ đã biết kể cả dạng -s/-ed/-ing', () => {
  const out = extractCandidates(text, new Set(['announce', 'grow', 'expert'])).map((x) => x.word);
  assert.ok(!out.includes('announce') && !out.includes('announced'));
  assert.ok(!out.includes('grow') && !out.includes('grows') && !out.includes('expert'));
});
test('extractCandidates: giới hạn số lượng, văn bản rỗng', () => {
  assert.equal(extractCandidates(text, new Set(), { limit: 2 }).length, 2);
  assert.deepEqual(extractCandidates('', new Set()), []);
});
test('baseForms: đoán dạng gốc', () => {
  assert.ok(baseForms('studies').includes('study'));
  assert.ok(baseForms('debated').includes('debate'));
  assert.ok(baseForms('running').includes('run'));
});
