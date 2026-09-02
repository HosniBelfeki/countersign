export function QuarantineNotice({ matchedPatterns }: { matchedPatterns: string[] }) {
  return (
    <div className="mt-2 rounded-md border border-warning/40 bg-warning-container px-3 py-2 text-xs text-on-warning-container">
      <div className="flex items-center gap-1.5 font-semibold">
        <span aria-hidden="true">⚠</span>
        <span>Quarantined — not acted on</span>
      </div>
      <p className="mt-1 text-on-warning-container/90">
        This text was stored as data only. Matched instruction-like phrasing:{' '}
        <span className="text-mono-label">{matchedPatterns.join(', ')}</span>
      </p>
    </div>
  );
}
