export type Actor = 'human' | 'agent';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface Client {
  id: string;
  name: string;
  email: string;
  rate: number;
  currency: string;
  createdBy: Actor;
  createdAt: string;
}

export interface Reminder {
  id: string;
  dueDate: string;
  note: string;
  createdBy: Actor;
  createdAt: string;
}

export interface ClientReply {
  id: string;
  text: string;
  quarantined: boolean;
  matchedPatterns: string[];
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  projectDesc: string;
  amount: number;
  currency: string;
  terms: string;
  dueDate: string;
  status: InvoiceStatus;
  notes: string;
  createdBy: Actor;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  amountReceived?: number;
  reminders: Reminder[];
  replies: ClientReply[];
}

export type ActivityKind =
  | 'client_added'
  | 'invoice_drafted'
  | 'invoice_edited'
  | 'invoice_sent'
  | 'invoice_send_declined'
  | 'invoice_paid'
  | 'invoice_paid_declined'
  | 'reminder_scheduled'
  | 'client_reply_logged';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  actor: Actor;
  summary: string;
  invoiceId?: string;
  clientId?: string;
  createdAt: string;
}

export interface LedgerState {
  clients: Client[];
  invoices: Invoice[];
  activity: ActivityEvent[];
}
