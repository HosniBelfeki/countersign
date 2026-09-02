import { createContext, useContext, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import type { ReactNode, RefObject, Dispatch } from 'react';
import type { LedgerState } from '../types';
import type { Action } from './actions';
import { reducer } from './reducer';
import { loadOrSeed, persist } from './persist';

interface LedgerContextValue {
  state: LedgerState;
  /**
   * Tools register once with document.modelContext and must never close over
   * `state` directly — that would freeze the ledger they see at registration
   * time. Every tool's execute() reads stateRef.current instead.
   */
  stateRef: RefObject<LedgerState>;
  dispatch: Dispatch<Action>;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadOrSeed);
  const stateRef = useRef(state);

  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    persist(state);
  }, [state]);

  return (
    <LedgerContext.Provider value={{ state, stateRef, dispatch }}>{children}</LedgerContext.Provider>
  );
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger must be used within a LedgerProvider');
  return ctx;
}
