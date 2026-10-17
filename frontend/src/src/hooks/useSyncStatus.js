import { useSyncExternalStore } from 'react';
import { getSyncSnapshot, subscribeSync } from '../api/outbox';

/** { pending, flushing, stalled, lastError } - số mục tiến độ học chưa lưu được lên server. */
export function useSyncStatus() {
  return useSyncExternalStore(subscribeSync, getSyncSnapshot, getSyncSnapshot);
}
