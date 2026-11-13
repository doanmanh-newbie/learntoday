import { useSyncExternalStore } from 'react';
import { getSyncSnapshot, subscribeSync } from '../api/outbox';

/** { pending, flushing, stalled, lastError, rejected, lastRejected } - tiến độ học chưa lưu được / bị server từ chối. */
export function useSyncStatus() {
  return useSyncExternalStore(subscribeSync, getSyncSnapshot, getSyncSnapshot);
}
