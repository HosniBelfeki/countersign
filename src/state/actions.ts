import type { Actor, Client, ClientReply, Invoice, Reminder, LedgerState } from '../types';

export type Action =
  | { type: 'LOAD_STATE'; state: LedgerState }
  | { type: 'ADD_CLIENT'; client: Client }
  | { type: 'DRAFT_INVOICE'; invoice: Invoice }
  | { type: 'EDIT_INVOICE'; invoiceId: string; patch: Partial<Invoice>; actor: Actor }
  | { type: 'SEND_INVOICE'; invoiceId: string; actor: Actor }
  | { type: 'MARK_INVOICE_PAID'; invoiceId: string; amountReceived: number; actor: Actor }
  | { type: 'SCHEDULE_REMINDER'; invoiceId: string; reminder: Reminder }
  | { type: 'LOG_CLIENT_REPLY'; invoiceId: string; reply: ClientReply };
