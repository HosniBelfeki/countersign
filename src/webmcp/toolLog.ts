export interface ToolCallLogEntry {
  id: string;
  toolName: string;
  input: unknown;
  output: string;
  isError: boolean;
  durationMs: number;
  createdAt: string;
}

type Listener = () => void;

interface ToolLogStore {
  entries: ToolCallLogEntry[];
  listeners: Set<Listener>;
}

/**
 * The store hangs off globalThis, not off module scope.
 *
 * Why: a tool's execute() closes over recordToolCall at REGISTRATION time, but
 * ToolConsole subscribes at RENDER time. If this module is ever instantiated
 * twice — Vite HMR replacing it after an edit is the everyday case — the
 * already-registered tools keep writing into the old copy while the panel
 * listens to the new one, and the log looks permanently empty even though every
 * call is succeeding. Anchoring the state to a single global makes both halves
 * agree no matter how many times the module is evaluated.
 */
const KEY = '__countersign_tool_log__';
const store: ToolLogStore = ((globalThis as Record<string, unknown>)[KEY] as ToolLogStore | undefined) ?? {
  entries: [],
  listeners: new Set<Listener>(),
};
(globalThis as Record<string, unknown>)[KEY] = store;

export function recordToolCall(entry: ToolCallLogEntry): void {
  store.entries = [entry, ...store.entries].slice(0, 50);
  // Also surfaced in DevTools: if the panel ever looks empty, this proves
  // whether a call actually arrived or the agent never invoked the tool.
  console.debug(
    `[webmcp] ${entry.toolName} ${entry.isError ? 'ERROR' : 'ok'} ${entry.durationMs}ms`,
    { input: entry.input, output: entry.output }
  );
  store.listeners.forEach((listener) => listener());
}

export function subscribeToolLog(listener: Listener): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

export function getToolLogSnapshot(): ToolCallLogEntry[] {
  return store.entries;
}
