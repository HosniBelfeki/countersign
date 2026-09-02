import { useLedger } from '../state/LedgerProvider';
import { formatDate } from '../lib/dates';
import { SparkIcon } from './SparkIcon';

/** Human vs agent attribution, sourced straight from the reducer's activity log. Rendered inline, no wrapper aside. */
export function ActivityFeed() {
  const { state } = useLedger();

  return (
    <div className="max-h-56 overflow-y-auto border-b border-outline-variant p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Activity
      </h2>
      {state.activity.length === 0 && (
        <div className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-outline-variant py-6 text-center">
          <span className="text-lg text-outline" aria-hidden="true">
            ⋯
          </span>
          <p className="text-xs text-on-surface-variant">Nothing yet — actions will appear here.</p>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {state.activity.slice(0, 30).map((event) => (
          <li key={event.id} className="rounded-md border border-outline-variant p-2 text-xs">
            <div className="flex items-center gap-1.5">
              {event.actor === 'agent' ? (
                <SparkIcon className="h-2.5 w-2.5 text-agent" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
              <span className={`font-medium capitalize ${event.actor === 'agent' ? 'text-agent' : ''}`}>
                {event.actor}
              </span>
              <span className="text-on-surface-variant">· {formatDate(event.createdAt)}</span>
            </div>
            <p className="mt-1 text-on-surface">{event.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
