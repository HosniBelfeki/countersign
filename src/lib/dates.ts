export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysOverdue(dueDateIso: string, now: Date = new Date()): number {
  const due = new Date(dueDateIso);
  const diffMs = now.getTime() - due.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isInvoiceOverdue(status: string, dueDate: string, now: Date = new Date()): boolean {
  return status === 'sent' && daysOverdue(dueDate, now) > 0;
}
