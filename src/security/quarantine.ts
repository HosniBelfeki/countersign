export interface QuarantineResult {
  quarantined: boolean;
  matchedPatterns: string[];
}

const PATTERNS: { label: string; regex: RegExp }[] = [
  { label: 'ignore previous', regex: /ignore\s+(all\s+)?previous/i },
  { label: 'disregard', regex: /disregard/i },
  { label: 'system:', regex: /system\s*:/i },
  { label: 'mark … as paid', regex: /mark\s+.{0,20}\bas\s+paid\b/i },
  { label: 'you are now', regex: /you\s+are\s+now/i },
  { label: 'new instructions', regex: /new\s+instructions?/i },
  { label: 'forget previous', regex: /forget\s+(everything|your)/i },
  { label: 'override', regex: /override/i },
];

/** Runs on every logged client reply. Flags instruction-shaped phrasing without ever blocking the log itself. */
export function scanForInjection(text: string): QuarantineResult {
  const matched = PATTERNS.filter((p) => p.regex.test(text)).map((p) => p.label);
  return { quarantined: matched.length > 0, matchedPatterns: matched };
}
