import type { Dispatch } from 'react';
import type { ModelContextTool } from './modelContext';
import type { Action } from '../state/actions';
import type { StateRef } from './tools';
import { clientById, invoiceById } from '../state/selectors';
import { formatMoney } from '../lib/money';
import { newId } from '../lib/ids';
import { withLogging } from './withLogging';
import { requestConfirmation } from './confirm';

/**
 * The two money-moving tools. Both park on requestConfirmation() before
 * dispatching — the site owns the checkpoint, not the agent. Declines and
 * aborts return plain, honest strings so the agent reports back accurately
 * instead of retrying.
 */
export function buildGatedTools(stateRef: StateRef, dispatch: Dispatch<Action>): ModelContextTool[] {
  return [
    {
      name: 'send_invoice',
      title: 'Send invoice',
      description:
        'Sends a draft invoice to the client. Requires the freelancer to approve in the UI before it goes out — call this once you and the freelancer agree the draft is ready.',
      inputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'The invoice id, e.g. INV-1041.' },
        },
        required: ['invoiceId'],
      },
      annotations: { readOnlyHint: false },
      execute: withLogging('send_invoice', async (input, { signal }) => {
        const state = stateRef.current;
        const invoice = invoiceById(state, String(input.invoiceId ?? ''));
        if (!invoice) return `No invoice found with id "${String(input.invoiceId ?? '')}".`;
        if (invoice.status !== 'draft') {
          return `${invoice.id} is already ${invoice.status}; only drafts can be sent.`;
        }
        const client = clientById(state, invoice.clientId);

        const outcome = await requestConfirmation(
          {
            id: newId('confirm'),
            tier: 'light',
            kind: 'send_invoice',
            title: `Send ${invoice.id}?`,
            invoiceId: invoice.id,
            clientName: client?.name ?? 'Unknown client',
            amount: invoice.amount,
            currency: invoice.currency,
          },
          signal
        );

        if (!outcome.approved) {
          return outcome.reason === 'aborted'
            ? `Cancelled — the send request for ${invoice.id} was aborted before the freelancer responded.`
            : `DECLINED — the freelancer did not approve sending ${invoice.id}. Nothing was sent. Do not retry without new instruction from them.`;
        }

        dispatch({ type: 'SEND_INVOICE', invoiceId: invoice.id, actor: 'agent' });
        return `Sent ${invoice.id} to ${client?.name ?? 'the client'} (${formatMoney(invoice.amount, invoice.currency)}). Approved by the freelancer.`;
      }),
    },
    {
      name: 'mark_invoice_paid',
      title: 'Mark invoice paid',
      description:
        "Marks a sent invoice as paid once the client has paid. Always requires the freelancer's confirmation, and shows them a side-by-side amount check if what you report differs from the invoiced total.",
      inputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'The invoice id, e.g. INV-1039.' },
          amountReceived: {
            type: 'number',
            description: 'The amount the client actually paid, in the invoice currency.',
          },
        },
        required: ['invoiceId', 'amountReceived'],
      },
      annotations: { readOnlyHint: false },
      execute: withLogging('mark_invoice_paid', async (input, { signal }) => {
        const state = stateRef.current;
        const invoice = invoiceById(state, String(input.invoiceId ?? ''));
        if (!invoice) return `No invoice found with id "${String(input.invoiceId ?? '')}".`;
        if (invoice.status !== 'sent') {
          return `${invoice.id} is ${invoice.status}; only sent invoices can be marked paid.`;
        }
        const amountReceived = Number(input.amountReceived);
        if (!Number.isFinite(amountReceived) || amountReceived <= 0) {
          return 'amountReceived must be a positive number.';
        }
        const client = clientById(state, invoice.clientId);
        const mismatch = amountReceived !== invoice.amount;

        const outcome = await requestConfirmation(
          {
            id: newId('confirm'),
            tier: 'heavy',
            kind: 'mark_invoice_paid',
            title: `Mark ${invoice.id} paid?`,
            invoiceId: invoice.id,
            clientName: client?.name ?? 'Unknown client',
            invoiceAmount: invoice.amount,
            amountReceived,
            currency: invoice.currency,
            mismatch,
          },
          signal
        );

        if (!outcome.approved) {
          return outcome.reason === 'aborted'
            ? `Cancelled — the mark-paid request for ${invoice.id} was aborted before the freelancer responded.`
            : `DECLINED — the freelancer did not approve marking ${invoice.id} paid at ${formatMoney(amountReceived, invoice.currency)}. The invoice is unchanged. Do not retry without new instruction from them.`;
        }

        dispatch({ type: 'MARK_INVOICE_PAID', invoiceId: invoice.id, amountReceived, actor: 'agent' });
        return `Marked ${invoice.id} paid at ${formatMoney(amountReceived, invoice.currency)}${
          mismatch ? ` (invoice was ${formatMoney(invoice.amount, invoice.currency)})` : ''
        }. Approved by the freelancer.`;
      }),
    },
  ];
}
