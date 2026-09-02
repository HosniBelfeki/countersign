/**
 * Ambient types for the WebMCP Imperative API.
 * Mirrors the WebIDL in the spec (https://webmachinelearning.github.io/webmcp/):
 * only `readOnlyHint` and `untrustedContentHint` exist on ToolAnnotations, and
 * `registerTool` REJECTS with InvalidStateError on a duplicate tool name — it does
 * not silently replace. This is why registration must be StrictMode-safe (see
 * webmcp/registerTools.ts).
 */

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

export interface ToolExecuteCallbackOptions {
  signal: AbortSignal;
}

export type ToolExecuteCallback = (
  input: Record<string, unknown>,
  options: ToolExecuteCallbackOptions
) => Promise<unknown>;

export interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: ToolExecuteCallback;
  annotations?: ToolAnnotations;
}

export interface ModelContextRegisterToolOptions {
  exposedTo?: string[];
  signal?: AbortSignal;
}

export interface RegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  window: Window;
  origin: string;
  annotations?: ToolAnnotations;
}

export interface ModelContextGetToolOptions {
  fromOrigins?: string[];
}

export interface ModelContextExecuteToolOptions {
  signal?: AbortSignal;
}

export interface ModelContext extends EventTarget {
  registerTool(tool: ModelContextTool, options?: ModelContextRegisterToolOptions): Promise<void>;
  getTools(options?: ModelContextGetToolOptions): Promise<RegisteredTool[]>;
  executeTool(
    tool: RegisteredTool,
    inputObject?: Record<string, unknown>,
    options?: ModelContextExecuteToolOptions
  ): Promise<string>;
  addEventListener(
    type: 'toolchange',
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

declare global {
  interface Document {
    readonly modelContext: ModelContext;
  }
}
