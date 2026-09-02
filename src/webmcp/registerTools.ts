import { useEffect, useState } from 'react';
import { isModelContextSupported } from './detect';
import type { ModelContextTool } from './modelContext';

export type RegistrationStatus =
  | { state: 'unsupported' }
  | { state: 'registering' }
  | { state: 'registered'; count: number }
  | { state: 'error'; message: string };

/**
 * Registers a stable list of WebMCP tools for the lifetime of the calling
 * component. `tools` MUST be referentially stable (e.g. built once via
 * useMemo/useState-initializer) — this effect re-runs whenever it changes.
 *
 * Correctness notes (verified against the spec, not assumed):
 * - registerTool REJECTS with InvalidStateError on a duplicate tool name; it
 *   does not silently replace. React StrictMode double-invokes this effect
 *   (mount → cleanup → mount), so if cleanup didn't run first, the second
 *   registerTool call would throw.
 * - The AbortController is created fresh INSIDE the effect and only ever
 *   aborts its own pass's registrations — never shared across renders/module
 *   scope. That's what guarantees cleanup unregisters pass 1 before pass 2
 *   registers, and what stops a stale pass from ever aborting a live one.
 */
export function useRegisterWebMCPTools(tools: ModelContextTool[]): RegistrationStatus {
  const [status, setStatus] = useState<RegistrationStatus>(() =>
    isModelContextSupported() ? { state: 'registering' } : { state: 'unsupported' }
  );

  useEffect(() => {
    if (!isModelContextSupported()) {
      setStatus({ state: 'unsupported' });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setStatus({ state: 'registering' });

    (async () => {
      for (const tool of tools) {
        if (cancelled) return;
        await document.modelContext.registerTool(tool, { signal: controller.signal });
      }
      if (!cancelled) setStatus({ state: 'registered', count: tools.length });
    })().catch((error: unknown) => {
      if (controller.signal.aborted) return; // expected on cleanup, not a real error
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [tools]);

  return status;
}
