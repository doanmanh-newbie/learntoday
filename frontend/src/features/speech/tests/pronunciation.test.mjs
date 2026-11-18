import test from 'node:test';
import assert from 'node:assert/strict';
import { judge, endingLesson } from '../pronunciation.js';

test('judge: đúng khi một phương án nhận dạng khớp', () => {
  assert.equal(judge('apple', ['Apple.']).ok, true);
  assert.equal(judge('apple', ['a pole', 'apple']).ok, true);
});
test('judge: thiếu âm cuối -s', () => {
  const r = judge('cats', ['cat']);
  assert.equal(r.ok, false);
  assert.equal(r.issue, 'final-s');
  assert.equal(judge('watches', ['watch']).issue, 'final-s');
});
test('judge: thiếu âm cuối -ed', () => {
  assert.equal(judge('worked', ['work']).issue, 'final-ed');
  assert.equal(judge('wanted', ['want']).issue, 'final-ed');
});
test('judge: sai hẳn -> issue null; không nghe được gì', () => {
  const r = judge('house', ['mouse']);
  assert.equal(r.ok, false);
  assert.equal(r.issue, null);
  assert.equal(judge('house', []).heard, '');
});
test('endingLesson: quy tắc /s/ /z/ /ɪz/', () => {
  assert.equal(endingLesson('cats').sound, '/s/');
  assert.equal(endingLesson('dogs').sound, '/z/');
  assert.equal(endingLesson('watches').sound, '/ɪz/');
});
test('endingLesson: quy tắc /t/ /d/ /ɪd/', () => {
  assert.equal(endingLesson('worked').sound, '/t/');
  assert.equal(endingLesson('played').sound, '/d/');
  assert.equal(endingLesson('wanted').sound, '/ɪd/');
  assert.equal(endingLesson('apple'), null);
});
