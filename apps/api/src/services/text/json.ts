export function sanitizeJson(str: string) {
  return str
    .replace(/,\s*}/g, "}") // remove trailing commas
    .replace(/,\s*]/g, "]"); // remove trailing commas em arrays
}

export function extractJson(raw: string): string | null {
  const match = raw.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}
