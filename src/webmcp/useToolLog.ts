import { useSyncExternalStore } from 'react';
import { subscribeToolLog, getToolLogSnapshot } from './toolLog';

export function useToolLog() {
  return useSyncExternalStore(subscribeToolLog, getToolLogSnapshot);
}
