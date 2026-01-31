import { IProduct } from "types";

type Match =
  | {
      found: true;
      product: IProduct;
      score: number;
      reason: string;
      ambiguous: boolean;
    }
  | {
      found: false;
      score: number;
      reason: string;
      ambiguous: true;
    };

type Entity = {
  name: string;
  observations: string | null;
  quantity: number;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu, "") // remove some emojis
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // keep letters/numbers/space
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-z ]/g, "");
}

// simple levenshtein
function levenshtein(a: string, b: string): number {
  const A = a.split("");
  const B = b.split("");
  const dp: number[][] = Array(A.length + 1)
    .fill(0)
    .map(() => Array(B.length + 1).fill(0));
  for (let i = 0; i <= A.length; i++) dp[i][0] = i;
  for (let j = 0; j <= B.length; j++) dp[0][j] = j;
  for (let i = 1; i <= A.length; i++) {
    for (let j = 1; j <= B.length; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[A.length][B.length];
}

function tokenSet(s: string) {
  if (!s) return [];
  return normalize(s).split(" ").filter(Boolean);
}

/**
 * Score a product for an entity text.
 * We combine:
 *  - token overlap (name, tags, description)
 *  - exact token presence (word boundary) bonus
 *  - normalized levenshtein penalty
 *  - active/product availability
 *  - sales boost
 */
function scoreProduct(entityRaw: string, product: IProduct, maxSales: number) {
  const e = normalize(entityRaw);
  const eTokens = tokenSet(e);

  const name = normalize(product.name);
  const nameTokens = tokenSet(name);
  const desc = normalize(product.description || "");
  const descTokens = tokenSet(desc);
  const tags = (product.tags || []).map(normalize);

  // token overlap counts
  let overlap = 0;
  for (const t of eTokens) {
    if (nameTokens.includes(t)) overlap += 3; // strong if in name
    else if (tags.some((tg) => tg.includes(t))) overlap += 2;
    else if (descTokens.includes(t)) overlap += 1;
  }

  // exact phrase match bonus
  const exactPhrase = name.includes(e) ? 10 : 0;

  // levenshtein normalized: smaller distance => higher score
  const lev = levenshtein(e, name);
  // normalized similarity between 0 and 1 (1: identical)
  const maxLen = Math.max(e.length, name.length, 1);
  const levSim = 1 - lev / maxLen;

  // penalize when name has many extra tokens compared to entity (prefer shorter exact)
  // eTokens inside nameTokens ratio:
  const matchedTokenCount = eTokens.filter((t) =>
    nameTokens.includes(t)
  ).length;
  const extraTokensPenalty = Math.max(
    0,
    (nameTokens.length - matchedTokenCount) * 0.5
  );

  // active flag
  const activeBonus = product.active ? 1.0 : 0.2;

  // sales boost normalized 0..1
  const salesNorm = maxSales > 0 ? product.sales / maxSales : 0;
  const salesBoost = 1 + salesNorm * 0.25; // up to +25%

  // final weighted score
  const score =
    ((overlap * 1.2 + exactPhrase * 1.0 + levSim * 5.0) * activeBonus -
      extraTokensPenalty) *
    salesBoost;

  // reason string for debugging
  const reason = [
    `overlap=${overlap}`,
    `exactPhrase=${exactPhrase}`,
    `levSim=${levSim.toFixed(2)}`,
    `extraPenalty=${extraTokensPenalty}`,
    `active=${product.active}`,
    `salesNorm=${salesNorm.toFixed(2)}`,
  ].join(", ");

  return { score, reason };
}

function isBaseProduct(entity: string, productName: string): boolean {
  const e = normalize(entity);
  const p = normalize(productName);

  // Exemplo: "pastel de frango" não deveria casar com
  // "pastel de frango com catupiry"
  return p === e;
}

export function resolveAmbiguity(entityName: string, matches: Match[]): Match {
  const validMatches = matches.filter((m) => m.found === true) as Extract<
    Match,
    { found: true }
  >[];

  if (!validMatches.length) {
    return {
      found: false,
      score: 0,
      reason: "no valid matches",
      ambiguous: true,
    };
  }

  // PRIORIDADE 1: match base exato
  const exact = validMatches.find((m) =>
    isBaseProduct(entityName, m.product.name)
  );

  if (exact) {
    return { ...exact, ambiguous: false };
  }

  // PRIORIDADE 2: score mínimo para sugerir
  const top = validMatches[0];

  // Se o score for fraco -> não sugerir substituição automática
  if (top.score < 2.2) {
    return {
      found: false,
      score: top.score,
      reason: "low confidence match",
      ambiguous: true,
    };
  }

  // Aqui é uma ambiguidade REAL (ex: "pastel" genérico)
  return {
    ...top,
    ambiguous: true,
  };
}

export function matchEntityToProduct(
  entity: Entity,
  products: IProduct[]
): Match {
  const maxSales = products.reduce((m, p) => Math.max(m, p.sales || 0), 0);

  if (!products.length) {
    return {
      found: false,
      score: 0,
      reason: "empty catalog",
      ambiguous: true,
    };
  }

  const scored = products.map((p) => {
    const s = scoreProduct(entity.name, p, maxSales);
    return {
      found: true,
      product: p,
      score: s.score,
      reason: s.reason,
      ambiguous: false,
    } as Extract<Match, { found: true }>;
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.product.sales || 0) - (a.product.sales || 0);
  });

  const top = scored[0];
  const second = scored[1];

  const ambiguous =
    !top ||
    top.score < 1.5 ||
    (second && top.score - second.score < Math.max(0.5, top.score * 0.12));

  if (!top) {
    return {
      found: false,
      score: 0,
      reason: "no candidates",
      ambiguous: true,
    };
  }

  if (ambiguous) {
    const resolved = resolveAmbiguity(entity.name, scored);

    // Nunca transforme um "não encontrado" em produto válido
    if (!resolved.found) {
      return resolved;
    }

    // Só deixa passar se a confiança for minimamente aceitável
    if (resolved.score < 2.2) {
      return {
        found: false,
        score: resolved.score,
        reason: "low confidence after disambiguation",
        ambiguous: true,
      };
    }

    return resolved;
  }

  return {
    ...top,
    ambiguous: false,
  };
}

/**
 * Map an array of entities (with duplicates) to products.
 * Returns array of matched products (one entry per entity) and an ambiguous list.
 */
export function mapEntitiesToProducts(
  entities: Entity[],
  products: IProduct[]
) {
  const results: { entity: Entity; match: Match }[] = [];

  for (const ent of entities) {
    const match = matchEntityToProduct(ent, products);
    results.push({ entity: ent, match });
  }

  return results;
}

/**
 * Calcula a distância de Levenshtein entre duas strings.
 * @param {string} a - Primeira string.
 * @param {string} b - Segunda string.
 * @returns {number} - Distância de Levenshtein (número de edições).
 */
function levenshteinDistance(a: string, b: string) {
  const m = a.length;
  const n = b.length;

  // Cria uma matriz para armazenar as distâncias
  const dp = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Inicializa a primeira linha e coluna
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Preenche a matriz
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deleção
        dp[i][j - 1] + 1, // Inserção
        dp[i - 1][j - 1] + custo // Substituição
      );
    }
  }

  return dp[m][n];
}

