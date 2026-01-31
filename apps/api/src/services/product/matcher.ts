import { levenshtein } from "../text/levenshtein";

export const SALES_THRESHOLD = 100; // ajuste: diferença mínima pra desempatar (configurável)

export function levenshteinNormalized(a: string, b: string) {
  const dist = levenshtein(a, b);
  const max = Math.max(a.length, b.length);
  return max === 0 ? 0 : (1 - dist / max) * 100; // 0..100
}

// tenta match exato por sub-string primeiro
export function scoreByNameMatch(chunk: string, candidateName: string) {
  if (candidateName === chunk) return 100;
  if (candidateName.includes(chunk)) return 95;
  // usar levenshtein para fuzzy
  return levenshteinNormalized(chunk, candidateName);
}

// resolve desempate por sales:
// se top.sales / second.sales >= ratio -> retorna só top
export function tieBreakBySales(
  sortedCandidates: { id: string; score: number; sales: number }[],
  ratio = (a: number, b: number) => a >= b + SALES_THRESHOLD
) {
  if (sortedCandidates.length < 2) return sortedCandidates;
  const top = sortedCandidates[0];
  const second = sortedCandidates[1];
  if (top.sales > second.sales && top.sales - second.sales >= SALES_THRESHOLD) {
    // apenas top
    return [top];
  }
  return sortedCandidates;
}
