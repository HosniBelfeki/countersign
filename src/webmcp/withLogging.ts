import { recordToolCall } from './toolLog';
import { newId } from '../lib/ids';
import type { ToolExecuteCallbackOptions } from './modelContext';

/**
 * Wraps a tool's execute() so every call — success, decline, or error — lands
 * in the live console. Also defends against a real Chrome gap: the MANUAL
 * `document.modelContext.executeTool()` path (used by direct testing and by
 * the Model Context Tool Inspector extension) does not reliably supply the
 * `{ signal }` options object the spec calls "required" — only the agent's
 * own internal invocation path does. Without this fallback, any tool that
 * destructures `signal` (the two gated tools) throws instead of running.
 */
export function withLogging(
  name: string,
  fn: (input: Record<string, unknown>, options: ToolExecuteCallbackOptions) => Promise<string>
) {
  return async (input: Record<string, unknown>, options?: ToolExecuteCallbackOptions) => {
    const safeOptions: ToolExecuteCallbackOptions = options ?? { signal: new AbortController().signal };
    const startedAt = new Date().toISOString();
    const t0 = performance.now();
    let output = '';
    let isError = false;
    try {
      output = await fn(input, safeOptions);
      return output;
    } catch (error) {
      isError = true;
      output = error instanceof Error ? error.message : String(error);
      return output;
    } finally {
      recordToolCall({
        id: newId('call'),
        toolName: name,
        input,
        output,
        isError,
        durationMs: Math.round(performance.now() - t0),
        createdAt: startedAt,
      });
    }
  };
}
