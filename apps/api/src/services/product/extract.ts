import { tokenize } from "../text/tokenize";

// export function extractProducts(text: string, products: IProduct[]) {
//   const chunks = text
//     .split(/,| e /g)
//     .map(c => c.trim())
//     .filter(Boolean);

//   const results = [];

//   for (const chunk of chunks) {
//     const tokens = tokenize(chunk);
//     const quantity = extractQuantity(chunk);

//     const scored = products
//       .map(p => ({
//         id: p.id,
//         nome: p.name,
//         score: scoreMatch(tokens, p),
//       }))
//       .filter(s => s.score > 0)
//       .sort((a, b) => b.score - a.score);

//     if (scored.length === 0) continue;

//     // normalizar probabilidade
//     const totalScore = scored.reduce((sum, s) => sum + s.score, 0);

//     const produtosProvaveis = scored.map(s => ({
//       id: s.id,
//       nome: s.nome,
//       probabilidade: Number(((s.score / totalScore) * 100).toFixed(2)),
//     }));

//     results.push({
//       produtosProvaveis,
//       trecho: chunk,
//       quantidade: quantity,
//     });
//   }

//   return results;
// }

import { openAIClient } from "@/infra/openai";
import { buildMenuEmbeddings } from "../ia/embeddings";
import { topK } from "./findTop";
import { scoreByNameMatch, tieBreakBySales } from "./matcher";
// import type { IProduct, MenuEmbedding } from './types';

// tipos que você pediu no output:
export type FoundEntity = {
  candidates: { id: string; accuracy: number }[];
  quantity: number;
  chunkOfText: string;
};

export async function extractProductsFromText() {
// text: string,
// menu: IProduct[],
// menuEmbeddings?: MenuEmbedding[],
// options?: { useLlmDisambiguation?: boolean }
  // : Promise<{ foundEntities: FoundEntity[] }>
  // // assumo que text já veio normalizado (lowercase, numeros convertidos, sem acentos)
  // const words = tokenize(text);
  // // Strategy:
  // // 1) split por vírgula / " e " / "mais" pequenos heurísticos para pegar chunks (ex: "2 pasteis de frango e 1 de carne")
  // // 2) para cada chunk: criar embedding (local) e buscar topK no menuEmbeddings
  // // 3) transformar scores em accuracy (0-100), aplicar name-match boost e sales tie-break
  // // 4) se ambiguous e options.useLlmDisambiguation: fazer chamada pequena ao gpt-5-mini para decidir
  // // 5) retornar JSON conforme especificado
  // // quick chunker (heurística simples)
  // const rawChunks = text.split(/,| e | E | E | mais | plus /).map(s => s.trim()).filter(Boolean);
  // // prepare embeddings if not provided
  // let built = menuEmbeddings;
  // if (!built) {
  //   built = await buildMenuEmbeddings(menu);
  // }
  // const results: FoundEntity[] = [];
  // for (const chunk of rawChunks) {
  //   // quick check for quantity at start: "2 pasteis de frango", "1 de carne", etc.
  //   const m = chunk.match(/^(\d+)\s+(.+)$/);
  //   let quantity = 1;
  //   let chunkText = chunk;
  //   if (m) {
  //     quantity = Number(m[1]);
  //     chunkText = m[2].trim();
  //   } else {
  //     // try "um/uma" already normalized -> should be 1 by your preproc
  //     // if nothing, assume 1
  //   }
  //   // create embedding for chunk
  //   const embRes = await openAIClient.embeddings.create({
  //     model: 'text-embedding-3-small',
  //     input: [chunkText]
  //   });
  //   const qEmb = embRes.data[0].embedding as number[];
  //   // topK by cosine
  //   const k = 5;
  //   const top = topK(qEmb, built, k);
  //   // map candidates with initial accuracy from vector score (score  -1..1 -> map to 0..100)
  //   const rawCandidates = top.map(t => ({
  //     id: t.id,
  //     name: t.name,
  //     sales: t.sales,
  //     score: Math.max(0, Math.round(t.score * 100)) // approximate 0..100
  //   }));
  //   // boost for name match exactness
  //   const boosted = rawCandidates.map(c => {
  //     const nameScore = scoreByNameMatch(chunkText, c.name);
  //     // combine: 70% vector + 30% nameScore (weights empíricos)
  //     const combined = Math.round(0.7 * c.score + 0.3 * nameScore);
  //     return { ...c, combined };
  //   });
  //   // sort by combined
  //   boosted.sort((a,b)=> b.combined - a.combined);
  //   // apply sales tie-break
  //   const afterTie = tieBreakBySales(boosted.map(bc => ({ id: bc.id, score: bc.combined, sales: bc.sales })));
  //   // afterTie is array with id/score/sales
  //   let finalCandidates = boosted.filter(b => afterTie.some(at => at.id === b.id));
  //   if (finalCandidates.length === 0) {
  //     // keep top 2 if tie-break returned nothing (fallback)
  //     finalCandidates = boosted.slice(0, Math.min(2, boosted.length));
  //   }
  //   // If still ambiguous (multiple candidates with similar score), optionally call gpt-5-mini for micro-disambiguation
  //   if (options?.useLlmDisambiguation && finalCandidates.length > 1) {
  //     // prompt tiny: give the chunk and two candidate names, ask which is best (one-word answer: 0 or 1 or both)
  //     const prompt = `Você é um assistente que escolhe qual produto do cardapio corresponde ao trecho do cliente.\nTrecho: "${chunkText}"\nOpcoes:\n0: ${finalCandidates[0].name}\n1: ${finalCandidates[1].name}\nResponda apenas "0" ou "1" ou "ambos".`;
  //     const resp = await openAIClient.responses.create({
  //       model: 'gpt-5-mini',
  //       input: prompt,
  //       max_output_tokens: 10
  //     });
  //     const textResp = (resp.output_text ?? resp.output?.[0]?.content?.[0]?.text) ?? '';
  //     if (textResp.includes('0')) {
  //       finalCandidates = [finalCandidates[0]];
  //     } else if (textResp.includes('1')) {
  //       finalCandidates = [finalCandidates[1]];
  //     }
  //     // else keep both
  //   }
  //   // build output candidates with accuracy
  //   const outputCandidates = finalCandidates.map(fc => ({ id: fc.id, accuracy: Math.min(100, Math.max(0, fc.combined || fc.score)) }));
  //   if (outputCandidates.length > 0) {
  //     results.push({
  //       candidates: outputCandidates,
  //       quantity,
  //       chunkOfText: (m ? `${m[1]} ${chunkText}` : chunk)
  //     });
  //   }
  // }
  // return { foundEntities: results };
}
