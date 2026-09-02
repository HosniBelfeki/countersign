import { useSyncExternalStore } from 'react';
import { subscribeConfirmQueue, getConfirmQueueSnapshot } from './confirm';

export function useConfirmQueue() {
  return useSyncExternalStore(subscribeConfirmQueue, getConfirmQueueSnapshot);
}
