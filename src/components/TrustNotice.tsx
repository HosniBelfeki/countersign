/**
 * States the confirmation contract in plain language, visible without
 * reading the README. Placed in the client rail's otherwise-empty lower
 * space — inspired by WanderNote's "Your agent is invited" card and
 * Margin Editor's "Saved on this device" local-first messaging, both from
 * OpenAI's own WebMCP showcase.
 */
export function TrustNotice() {
  return (
    <div className="mt-4 rounded-md border border-outline-variant bg-surface-container-lowest p-3">
      <p className="text-xs font-semibold text-on-surface">Working with your agent</p>
      <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
        It can draft invoices, search the ledger, and log client replies on its own. Sending an
        invoice or marking one paid always asks you first.
      </p>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-outline-variant pt-2.5 text-[11px] text-on-surface-variant">
        <span className="h-1.5 w-1.5 rounded-full bg-outline" aria-hidden="true" />
        Stored only in this browser — no account, no server.
      </div>
    </div>
  );
}
