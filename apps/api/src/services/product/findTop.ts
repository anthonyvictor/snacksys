// import { IProduct } from "types";
// import { cosineSimilarity } from "../text/cosineSimilarity";

// export function findTopCandidates(
//   textEmbedding: number[],
//   products: IProduct[],
//   topN = 3
// ) {
//   const scored = products.map((p) => ({
//     id: p.id,
//     name: p.name,
//     sales: p.sales,
//     similarity: cosineSimilarity(textEmbedding, p.embedding),
//   }));

//   return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topN);
// }

import { cosine } from "../text/levenshtein";

export function topK(
  queryEmb: number[],
  items: { id: string; emb: number[]; sales: number; name: string }[],
  k = 5
) {
  const scored = items.map((it) => ({
    ...it,
    score: cosine(queryEmb, it.emb),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
