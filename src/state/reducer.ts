import type { LedgerState, Invoice, ActivityEvent, Actor } from '../types';
import type { Action } from './actions';
import { newId } from '../lib/ids';
import { formatMoney } from '../lib/money';

function clientName(state: LedgerState, clientId: string): string {
  return state.clients.find((c) => c.id === clientId)?.name ?? 'Unknown client';
}

function logEvent(
  state: LedgerState,
  kind: ActivityEvent['kind'],
  actor: Actor,
  summary: string,
  extra?: { invoiceId?: string; clientId?: string }
): ActivityEvent[] {
  const event: ActivityEvent = {
    id: newId('evt'),
    kind,
    actor,
    summary,
    createdAt: new Date().toISOString(),
    ...extra,
  };
  return [event, ...state.activity].slice(0, 200);
}

function updateInvoice(state: LedgerState, invoiceId: string, fn: (inv: Invoice) => Invoice): LedgerState {
  return {
    ...state,
    invoices: state.invoices.map((inv) => (inv.id === invoiceId ? fn(inv) : inv)),
  };
}

/**
 * The single source of truth for every ledger mutation. Every WebMCP write
 * tool dispatches through here — nothing mutates state directly. Guards
 * (e.g. "only drafts are editable") live here so they hold regardless of
 * whether a human or an agent triggers the action.
 */
export function reducer(state: LedgerState, action: Action): LedgerState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.state;

    case 'ADD_CLIENT': {
      const next = { ...state, clients: [...state.clients, action.client] };
      return {
        ...next,
        activity: logEvent(next, 'client_added', action.client.createdBy, `Added client ${action.client.name}`, {
          clientId: action.client.id,
        }),
      };
    }

    case 'DRAFT_INVOICE': {
      const next = { ...state, invoices: [...state.invoices, action.invoice] };
      const name = clientName(next, action.invoice.clientId);
      return {
        ...next,
        activity: logEvent(
          next,
          'invoice_drafted',
          action.invoice.createdBy,
          `Drafted ${action.invoice.id} for ${name} (${formatMoney(action.invoice.amount, action.invoice.currency)})`,
          { invoiceId: action.invoice.id, clientId: action.invoice.clientId }
        ),
      };
    }

    case 'EDIT_INVOICE': {
      const target = state.invoices.find((inv) => inv.id === action.invoiceId);
      if (!target || target.status !== 'draft') return state; // locked once sent/paid
      const next = updateInvoice(state, action.invoiceId, (inv) => ({ ...inv, ...action.patch }));
      return {
        ...next,
        activity: logEvent(next, 'invoice_edited', action.actor, `Edited ${action.invoiceId}`, {
          invoiceId: action.invoiceId,
          clientId: target.clientId,
        }),
      };
    }

    case 'SEND_INVOICE': {
      const target = state.invoices.find((inv) => inv.id === action.invoiceId);
      if (!target || target.status !== 'draft') return state;
      const next = updateInvoice(state, action.invoiceId, (inv) => ({
        ...inv,
        status: 'sent',
        sentAt: new Date().toISOString(),
      }));
      return {
        ...next,
        activity: logEvent(
          next,
          'invoice_sent',
          action.actor,
          `Sent ${action.invoiceId} to ${clientName(state, target.clientId)}`,
          { invoiceId: action.invoiceId, clientId: target.clientId }
        ),
      };
    }

    case 'MARK_INVOICE_PAID': {
      const target = state.invoices.find((inv) => inv.id === action.invoiceId);
      if (!target || target.status !== 'sent') return state;
      const next = updateInvoice(state, action.invoiceId, (inv) => ({
        ...inv,
        status: 'paid',
        paidAt: new Date().toISOString(),
        amountReceived: action.amountReceived,
      }));
      const diff = action.amountReceived - target.amount;
      const diffNote = diff !== 0 ? ` (received ${formatMoney(action.amountReceived, target.currency)}, invoice was ${formatMoney(target.amount, target.currency)})` : '';
      return {
        ...next,
        activity: logEvent(next, 'invoice_paid', action.actor, `Marked ${action.invoiceId} paid${diffNote}`, {
          invoiceId: action.invoiceId,
          clientId: target.clientId,
        }),
      };
    }

    case 'SCHEDULE_REMINDER': {
      const target = state.invoices.find((inv) => inv.id === action.invoiceId);
      if (!target) return state;
      const next = updateInvoice(state, action.invoiceId, (inv) => ({
        ...inv,
        reminders: [...inv.reminders, action.reminder],
      }));
      return {
        ...next,
        activity: logEvent(
          next,
          'reminder_scheduled',
          action.reminder.createdBy,
          `Set a reminder on ${action.invoiceId} for ${action.reminder.dueDate}`,
          { invoiceId: action.invoiceId, clientId: target.clientId }
        ),
      };
    }

    case 'LOG_CLIENT_REPLY': {
      const target = state.invoices.find((inv) => inv.id === action.invoiceId);
      if (!target) return state;
      const next = updateInvoice(state, action.invoiceId, (inv) => ({
        ...inv,
        replies: [...inv.replies, action.reply],
      }));
      const label = action.reply.quarantined ? 'Quarantined reply logged' : 'Reply logged';
      return {
        ...next,
        activity: logEvent(next, 'client_reply_logged', 'agent', `${label} on ${action.invoiceId}`, {
          invoiceId: action.invoiceId,
          clientId: target.clientId,
        }),
      };
    }

    default:
      return state;
  }
}
