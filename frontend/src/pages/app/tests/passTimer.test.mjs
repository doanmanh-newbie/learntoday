import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const { formatClock, formatHms, secondsLeft, sanitizeAnswers, answeredCount, sameAnswers } = await import('../passTimer.js');

describe('đồng hồ bài Pass (giao diện)', () => {
  it('formatClock', () => {
    assert.equal(formatClock(900), '15:00');
    assert.equal(formatClock(754), '12:34');
    assert.equal(formatClock(59.9), '00:59');
    assert.equal(formatClock(0), '00:00');
    for (const bad of [-5, NaN, undefined, null, 'x']) assert.equal(formatClock(bad), '00:00');
  });

  it('formatHms', () => {
    assert.equal(formatHms(85520), '23:45:20');
    assert.equal(formatHms(59), '00:00:59');
    assert.equal(formatHms(3600), '01:00:00');
    assert.equal(formatHms(-1), '00:00:00');
    assert.equal(formatHms(360000), '100:00:00');
  });

  it('secondsLeft làm tròn lên và không âm', () => {
    assert.equal(secondsLeft(10_000, 0), 10);
    assert.equal(secondsLeft(10_000, 9_001), 1);        // còn 0,999 giây vẫn hiện 1 chứ không phải 0
    assert.equal(secondsLeft(10_000, 10_000), 0);
    assert.equal(secondsLeft(10_000, 99_999), 0);
  });

  it('sanitizeAnswers bỏ giá trị không hợp lệ', () => {
    assert.deepEqual(sanitizeAnswers({ q1: 0, q2: 3, q3: -1, q4: '2', q5: 1.5, q6: null, q7: true }), { q1: 0, q2: 3 });
    for (const bad of [null, undefined, [], 'x', 5]) assert.deepEqual(sanitizeAnswers(bad), {});
  });

  it('answeredCount và sameAnswers', () => {
    const qs = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];
    assert.equal(answeredCount({ q1: 0, q3: 2, zz: 1 }, qs), 2);
    assert.equal(answeredCount(undefined, qs), 0);
    assert.equal(answeredCount({ q1: 0 }, undefined), 0);
    assert.ok(sameAnswers({ q1: 0, q2: 1 }, { q2: 1, q1: 0 }));
    assert.ok(!sameAnswers({ q1: 0 }, { q1: 1 }));
    assert.ok(sameAnswers(undefined, {}));
  });
});
