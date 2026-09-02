/** Sequential, human-readable invoice IDs — the format an agent and a human both read comfortably. */
export function nextInvoiceId(existing: { id: string }[]): string {
  const nums = existing
    .map((inv) => Number(inv.id.replace('INV-', '')))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 1034;
  return `INV-${max + 1}`;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
