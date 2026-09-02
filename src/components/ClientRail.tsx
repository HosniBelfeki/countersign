import { useLedger } from '../state/LedgerProvider';
import { outstandingFor } from '../state/selectors';
import { formatMoney } from '../lib/money';
import { TrustNotice } from './TrustNotice';

export function ClientRail({
  selectedClientId,
  onSelect,
}: {
  selectedClientId: string | null;
  onSelect: (clientId: string | null) => void;
}) {
  const { state } = useLedger();

  return (
    <aside className="w-64 shrink-0 border-r border-outline-variant bg-surface-container-lowest p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Clients</h2>
        {selectedClientId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="focus-ring rounded text-xs text-primary hover:underline"
          >
            clear
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {state.clients.map((client) => {
          const outstanding = outstandingFor(state, client.id);
          const selected = client.id === selectedClientId;
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelect(selected ? null : client.id)}
              className={`focus-ring rounded-md px-2 py-2 text-left transition-colors ${
                selected ? 'bg-primary-container/10 ring-1 ring-primary' : 'hover:bg-surface-container'
              }`}
            >
              <p className="truncate text-sm font-medium">{client.name}</p>
              <p className="text-xs text-on-surface-variant">
                {outstanding > 0 ? `${formatMoney(outstanding, client.currency)} outstanding` : 'settled'}
              </p>
            </button>
          );
        })}
      </div>
      <TrustNotice />
    </aside>
  );
}
