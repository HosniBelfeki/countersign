/** Feature-detect WebMCP per the spec's own guidance — never assume support. */
export function isModelContextSupported(): boolean {
  return typeof document !== 'undefined' && 'modelContext' in document;
}
