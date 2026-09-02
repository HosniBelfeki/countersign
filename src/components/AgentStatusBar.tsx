import type { RegistrationStatus } from '../webmcp/registerTools';

/**
 * Terse dot-and-label pill, matching the pattern OpenAI's own WebMCP
 * showcase apps use (WanderNote, Margin Editor) rather than a heavy
 * monospace developer-console treatment — this is product chrome, not a log.
 */
export function AgentStatusBar({ status }: { status: RegistrationStatus }) {
  const { label, dotClass, textClass } = describe(status);

  return (
    <div className="text-status-pill flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <span className={textClass}>{label}</span>
    </div>
  );
}

function describe(status: RegistrationStatus) {
  switch (status.state) {
    case 'registered':
      return {
        label: (
          <>
            WebMCP · <span className="font-mono">{status.count}</span> tool
            {status.count === 1 ? '' : 's'}
          </>
        ),
        dotClass: 'bg-success',
        textClass: 'text-on-surface-variant',
      };
    case 'registering':
      return {
        label: 'WebMCP · registering…',
        dotClass: 'bg-warning animate-pulse',
        textClass: 'text-on-surface-variant',
      };
    case 'error':
      return {
        label: `WebMCP · registration failed (${status.message})`,
        dotClass: 'bg-error',
        textClass: 'text-error',
      };
    case 'unsupported':
    default:
      return {
        label: 'WebMCP not detected · open in an agent-capable browser',
        dotClass: 'bg-outline',
        textClass: 'text-outline',
      };
  }
}
