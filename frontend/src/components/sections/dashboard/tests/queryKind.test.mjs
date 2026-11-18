import test from 'node:test';
import assert from 'node:assert/strict';
import { queryKind } from '../queryKind.js';

test('queryKind: từ/cụm tiếng Anh ngắn -> tra từ', () => {
  assert.equal(queryKind('network'), 'word');
  assert.equal(queryKind('  Look Up '), 'word');
  assert.equal(queryKind("don't give up"), 'word');
});
test('queryKind: tiếng Việt, câu, dấu câu, >3 từ -> dịch', () => {
  assert.equal(queryKind('xin chào'), 'translate');
  assert.equal(queryKind('I love my family.'), 'translate');
  assert.equal(queryKind('how are you doing today'), 'translate');
  assert.equal(queryKind('gia đình'), 'translate');
});
test('queryKind: rỗng', () => {
  assert.equal(queryKind('   '), 'empty');
  assert.equal(queryKind(null), 'empty');
});
test('queryKind: quá dài -> too-long', () => {
  assert.equal(queryKind('a '.repeat(600)), 'too-long');
});
