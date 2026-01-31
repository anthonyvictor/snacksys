import { IProduct } from "types";
import { tokenizeProduct } from "./tokenizeProduct";

export function scoreMatch(tokens: string[], p: IProduct) {
  // const { name, tags, desc, sales } = tokenizeProduct(p);
  // let score = 0;
  // for (const t of tokens) {
  //   // match em nome – peso maior
  //   for (const nt of name) {
  //     const dist = levenshtein(t, nt);
  //     score += Math.max(0, (10 - dist) * 3);
  //   }
  //   // match em tags – peso médio
  //   for (const tg of tags) {
  //     const dist = levenshtein(t, tg);
  //     score += Math.max(0, (10 - dist) * 2);
  //   }
  //   // match em descrição – peso baixo
  //   for (const d of desc) {
  //     const dist = levenshtein(t, d);
  //     score += Math.max(0, (10 - dist) * 1);
  //   }
  // }
  // // bônus de vendas se houver empate
  // score += Math.log(sales + 1);
  // return score;
}
