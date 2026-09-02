import type { LedgerState } from '../types';
import { seedState } from './seed';

const STORAGE_KEY = 'countersign:v1';

/**
 * Judges and the ChatGPT in-app browser arrive with empty localStorage —
 * always fall back to seed data on empty, corrupt, or version-mismatched
 * storage so the demo is never a blank board.
 */
export function loadOrSeed(): LedgerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as LedgerState;
    if (!parsed || !Array.isArray(parsed.clients) || !Array.isArray(parsed.invoices)) {
      return seedState();
    }
    return parsed;
  } catch {
    return seedState();
  }
}

export function persist(state: LedgerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or disabled — the session still works, just won't survive reload
  }
}

export function resetToSeed(): LedgerState {
  const seeded = seedState();
  persist(seeded);
  return seeded;
}
