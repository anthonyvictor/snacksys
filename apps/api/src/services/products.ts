import { IProduct } from "types";
// import { normalize } from "./format";
// import { levenshteinSimilarity } from "./levenshtein";

// export function findProduct(_arr: IProduct[], _query: string) {
//   const query = normalize(_query);
//   const arr = _arr.map((x) => ({
//     ...x,
//     normalizedName: normalize(x.name),
//     normalizedDesc: x.description ? normalize(x.description) : "",
//   }));
//   const fullNameMatch = arr.find(
//     (x) => levenshteinSimilarity(x.normalizedName, query) >= 90
//   );

//   if (fullNameMatch) return fullNameMatch as IProduct;

//   return _query;
// }

interface IFoundProduct extends IProduct {
  quantity: number;
}

// TypeScript - robust order interpreter (multi-item, quantities, fuzzy)

// ------------------ utilitários ------------------
function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function fuzzySimilarity(a: string, b: string): number {
  if (!a.length || !b.length) return 0;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - dist / maxLen;
}

// converts "dois" -> 2, "um" ->1 etc. up to 20 (extend as needed)
const NUM_WORDS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
};

// extract first numeric token in a text (digits or number words) - returns null if none
function extractQuantityFromSegment(seg: string): number | null {
  // try digits first
  const m = seg.match(/(\d+)(?!\w)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  // try number words
  for (const [word, val] of Object.entries(NUM_WORDS)) {
    const rx = new RegExp(`\\b${word}\\b`, "i");
    if (rx.test(seg)) return val;
  }
  return null;
}

// split user text into candidate segments likely to represent items
function splitIntoSegments(text: string): string[] {
  // split by common separators: ",", " e ", " & ", " / ", ";"
  // keep short phrases together: "2 de carne", "um de frango e uma pepsi" -> ["2 de carne","um de frango","uma pepsi"]
  const normalized = text.replace(/\s*[,;\/]\s*/g, " | "); // unify separators
  // also split on " e " but avoid splitting numbers like "pegar 2 e 3" (rare)
  const pieces = normalized
    .split("|")
    .flatMap((p) => p.split(/\s+e\s+/))
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return pieces;
}

interface MatchScore {
  product: IProduct;
  score: number;
  nameSim: number;
  tokenMatches: number;
}

export function findProducts(
  menu: IProduct[],
  rawText: string,
  opts?: {
    fuzzyThreshold?: number; // min similarity to accept a fuzzy match (0-1)
    preferExactNameMatch?: boolean;
  }
): IFoundProduct[] {
  const fuzzyThreshold = opts?.fuzzyThreshold ?? 0.55; // tuneable
  const preferExactNameMatch = opts?.preferExactNameMatch ?? true;

  const text = normalize(rawText);

  // quick negative checks
  if (
    !text ||
    /adicionar outros itens|adicionar outros|outros itens|quero adicionar|quero outros/i.test(
      rawText
    )
  ) {
    return [];
  }

  // prepare menu maps for faster lookup
  const menuActive = menu.filter((m) => m.active !== false); // ignore inactive
  const menuById = new Map(menuActive.map((m) => [m.id, m]));
  const menuByName = new Map(menuActive.map((m) => [normalize(m.name), m]));
  const menuTokens = menuActive.map((m) => ({
    product: m,
    normName: normalize(m.name),
  }));

  const segments = splitIntoSegments(rawText);

  const resultsMap = new Map<string, IFoundProduct>();

  for (const segRaw of segments) {
    const seg = normalize(segRaw);
    if (!seg) continue;

    // 1) if segment includes explicit id pattern, match by id (common when client sends array with ids)
    const idMatch = segRaw.match(/([a-f0-9]{24})/i);
    if (idMatch) {
      const id = idMatch[1];
      const prod = menuById.get(id);
      if (prod) {
        const q = extractQuantityFromSegment(segRaw) ?? 1;
        const existing = resultsMap.get(prod.id);
        if (existing) existing.quantity += q;
        else resultsMap.set(prod.id, { ...prod, quantity: q });
      }
      continue;
    }

    // 2) extract explicit quantity in this segment
    const quantity = extractQuantityFromSegment(segRaw) ?? 1;

    // 3) try exact name match (best)
    let chosen: IProduct | null = null;
    // try exact normalized name
    for (const [nameKey, prod] of menuByName) {
      // require whole word inclusion: e.g., "pepsi" matches "refrigerante pepsi 1l"
      if (seg.includes(nameKey) || nameKey.includes(seg)) {
        chosen = prod;
        break;
      }
    }
    if (chosen && preferExactNameMatch) {
      const existing = resultsMap.get(chosen.id);
      if (existing) existing.quantity += quantity;
      else resultsMap.set(chosen.id, { ...chosen, quantity });
      continue;
    }

    // 4) fuzzy scoring across menu
    const scores: MatchScore[] = [];
    for (const { product, normName } of menuTokens) {
      // compute name similarity and token matches
      const nameSim = fuzzySimilarity(seg, normName);
      // token match count: how many tokens in seg appear in product name
      const segTokens = seg.split(" ").filter(Boolean);
      const tokenMatches = segTokens.reduce(
        (acc, t) => acc + (normName.includes(t) ? 1 : 0),
        0
      );

      // normalized sales factor (simple): scale sales to small value to influence tie-break
      const salesFactor =
        (product.sales || 0) > 0 ? Math.min(1, (product.sales || 0) / 1000) : 0;

      const score =
        nameSim * 0.7 +
        (tokenMatches / Math.max(1, segTokens.length)) * 0.2 +
        salesFactor * 0.1;

      scores.push({ product, score, nameSim, tokenMatches });
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 0) continue;

    const top = scores[0];

    // Accept only if above fuzzyThreshold (either normalized similarity or combined score)
    if (top.nameSim >= 0.85 || top.score >= fuzzyThreshold) {
      const prod = top.product;
      const existing = resultsMap.get(prod.id);
      if (existing) existing.quantity += quantity;
      else resultsMap.set(prod.id, { ...prod, quantity });
    } else {
      // no confident match -> ignore segment (do not invent)
      continue;
    }
  }

  // return as array
  return Array.from(resultsMap.values());
}
