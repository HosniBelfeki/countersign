import { useState } from 'react';
import { useToolLog } from '../webmcp/useToolLog';
import { SparkIcon } from './SparkIcon';

type ToolCategory = 'read' | 'write' | 'gated';

const READ_ONLY_TOOLS = new Set(['get_ledger_state', 'search_invoices', 'get_client']);
const GATED_TOOLS = new Set(['send_invoice', 'mark_invoice_paid']);
const UNTRUSTED_INPUT_TOOLS = new Set(['log_client_reply']);

function categoryOf(toolName: string): ToolCategory {
  if (READ_ONLY_TOOLS.has(toolName)) return 'read';
  if (GATED_TOOLS.has(toolName)) return 'gated';
  return 'write';
}

// Dark-panel-specific shades — the app's light-theme brand tokens (teal,
// indigo, amber) aren't legible at full saturation on a #1F2937 background,
// so these are chosen for contrast while echoing the same three hues: read
// stays neutral/cool, write echoes the agent-indigo used everywhere else for
// AI-authored content, gated echoes the amber reserved for high-stakes and
// mismatch states.
const CATEGORY_STYLE: Record<ToolCategory, { dot: string; text: string; label: string }> = {
  read: { dot: 'bg-sky-400', text: 'text-sky-300', label: 'read' },
  write: { dot: 'bg-indigo-400', text: 'text-indigo-300', label: 'write' },
  gated: { dot: 'bg-amber-400', text: 'text-amber-300', label: 'confirm' },
};

/**
 * The "Agent Tool-Call Block" from the design system: a dark monospace panel
 * showing raw tool activity. Each entry is color-coded by tool category
 * (read / write / confirmation-gated) so the kind of action is visible at a
 * glance, and carries the tool's real WebMCP annotations (untrustedContentHint)
 * as a visible tag rather than leaving that protocol-level detail invisible.
 */
export function ToolConsole() {
  const entries = useToolLog();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyEntry = async (id: string, input: unknown, output: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ input, output }, null, 2));
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200);
    } catch {
      // Clipboard access can be denied — the log itself is still visible, so this is non-fatal.
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-3">
      <div className="flex flex-1 flex-col overflow-y-auto rounded-lg bg-[#1F2937] p-3 shadow-panel">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tool calls
          </h2>
          {entries.length > 0 && (
            <span className="text-mono-label rounded-full bg-slate-800 px-1.5 py-0.5 text-slate-400">
              {entries.length}
            </span>
          )}
        </div>

        {entries.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-400/10">
              <SparkIcon className="h-4 w-4 text-indigo-300" />
            </span>
            <p className="text-mono-label px-6 text-slate-400">
              No tool calls yet. Ask your agent about this page.
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const category = categoryOf(entry.toolName);
            const style = CATEGORY_STYLE[category];
            const untrustedInput = UNTRUSTED_INPUT_TOOLS.has(entry.toolName);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => copyEntry(entry.id, entry.input, entry.output)}
                  title="Click to copy full input/output as JSON"
                  className={`focus-ring w-full rounded border p-2 text-left transition-colors hover:border-slate-500 ${
                    entry.isError ? 'border-red-500/50' : 'border-slate-700'
                  }`}
                >
                  <div className="text-mono-label flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${entry.isError ? 'bg-red-400' : style.dot}`}
                        aria-hidden="true"
                      />
                      <span className={entry.isError ? 'text-red-400' : style.text}>{entry.toolName}</span>
                    </span>
                    <span className="shrink-0 text-slate-500">
                      {copiedId === entry.id ? 'Copied' : `${entry.durationMs}ms`}
                    </span>
                  </div>
                  {untrustedInput && (
                    <span className="mt-1 inline-block rounded bg-amber-400/10 px-1 py-0.5 text-[10px] font-medium text-amber-300">
                      untrusted input
                    </span>
                  )}
                  <p className="text-mono-label mt-1.5 whitespace-pre-wrap break-words text-slate-300">
                    {entry.output}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
