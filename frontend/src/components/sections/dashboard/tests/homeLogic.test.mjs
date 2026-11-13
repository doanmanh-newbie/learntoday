import test from 'node:test';
import assert from 'node:assert/strict';
import { nextStep, planSteps, progressPercent, reviewMinutes } from '../homeLogic.js';

test('người mới -> start', () => assert.equal(nextStep({ totalLearned: 0 }).key, 'start'));
test('có từ đến hạn -> review (ưu tiên hơn học mới)', () => assert.equal(nextStep({ dueCount: 5, learnedToday: 0, target: 10, totalLearned: 30 }).key, 'review'));
test('hết hạn, chưa đủ mục tiêu -> learn', () => assert.equal(nextStep({ dueCount: 0, learnedToday: 3, target: 10, totalLearned: 30 }).key, 'learn'));
test('xong hết -> practice', () => assert.equal(nextStep({ dueCount: 0, learnedToday: 10, target: 10, totalLearned: 30 }).key, 'practice'));
test('planSteps / progressPercent / reviewMinutes', () => {
  assert.equal(planSteps({ dueCount: 0, learnedToday: 10, target: 10 }).every((s) => s.done), true);
  assert.equal(progressPercent(5, 10), 50);
  assert.equal(progressPercent(15, 10), 100);
  assert.equal(progressPercent(1, 0), 0);
  assert.equal(reviewMinutes(0), 1);
});
