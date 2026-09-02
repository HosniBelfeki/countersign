import type { ModelContextTool } from './modelContext';
import type { LedgerState } from '../types';
import { byStatus, totals, findInvoices, clientById, outstandingFor } from '../state/selectors';
import { formatMoney, formatCurrencyBreakdown } from '../lib/money';
import { formatDate, isInvoiceOverdue, daysOverdue } from '../lib/dates';
import { clamp1500 } from './format';
import { withLogging } from './withLogging';

/** Tools register once; state changes constantly. Every execute() reads this instead of closing over state. */
export type StateRef = { current: LedgerState };

export function buildReadOnlyTools(stateRef: StateRef): ModelContextTool[] {
  return [
    {
      name: 'get_ledger_state',
      title: 'Get ledger state',
      description:
        'Returns a snapshot of the billing board: invoice counts and totals per column (draft, sent, paid), plus how many are overdue. Use this to orient before searching for something specific.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: withLogging('get_ledger_state', async () => {
        const state = stateRef.current;
        const t = totals(state);
        const draft = byStatus(state, 'draft').length;
        const sent = byStatus(state, 'sent').length;
        const paid = byStatus(state, 'paid').length;
        return clamp1500(
          `Board: ${draft} draft, ${sent} sent (${formatCurrencyBreakdown(t.outstandingByCurrency)} outstanding), ` +
            `${paid} paid (${formatCurrencyBreakdown(t.paidByCurrency)} collected). ${t.overdueCount} invoice(s) overdue. ` +
            `${state.clients.length} clients on file.`
        );
      }),
    },
    {
      name: 'search_invoices',
      title: 'Search invoices',
      description:
        'Finds specific invoices by client name, invoice id, project description, status, or overdue-only. Use this to locate particular invoices, not for a full board overview.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Free text: client name, invoice id, or project description.',
          },
          status: {
            type: 'string',
            enum: ['draft', 'sent', 'paid'],
            description: 'Filter to one board column.',
          },
          overdueOnly: {
            type: 'boolean',
            description: 'Only invoices past their due date and still unpaid.',
          },
        },
      },
      annotations: { readOnlyHint: true },
      execute: withLogging('search_invoices', async (input) => {
        const state = stateRef.current;
        const query = typeof input.query === 'string' ? input.query : '';
        let results = findInvoices(state, query);
        if (typeof input.status === 'string') {
          results = results.filter((inv) => inv.status === input.status);
        }
        if (input.overdueOnly === true) {
          results = results.filter((inv) => isInvoiceOverdue(inv.status, inv.dueDate));
        }
        if (results.length === 0) return 'No invoices matched.';
        const lines = results.slice(0, 15).map((inv) => {
          const client = clientById(state, inv.clientId);
          const overdue = isInvoiceOverdue(inv.status, inv.dueDate)
            ? ` (${daysOverdue(inv.dueDate)}d overdue)`
            : '';
          return `${inv.id} · ${client?.name ?? 'Unknown'} · ${inv.status} · ${formatMoney(inv.amount, inv.currency)} · due ${formatDate(inv.dueDate)}${overdue}`;
        });
        return clamp1500(lines.join('\n'));
      }),
    },
    {
      name: 'get_client',
      title: 'Get client',
      description:
        'Returns a client profile and their current outstanding balance. Provide the client name (partial match is fine) or exact client id.',
      inputSchema: {
        type: 'object',
        properties: {
          nameOrId: {
            type: 'string',
            description: 'Client name or exact client id.',
          },
        },
        required: ['nameOrId'],
      },
      annotations: { readOnlyHint: true },
      execute: withLogging('get_client', async (input) => {
        const state = stateRef.current;
        const q = String(input.nameOrId ?? '').toLowerCase().trim();
        const client = state.clients.find((c) => c.id === q || c.name.toLowerCase().includes(q));
        if (!client) return `No client found matching "${String(input.nameOrId ?? '')}".`;
        const outstanding = outstandingFor(state, client.id);
        return clamp1500(
          `${client.name} · ${client.email} · rate ${formatMoney(client.rate, client.currency)}/hr · ` +
            `${formatMoney(outstanding, client.currency)} outstanding.`
        );
      }),
    },
  ];
}
