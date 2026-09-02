import { useMemo, useState } from 'react';
import { AgentStatusBar } from './components/AgentStatusBar';
import { RefreshIcon } from './components/RefreshIcon';
import { ClientRail } from './components/ClientRail';
import { Board } from './components/Board';
import { InvoiceDetail } from './components/InvoiceDetail';
import { ToolConsole } from './components/ToolConsole';
import { ActivityFeed } from './components/ActivityFeed';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LedgerProvider, useLedger } from './state/LedgerProvider';
import { resetToSeed } from './state/persist';
import { useRegisterWebMCPTools } from './webmcp/registerTools';
import { buildReadOnlyTools } from './webmcp/tools';
import { buildWriteTools } from './webmcp/writeTools';
import { buildGatedTools } from './webmcp/gatedTools';

function Desk() {
  const { stateRef, dispatch } = useLedger();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // stateRef and dispatch are stable for the component's lifetime (useRef /
  // useReducer both guarantee this), so this array is built exactly once —
  // tools read stateRef.current at call time, never closed-over state.
  const tools = useMemo(
    () => [
      ...buildReadOnlyTools(stateRef),
      ...buildWriteTools(stateRef, dispatch),
      ...buildGatedTools(stateRef, dispatch),
    ],
    [stateRef, dispatch]
  );
  const status = useRegisterWebMCPTools(tools);

  return (
    <div className="flex h-screen flex-col">
      <header className="app-header sticky top-0 z-30 border-b border-outline-variant">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-headline-lg text-on-surface">Countersign</h1>
            <p className="text-sm text-on-surface-variant">Your agent drafts. You countersign.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: 'LOAD_STATE', state: resetToSeed() })}
              className="focus-ring flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
              title="Clears any test data and restores the original demo seed"
            >
              <RefreshIcon />
              Reset demo data
            </button>
            <AgentStatusBar status={status} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1">
        <ClientRail selectedClientId={selectedClientId} onSelect={setSelectedClientId} />
        <Board
          clientFilter={selectedClientId}
          selectedId={selectedInvoiceId}
          onSelect={setSelectedInvoiceId}
        />
        {selectedInvoiceId && (
          <InvoiceDetail invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
        )}
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-outline-variant">
          <ActivityFeed />
          <ToolConsole status={status} />
        </aside>
      </div>

      <ConfirmDialog />
    </div>
  );
}

export function App() {
  return (
    <LedgerProvider>
      <Desk />
    </LedgerProvider>
  );
}
