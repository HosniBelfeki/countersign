import { useLedger } from '../state/LedgerProvider';
import { byStatus, clientById } from '../state/selectors';
import { Column } from './Column';
import type { InvoiceStatus } from '../types';

const COLUMNS: InvoiceStatus[] = ['draft', 'sent', 'paid'];

export function Board({
  clientFilter,
  selectedId,
  onSelect,
}: {
  clientFilter: string | null;
  selectedId: string | null;
  onSelect: (invoiceId: string) => void;
}) {
  const { state } = useLedger();
  const clientNameFor = (clientId: string) => clientById(state, clientId)?.name ?? 'Unknown client';

  return (
    <div className="flex flex-1 gap-3 overflow-x-auto p-4">
      {COLUMNS.map((status) => {
        const invoices = byStatus(state, status).filter(
          (inv) => !clientFilter || inv.clientId === clientFilter
        );
        return (
          <Column
            key={status}
            status={status}
            invoices={invoices}
            clientNameFor={clientNameFor}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
