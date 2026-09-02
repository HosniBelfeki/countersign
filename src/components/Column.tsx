import type { Invoice, InvoiceStatus } from '../types';
import { InvoiceCard } from './InvoiceCard';
import { formatMoney } from '../lib/money';
import { sumByCurrency } from '../state/selectors';

const DOT_CLASS: Record<InvoiceStatus, string> = {
  draft: 'bg-outline',
  sent: 'bg-primary',
  paid: 'bg-success',
};

const LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent (Awaiting Payment)',
  paid: 'Paid',
};

export function Column({
  status,
  invoices,
  clientNameFor,
  selectedId,
  onSelect,
}: {
  status: InvoiceStatus;
  invoices: Invoice[];
  clientNameFor: (clientId: string) => string;
  selectedId: string | null;
  onSelect: (invoiceId: string) => void;
}) {
  // Invoices in one column can span clients with different currencies — never
  // sum them into a single mislabeled number. Stacked (not "+"-joined) so it
  // stays readable even with three or more currencies present.
  const currencyTotals = Object.entries(sumByCurrency(invoices));

  return (
    <div className="flex min-w-[240px] flex-1 flex-col rounded-lg bg-surface-container-low p-3">
      <div className="mb-3 border-b border-outline-variant px-1 pb-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASS[status]}`} aria-hidden="true" />
          <span className="truncate">{LABELS[status]}</span>
          <span className="shrink-0 text-on-surface-variant">· {invoices.length}</span>
        </h2>
        {currencyTotals.length > 0 && (
          <div className="text-mono-label mt-1 flex flex-wrap gap-x-2 text-on-surface-variant">
            {currencyTotals.map(([currency, amount]) => (
              <span key={currency}>{formatMoney(amount, currency)}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 pt-1">
        {invoices.length === 0 && (
          <p className="rounded-md border border-dashed border-outline-variant p-4 text-center text-xs text-on-surface-variant">
            Nothing here yet.
          </p>
        )}
        {invoices.map((invoice) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            clientName={clientNameFor(invoice.clientId)}
            selected={invoice.id === selectedId}
            onSelect={() => onSelect(invoice.id)}
          />
        ))}
      </div>
    </div>
  );
}
