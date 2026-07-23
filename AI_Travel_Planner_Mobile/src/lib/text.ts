/** Text cleanup helpers for AI-generated content. */

/**
 * Strip stray wrapping quotes/whitespace the LLM sometimes leaves in names,
 * e.g. `""Digha, West Bengal` -> `Digha, West Bengal`. Internal punctuation is
 * preserved.
 */
export function cleanText(s?: string | null): string {
  if (!s) return '';
  return String(s)
    .replace(/^[\s"'“”‘’]+/, '') // leading quotes/space
    .replace(/[\s"'“”‘’]+$/, '') // trailing quotes/space
    .replace(/\s+/g, ' ')
    .trim();
}

/** A destination name that is safe/clean to display. */
export function cleanTitle(name?: string | null, fallback = 'Your trip'): string {
  const c = cleanText(name);
  return c || fallback;
}
