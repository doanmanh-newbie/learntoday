import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rememberTicket, ticketFor, clearTickets } from '../tickets.js';

test('mỗi từ nhớ vé của lần giao gần nhất', () => {
  clearTickets();
  rememberTicket(['a', 'b'], 't1');
  assert.equal(ticketFor('a'), 't1');
  rememberTicket(['b', 'c'], 't2');
  assert.equal(ticketFor('a'), 't1');
  assert.equal(ticketFor('b'), 't2');
  assert.equal(ticketFor('c'), 't2');
});

test('id số hay chuỗi đều khớp; thiếu vé thì null', () => {
  clearTickets();
  rememberTicket([7], 't');
  assert.equal(ticketFor('7'), 't');
  assert.equal(ticketFor('zzz'), null);
});

test('không có vé hoặc dữ liệu lạ thì bỏ qua, không lỗi', () => {
  clearTickets();
  rememberTicket(['a'], undefined);
  rememberTicket(undefined, 't');
  assert.equal(ticketFor('a'), null);
});
