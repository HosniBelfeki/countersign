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

let entries: ToolCallLogEntry[] = [];
const listeners = new Set<Listener>();

/** Module-level pub/sub so any tool's execute() can log a call without needing React context. */
export function recordToolCall(entry: ToolCallLogEntry): void {
  entries = [entry, ...entries].slice(0, 50);
  listeners.forEach((listener) => listener());
}

export function subscribeToolLog(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToolLogSnapshot(): ToolCallLogEntry[] {
  return entries;
}
