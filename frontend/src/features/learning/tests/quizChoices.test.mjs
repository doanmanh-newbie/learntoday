// Bài trắc nghiệm không được có 2 đáp án "đúng" hoặc 2 lựa chọn giống hệt nhau; che từ trong câu ví dụ không được để lộ đáp án.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const { buildChoices, meaningChoices, wordChoices, normalizeText, sameText } = await import('../quizChoices.js');
const { blankWord, wordForms } = await import('../../../api/adapters.js');

const w = (id, word, meaning) => ({ id, word, meaning });
const POOL = [
  w('1', 'beautiful', 'đẹp'), w('2', 'pretty', 'đẹp'), w('3', 'ugly', 'xấu'), w('4', 'big', 'to'),
  w('5', 'small', 'nhỏ'), w('6', 'lovely', ' Đẹp '),
];

describe('so sánh đáp án', () => {
  it('chuẩn hóa Unicode, hoa/thường và khoảng trắng', () => {
    assert.equal(normalizeText('  Ice   Cream '), 'ice cream');
    assert.ok(sameText('e\u0301', '\u00e9'));                       // é dạng tổ hợp = é dựng sẵn
    assert.ok(sameText('Đẹp', 'đẹp'));
    assert.ok(!sameText('red', 'read'));
    assert.equal(normalizeText(null), '');
  });
});

describe('buildChoices', () => {
  it('đáp án đúng luôn có mặt đúng 1 lần, tối đa 4 lựa chọn, không trùng nhau', () => {
    for (let i = 0; i < 50; i++) {
      const out = buildChoices('đúng', ['a', 'b', 'c', 'd', 'e', 'a', 'B', 'đúng', 'ĐÚNG', '', '  ']);
      assert.equal(out.length, 4);
      assert.equal(out.filter((x) => x === 'đúng').length, 1);
      assert.equal(new Set(out.map(normalizeText)).size, 4);
    }
  });

  it('ít ứng viên thì ít lựa chọn hơn (không nhân bản)', () => {
    assert.deepEqual(buildChoices('x', []), ['x']);
    assert.deepEqual(buildChoices('x', ['y', 'Y', 'x']).map(normalizeText).sort(), ['x', 'y']);   // 'y'/'Y' chỉ giữ 1, 'x' là đáp án đúng
  });
});

describe('lựa chọn nghĩa tiếng Việt (bài 2)', () => {
  it('không có lựa chọn trùng nghĩa với đáp án đúng, không lặp, không chứa chính từ đang hỏi hai lần', () => {
    for (let i = 0; i < 100; i++) {
      const out = meaningChoices(POOL[0], POOL);                    // 'beautiful' = 'đẹp'; trong pool còn 'pretty', 'lovely' cũng "đẹp"
      assert.equal(out.filter((m) => sameText(m, 'đẹp')).length, 1);
      assert.equal(new Set(out.map(normalizeText)).size, out.length);
      assert.ok(out.length >= 2 && out.length <= 4);
    }
  });
});

describe('lựa chọn từ tiếng Anh cho nghĩa (bài 3)', () => {
  it('loại từ khác cùng nghĩa: "beautiful" và "pretty" không cùng xuất hiện', () => {
    for (let i = 0; i < 100; i++) {
      const out = wordChoices(POOL[0], POOL);
      assert.ok(out.includes('beautiful'));
      assert.ok(!out.includes('pretty'));
      assert.ok(!out.includes('lovely'));                            // " Đẹp " cũng là "đẹp" sau khi chuẩn hóa
      assert.equal(out.length, 4);
    }
  });

  it('nhóm chỉ có 1 từ: vẫn ra câu hỏi hợp lệ (1 lựa chọn)', () => {
    assert.deepEqual(wordChoices(POOL[0], [POOL[0]]), ['beautiful']);
  });

  it('bỏ qua từ trong pool không có chữ', () => {
    const out = wordChoices(POOL[2], [...POOL, { id: 'x', word: '', meaning: 'khác' }]);
    assert.ok(out.every(Boolean));
  });
});

describe('blankWord: che mọi dạng của từ, không để lộ đáp án', () => {
  const cases = [
    ['My luggage is ready.', 'luggage', 'My ___ is ready.'],
    ['He is running.', 'run', 'He is ___.'],                         // gấp đôi phụ âm
    ['She ran home, then run again.', 'run', 'She ___ home, then ___ again.'],   // bất quy tắc + che MỌI chỗ
    ['I studied hard and she studies more.', 'study', 'I ___ hard and she ___ more.'],
    ['They negotiated a price.', 'negotiate', 'They ___ a price.'],
    ['The children play.', 'child', 'The ___ play.'],
    ['He went home.', 'go', 'He ___ home.'],
    ['The cities are big.', 'city', 'The ___ are big.'],
    ['Stopped!', 'stop', '___!'],
    ['Cloud storage is cheap.', 'cloud', '___ storage is cheap.'],
  ];
  for (const [sentence, word, expected] of cases) {
    it(`${word}: ${sentence}`, () => assert.equal(blankWord(sentence, word), expected));
  }

  it('không che từ KHÁC chỉ giống chữ (cloudy ≠ cloud) -> null (dùng ví dụ dự phòng)', () => {
    assert.equal(blankWord('The sky is cloudy.', 'cloud'), null);
  });

  it('còn sót dạng lạ của từ sau khi che -> null thay vì để lộ', () => {
    assert.equal(blankWord('She is a studious person who will study.', 'study'), null);   // "studious" còn lại cùng gốc
    assert.equal(blankWord('', 'x'), null);
    assert.equal(blankWord('Hello', ''), null);
  });

  it('wordForms gồm dạng bất quy tắc và dạng có quy tắc', () => {
    assert.ok(['went', 'gone', 'goes'].every((f) => wordForms('go').includes(f)));
    assert.ok(['studies', 'studied', 'studying'].every((f) => wordForms('study').includes(f)));
    assert.ok(['running', 'ran'].every((f) => wordForms('run').includes(f)));
  });

  it('ký tự đặc biệt trong từ không làm vỡ biểu thức chính quy', () => {
    assert.doesNotThrow(() => blankWord('a (b) c', '(b)'));
    assert.doesNotThrow(() => blankWord('1+1=2', '1+1'));
  });
});
