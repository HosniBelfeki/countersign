export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** Never collapse a multi-currency sum into one label — render each currency's total separately. */
export function formatCurrencyBreakdown(sums: Record<string, number>): string {
  const entries = Object.entries(sums).filter(([, amount]) => amount !== 0);
  if (entries.length === 0) return formatMoney(0, 'USD');
  return entries.map(([currency, amount]) => formatMoney(amount, currency)).join(' + ');
}
