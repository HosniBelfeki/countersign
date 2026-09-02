export type ConfirmTier = 'light' | 'heavy';

interface ConfirmRequestBase {
  id: string;
  tier: ConfirmTier;
  title: string;
  invoiceId: string;
  clientName: string;
}

export interface SendInvoiceConfirmRequest extends ConfirmRequestBase {
  tier: 'light';
  kind: 'send_invoice';
  amount: number;
  currency: string;
}

export interface MarkPaidConfirmRequest extends ConfirmRequestBase {
  tier: 'heavy';
  kind: 'mark_invoice_paid';
  invoiceAmount: number;
  amountReceived: number;
  currency: string;
  mismatch: boolean;
}

export type ConfirmRequest = SendInvoiceConfirmRequest | MarkPaidConfirmRequest;

export interface ConfirmOutcome {
  approved: boolean;
  reason: 'approved' | 'declined' | 'aborted';
}

interface QueueEntry {
  request: ConfirmRequest;
  resolve: (outcome: ConfirmOutcome) => void;
}

type Listener = () => void;

let queue: QueueEntry[] = [];
// useSyncExternalStore compares snapshots by reference — getSnapshot must
// return the SAME array until the queue actually changes, or React treats
// every read as a change and spins into "Maximum update depth exceeded".
// This is recomputed only in setQueue(), never inside the getter itself.
let requestsSnapshot: ConfirmRequest[] = [];
const listeners = new Set<Listener>();

function setQueue(next: QueueEntry[]): void {
  queue = next;
  requestsSnapshot = next.map((entry) => entry.request);
  listeners.forEach((listener) => listener());
}

export function subscribeConfirmQueue(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getConfirmQueueSnapshot(): ConfirmRequest[] {
  return requestsSnapshot;
}

/**
 * Called from inside a gated tool's execute(). The promise settles when the
 * human approves or declines via the UI, or the instant `signal` aborts —
 * it can never hang a confirmation forever, which would otherwise deadlock
 * every later tool call queued behind it.
 */
export function requestConfirmation(request: ConfirmRequest, signal: AbortSignal): Promise<ConfirmOutcome> {
  return new Promise((resolvePromise) => {
    if (signal.aborted) {
      resolvePromise({ approved: false, reason: 'aborted' });
      return;
    }

    const settle = (outcome: ConfirmOutcome) => {
      signal.removeEventListener('abort', onAbort);
      setQueue(queue.filter((entry) => entry.request.id !== request.id));
      resolvePromise(outcome);
    };

    const onAbort = () => settle({ approved: false, reason: 'aborted' });

    signal.addEventListener('abort', onAbort, { once: true });
    setQueue([...queue, { request, resolve: settle }]);
  });
}

/** Called by ConfirmDialog when the human clicks Approve or Decline. */
export function resolveConfirmation(requestId: string, outcome: ConfirmOutcome): void {
  const entry = queue.find((e) => e.request.id === requestId);
  entry?.resolve(outcome);
}