export function levenshteinSimilarity(text1: string, text2: string) {
  // 2. Calcula a distância de Levenshtein
  const distance = levenshteinDistance(text1, text2);

  // 3. Encontra o comprimento máximo entre as duas strings limpas
  const maxLength = Math.max(text1.length, text2.length);

  // Se ambas as strings estiverem vazias, a similaridade é 100%
  if (maxLength === 0) return 100;

  // 4. Calcula a similaridade e a converte para porcentagem
  // Similaridade = 1 - (Distância / Comprimento Máximo)
  const similarity = 1 - distance / maxLength;

  // Retorna o resultado arredondado
  return Math.round(similarity * 100);
}

// // --- Exemplos de Uso ---
// const textoA = "Eu gosto de programar";
// const textoB = "Eu gosto de programar";
// const textoC = "Eu gosto de codificar";
// const textoD = "cachorro";
// const textoE = "gato";

// console.log(`"${textoA}" vs "${textoB}": ${levenshteinSimilarity(textoA, textoB)}%`);
// console.log(`"${textoA}" vs "${textoC}": ${levenshteinSimilarity(textoA, textoC)}%`);
// console.log(`"${textoD}" vs "${textoE}": ${levenshteinSimilarity(textoD, textoE)}%`);
// console.log(`"teste" vs "tostao": ${levenshteinSimilarity("teste", "tostao")}%`);
