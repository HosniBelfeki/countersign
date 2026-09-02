import { useLedger } from '../state/LedgerProvider';
import { clientById, invoiceById } from '../state/selectors';
import { formatMoney } from '../lib/money';
import { formatDate } from '../lib/dates';
import { QuarantineNotice } from './QuarantineNotice';

// 'sent' intentionally isn't amber — the spec reserves warning/amber for
// quarantine and mismatch overrides specifically, so a routine "awaiting
// payment" state uses the brand primary instead, at low intensity.
const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-surface-container text-on-surface-variant',
  sent: 'bg-primary/10 text-primary',
  paid: 'bg-success/10 text-success',
};

export function InvoiceDetail({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const { state } = useLedger();
  const invoice = invoiceById(state, invoiceId);
  const client = invoice ? clientById(state, invoice.clientId) : undefined;

  if (!invoice) return null;

  return (
    <aside className="w-96 shrink-0 overflow-y-auto border-l border-outline-variant bg-surface-container-lowest">
      <div className="flex items-start justify-between border-b border-outline-variant p-6 pb-5">
        <div>
          <p className="text-mono-label text-on-surface-variant">{invoice.id}</p>
          <h2 className="text-headline-md text-on-surface">{client?.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded-md px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container"
        >
          close
        </button>
      </div>

      <div className="p-6">
        <span
          className={`text-status-pill inline-block rounded-full px-2.5 py-1 capitalize ${STATUS_STYLE[invoice.status]}`}
        >
          {invoice.status}
        </span>

        <p className="text-display-currency mt-4 text-on-surface">
          {formatMoney(invoice.amount, invoice.currency)}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">{invoice.projectDesc}</p>

        <dl className="mt-5 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-on-surface-variant">Terms</dt>
          <dd>{invoice.terms}</dd>
          <dt className="text-on-surface-variant">Due</dt>
          <dd>{formatDate(invoice.dueDate)}</dd>
          {invoice.sentAt && (
            <>
              <dt className="text-on-surface-variant">Sent</dt>
              <dd>{formatDate(invoice.sentAt)}</dd>
            </>
          )}
          {invoice.paidAt && (
            <>
              <dt className="text-on-surface-variant">Paid</dt>
              <dd>{formatDate(invoice.paidAt)}</dd>
            </>
          )}
          {invoice.amountReceived !== undefined && invoice.amountReceived !== invoice.amount && (
            <>
              <dt className="text-warning">Received</dt>
              <dd className="text-warning">{formatMoney(invoice.amountReceived, invoice.currency)}</dd>
            </>
          )}
        </dl>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Reminders
          </h3>
          {invoice.reminders.length === 0 ? (
            <p className="mt-1 text-xs text-on-surface-variant">None scheduled.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {invoice.reminders.map((r) => (
                <li key={r.id} className="rounded-md bg-surface-container px-2.5 py-1.5 text-xs">
                  <span className="font-medium">{formatDate(r.dueDate)}</span> — {r.note}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Client replies
          </h3>
          {invoice.replies.length === 0 ? (
            <p className="mt-1 text-xs text-on-surface-variant">No replies logged.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {invoice.replies.map((reply) => (
                <li key={reply.id} className="rounded-md border border-outline-variant p-2.5 text-xs">
                  <p className="text-on-surface">{reply.text}</p>
                  {reply.quarantined && <QuarantineNotice matchedPatterns={reply.matchedPatterns} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
