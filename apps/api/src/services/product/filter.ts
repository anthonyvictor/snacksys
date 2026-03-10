import { IProduct } from "types";
import { levenshtein } from "../text/levenshtein";
import { tokenize } from "../text/tokenize";
import { replacePaymentsText } from "../messages/replace/payments";
import { replaceDeliveryText } from "../messages/replace/delivery";
import { replaceProductsText } from "../messages/replace/products";
import { removeAccents } from "../format";

function fuzzyMatch(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4) return false;
  return levenshtein(a, b) <= 2;
}

function prepareProductsMsg(originalMessage: string): string {
  const msg = replaceProductsText(
    replaceDeliveryText(
      replacePaymentsText(
        removeAccents(originalMessage.toLowerCase())
          .replace(/[^0-9a-z ]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(
            /\b((d(e|o|a)s?)|co?m|sem?|tem|pa?ra|por|os?|as?|em?|ou|n(o|a)s?|u(m|n)a?s?)\b/g,
            "",
          )

          .replace(/\b(o(q|k)u?e?)\b/g, "")
          .replace(/\b(q|qe|ki|ke)\b/g, "")
          .replace(/\b(c(o|u)a(l|is)|quais)\b/g, "")
          .replace(/\b(a(qu?i?e?|ki))\b/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .replace(
            /\b((pr?a?\s+)?e(n|m)tr?egar?|deliver(y|e)|frete?|((pr?a?|se)\s+)?tra(z|s)er?|trou(x|s)er)\b/g,
            "",
          )
          .replace(/\b(paga?(mento|r)?.*())\b/g, "")

          .replace(/\b(os?|as?|e)\b/g, "")
          .replace(
            /\b(eu|tu|noi?s|me|gent(e|i)?|galera|povos?|pessoal|el(e|a|i)s?|tu|vo?ce?s?)\b/g,
            "",
          )

          // ORDENS
          .replace(
            /\b((q|k)u?e?r(o|u|emos?)?|adi?cion(e|a)|colo(que|ca)|bot(a|e)|ad|(vei?(ja)?|mand|en(v|f)i)(ar?|e)(\s+ai)?|v(ou?|ai|amos?)\s+quer(o|er?)|querem(os)?|tra(s|z))\b/g,
            "",
          )

          .replace(
            /(?<!\b(codigo|pix)\s)\bqr\b(?!\s*(pix|((qr)?cod(igo|e)?)))/g,
            "",
          ),
        true,
      )
        .replace(/\s+/g, " ")
        .trim(),
      true,
    )
      .replace(/\s+/g, " ")
      .trim(),
  )
    .replace(/\s+/g, " ")
    .trim();

  console.log("\n\nNORMALIZED", msg, "\n\n-----");

  return msg;

  //   const tokens = tokenize(msg, true);

  //   return products.filter((product) => {
  //     const nameTokens = tokenize(product.name, true);
  //     const tagTokens = product.tags?.flatMap((x) => tokenize(x, true)) || [];
  //     const descTokens = product.description
  //       ? tokenize(product.description, true)
  //       : [];

  //     return tokens.some((token) => {
  //       // prioridade 1 — nome
  //       if (
  //         nameTokens.some(
  //           (nt) =>
  //             nt.includes(token) || token.includes(nt) || fuzzyMatch(nt, token)
  //         )
  //       )
  //         return true;

  //       // prioridade 2 — tags
  //       if (
  //         tagTokens.some(
  //           (tt) =>
  //             tt.includes(token) || token.includes(tt) || fuzzyMatch(tt, token)
  //         )
  //       )
  //         return true;

  //       // prioridade 3 — descrição (bem mais permissivo)
  //       if (descTokens.some((dt) => dt.includes(token) || fuzzyMatch(dt, token)))
  //         return true;

  //       return false;
  //     });
  //   });
}

export function findProductCandidates(
  products: IProduct[],
  customerText: string,
): Array<IProduct & { score: number; matchedWords: string[] }> {
  const normalizedText = prepareProductsMsg(customerText);

  const customerTokens = tokenize(normalizedText).filter((t) => t.length >= 4);

  const wordFrequency = buildWordFrequency(products);
  const totalProducts = products.length;

  const MAX_FREQ_RATIO = 0.5;

  const relevantCustomerTokens = customerTokens.filter((token) => {
    return true;
    // const freq = wordFrequency.get(token) ?? 0;
    // return freq / totalProducts < MAX_FREQ_RATIO;
  });

  return products
    .map((product) => {
      const nameTokens = new Set(
        tokenize(product.name).filter((t) => t.length >= 4),
      );
      const tagTokens = new Set(
        (product.tags ?? [])
          .flatMap((t) => tokenize(t))
          .filter((t) => t.length >= 4),
      );
      const descTokens = new Set(
        tokenize(product.description ?? "").filter((t) => t.length >= 4),
      );

      let score = 0;
      const matchedWords: string[] = [];

      for (const token of relevantCustomerTokens) {
        let matched = false;

        if (matchesToken(token, nameTokens)) {
          score += 7;
          matched = true;
        } else if (matchesToken(token, tagTokens)) {
          score += 3;
          matched = true;
        } else if (matchesToken(token, descTokens)) {
          score += 1;
          matched = true;
        }

        if (matched) matchedWords.push(token);
      }

      return {
        ...product,
        score,
        matchedWords,
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score);
  // .filter((x, _, self) => {
  //   if (self.filter((x) => x.score >= 7).length > self.length / 2) {
  //     return x.score >= 7;
  //   } else if (self.filter((x) => x.score > 3).length > self.length / 2) {
  //     return x.score >= 3;
  //   } else {
  //     return true;
  //   }
  // });
}

function matchesToken(token: string, tokens: Set<string>): boolean {
  for (const t of tokens) {
    if (t === token || t.includes(token) || token.includes(t)) {
      return true;
    }
  }
  return false;
}

function buildWordFrequency(products: IProduct[]): Map<string, number> {
  const freq = new Map<string, number>();

  for (const p of products) {
    const words = new Set(
      tokenize(`${p.name} ${p.description ?? ""} ${(p.tags ?? []).join(" ")}`),
    );

    for (const w of words) {
      if (w.length < 4) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }

  return freq;
}
