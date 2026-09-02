/** The "subtle Spark icon" the design spec calls for on agent-triggered content. */
export function SparkIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 1.5c.2 0 .38.13.44.32l1.1 3.44 3.44 1.1a.46.46 0 0 1 0 .88l-3.44 1.1-1.1 3.44a.46.46 0 0 1-.88 0l-1.1-3.44-3.44-1.1a.46.46 0 0 1 0-.88l3.44-1.1 1.1-3.44A.46.46 0 0 1 8 1.5Z" />
    </svg>
  );
}
