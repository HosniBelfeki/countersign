export function RefreshIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.6-3.88M13.5 2v3.5H10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
