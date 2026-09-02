import type { LedgerState, Invoice, InvoiceStatus } from '../types';
import { isInvoiceOverdue } from '../lib/dates';

export function byStatus(state: LedgerState, status: InvoiceStatus): Invoice[] {
  return state.invoices
    .filter((inv) => inv.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function clientById(state: LedgerState, clientId: string) {
  return state.clients.find((c) => c.id === clientId);
}

export function invoiceById(state: LedgerState, invoiceId: string) {
  return state.invoices.find((inv) => inv.id === invoiceId);
}

// A client's own invoices always share one currency (set from client.currency
// at creation), so this single-number sum is safe. Board/ledger-wide totals
// are NOT — they span clients with different currencies — so those use
// sumByCurrency below instead of a naive sum.
export function outstandingFor(state: LedgerState, clientId: string): number {
  return state.invoices
    .filter((inv) => inv.clientId === clientId && inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.amount, 0);
}

/** Sums invoice amounts grouped by currency — never collapse mixed currencies into one number. */
export function sumByCurrency(invoices: Invoice[], amountFor: (inv: Invoice) => number = (inv) => inv.amount): Record<string, number> {
  return invoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] ?? 0) + amountFor(inv);
    return acc;
  }, {});
}

export function totals(state: LedgerState) {
  const outstandingByCurrency = sumByCurrency(state.invoices.filter((inv) => inv.status === 'sent'));
  const paidByCurrency = sumByCurrency(
    state.invoices.filter((inv) => inv.status === 'paid'),
    (inv) => inv.amountReceived ?? inv.amount
  );
  const overdueCount = state.invoices.filter((inv) => isInvoiceOverdue(inv.status, inv.dueDate)).length;
  return { outstandingByCurrency, paidByCurrency, overdueCount };
}

export function findInvoices(state: LedgerState, query: string): Invoice[] {
  const q = query.trim().toLowerCase();
  if (!q) return state.invoices;
  return state.invoices.filter((inv) => {
    const client = clientById(state, inv.clientId);
    return (
      inv.id.toLowerCase().includes(q) ||
      inv.projectDesc.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q) ||
      client?.name.toLowerCase().includes(q)
    );
  });
}
