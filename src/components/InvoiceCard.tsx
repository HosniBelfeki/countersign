import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Invoice } from '../types';
import { formatMoney } from '../lib/money';
import { formatDate, daysOverdue, isInvoiceOverdue } from '../lib/dates';
import { SparkIcon } from './SparkIcon';

export function InvoiceCard({
  invoice,
  clientName,
  selected,
  onSelect,
}: {
  invoice: Invoice;
  clientName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const overdue = isInvoiceOverdue(invoice.status, invoice.dueDate);
  const agentCreated = invoice.createdBy === 'agent';
  const [copied, setCopied] = useState(false);

  const copyId = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(invoice.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard access can be denied — not worth failing the interaction over.
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    // A native <button> can't contain another <button> (the Copy ID action
    // below), so this is a div with full keyboard/button semantics instead.
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`focus-ring invoice-card group w-full cursor-pointer rounded-md border bg-surface-container-lowest p-4 text-left hover:bg-surface-container-low ${
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-outline-variant hover:border-outline'
      } ${agentCreated ? 'border-l-4 border-l-agent' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-mono-label text-on-surface-variant">{invoice.id}</span>
        <div className="flex items-center gap-1.5">
          {agentCreated && (
            <span className="text-status-pill flex items-center gap-1 rounded-full bg-agent/10 px-2 py-0.5 text-agent">
              <SparkIcon className="h-2.5 w-2.5" />
              agent
            </span>
          )}
          <button
            type="button"
            onClick={copyId}
            title="Copy invoice id"
            className="focus-ring rounded px-1.5 py-0.5 text-[10px] text-on-surface-variant opacity-0 transition-opacity hover:bg-surface-container group-hover:opacity-100"
          >
            {copied ? 'Copied' : 'Copy ID'}
          </button>
        </div>
      </div>
      <p className="mt-1.5 truncate text-sm font-medium text-on-surface">{clientName}</p>
      <p className="truncate text-xs text-on-surface-variant">{invoice.projectDesc}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
          {formatMoney(invoice.amount, invoice.currency)}
        </span>
        {overdue ? (
          <span className="text-status-pill rounded-full bg-error/10 px-2 py-0.5 text-error">
            {daysOverdue(invoice.dueDate)}d overdue
          </span>
        ) : (
          <span className="text-[10px] text-on-surface-variant">due {formatDate(invoice.dueDate)}</span>
        )}
      </div>
      {invoice.replies.some((r) => r.quarantined) && (
        <div className="text-status-pill mt-2.5 flex items-center gap-1 text-warning">
          <span aria-hidden="true">⚠</span> quarantined reply
        </div>
      )}
    </div>
  );
}
