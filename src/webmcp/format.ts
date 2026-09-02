/** Chrome's tool-security guidance recommends a 1.5K character budget per tool output. */
export function clamp1500(text: string): string {
  if (text.length <= 1500) return text;
  return `${text.slice(0, 1497)}...`;
}
