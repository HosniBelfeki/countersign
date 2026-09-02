import type { MouseEvent as ReactMouseEvent } from 'react';
import { useConfirmQueue } from '../webmcp/useConfirmQueue';
import { resolveConfirmation } from '../webmcp/confirm';
import { formatMoney } from '../lib/money';
import { SparkIcon } from './SparkIcon';

export function ConfirmDialog() {
  const queue = useConfirmQueue();
  const request = queue[0];
  if (!request) return null;

  /**
   * Approval requires a TRUSTED event.
   *
   * An agent that can call our tools can usually also script the page, and a
   * scripted `approveButton.click()` would let it approve its own request —
   * defeating the entire checkpoint. Synthetic clicks dispatched from page
   * script carry `isTrusted === false`, so we refuse them.
   *
   * Being honest about the limit: this stops in-page script (content scripts,
   * console, injected JS). It does NOT stop an agent driving the browser at the
   * input layer (CDP / WebDriver), whose clicks are indistinguishable from a
   * human's by design. Closing that gap needs a browser-mediated prompt the
   * page can request but no page-level actor can synthesise — precisely the
   * `requestUserInteraction()` primitive the WebMCP spec still lacks.
   */
  const guard =
    (outcome: { approved: boolean; reason: 'approved' | 'declined' }) =>
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (!event.isTrusted) {
        console.warn(
          '[countersign] Ignored an untrusted (script-dispatched) click on the confirmation dialog. ' +
            'Approval requires a real user gesture.'
        );
        return;
      }
      resolveConfirmation(request.id, outcome);
    };

  const decline = guard({ approved: false, reason: 'declined' });
  const approve = guard({ approved: true, reason: 'approved' });
  const isHeavy = request.tier === 'heavy';

  return (
    // "Subtle glassmorphism for overlays" — a blurred scrim behind a solid card.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-sm rounded-lg border-2 bg-surface-container-lowest p-6 shadow-modal ${
          isHeavy ? 'border-warning' : 'border-primary'
        }`}
      >
        <p
          className={`text-status-pill flex items-center gap-1.5 uppercase tracking-wide ${
            isHeavy ? 'text-warning' : 'text-primary'
          }`}
        >
          <SparkIcon className="h-3 w-3" />
          {isHeavy ? 'Heavy confirmation' : 'Confirmation'} · requested by agent
        </p>
        <h2 className="text-headline-md mt-2 text-on-surface">{request.title}</h2>

        {request.kind === 'send_invoice' && (
          <div className="mt-4 text-sm">
            <p>
              <span className="text-mono-label text-on-surface-variant">{request.invoiceId}</span> to{' '}
              {request.clientName}
            </p>
            <p className="text-headline-lg mt-1 text-on-surface">
              {formatMoney(request.amount, request.currency)}
            </p>
          </div>
        )}

        {request.kind === 'mark_invoice_paid' && (
          <div className="mt-4 text-sm">
            <p>
              <span className="text-mono-label text-on-surface-variant">{request.invoiceId}</span> —{' '}
              {request.clientName}
            </p>
            {request.mismatch ? (
              <div className="mt-2 rounded-md bg-warning-container p-3 text-on-warning-container">
                <div className="flex items-center justify-between">
                  <span>Invoiced</span>
                  <span>{formatMoney(request.invoiceAmount, request.currency)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold">
                  <span>Agent reports received</span>
                  <span>{formatMoney(request.amountReceived, request.currency)}</span>
                </div>
              </div>
            ) : (
              <p className="text-headline-lg mt-1 text-on-surface">
                {formatMoney(request.amountReceived, request.currency)}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={decline}
            className="focus-ring flex-1 rounded border border-outline-variant px-3 py-2 text-sm font-medium hover:bg-surface-container"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={approve}
            className={`focus-ring flex-1 rounded px-3 py-2 text-sm font-semibold text-white ${
              isHeavy ? 'bg-warning' : 'bg-primary'
            }`}
          >
            {request.kind === 'mark_invoice_paid' && request.mismatch
              ? `Accept ${formatMoney(request.amountReceived, request.currency)} instead of ${formatMoney(request.invoiceAmount, request.currency)}`
              : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
