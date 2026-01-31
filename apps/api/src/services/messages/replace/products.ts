import { getProducts } from "@/controllers/product/getProducts";
import { replaceNumbersText } from "./numbers";
import { removeTrashWords } from "./trashWords";
import { IProduct } from "types";
import { tokenize } from "@/services/text/tokenize";

export const replaceProductsText = (text: string, generic = false) => {
  const r = text

    .replace(/\b(c)\b/g, "com")
    .replace(/\b(s)\b/g, "sem")
    .replace(
      /\b(latinha|piriguete|bujudinha|lata)\b/g,
      generic ? "comida" : "lata"
    )
    .replace(/\b(suc(o|u)s?)\b/g, generic ? "comida" : "suco")
    .replace(/\b((i|y)ul(o|u))\b/g, generic ? "comida" : "suco yulo")

    .replace(
      /\b(combo?s?|promo((s+|c)(ao|oes)?)?)\b/g,
      generic ? "comida" : "promocao"
    )
    .replace(/\b(la(n|m)(ch|x)(e|i)s?)\b/g, generic ? "comida" : "lanche")
    .replace(/\b(bau?r(u|o)|bauri\w*)\b/g, generic ? "comida" : "bauru")
    .replace(/\b(es(f|p)i(rr|h)as?)\b/g, generic ? "comida" : "esfirra")
    .replace(/\b(co(x|z|ch?)i((n|m)h)?as?)\b/g, generic ? "comida" : "coxinha")
    .replace(/\b(sem ga(s|z))\b/g, generic ? "comida" : "mineral")

    .replace(/\b((c|s)e?r?vei?(j|g)as?)\b/g, generic ? "comida" : "cerveja")
    .replace(
      /\b(refr?(i|e)?(g|j)?(era(n|m)t(e|i)s?)?)\b/g,
      generic ? "comida" : "refrigerante"
    )
    .replace(
      /(\b((cola|coca|coka)\s*(coca|colar?))\b|\bcoca\b(?!\s*cola\b))/g,
      generic ? "comida" : "refrigerante coca cola"
    )
    .replace(/\b(pes?p(i|e)?si?)\b/g, generic ? "comida" : "refrigerante pepsi")
    .replace(
      /\b(sukita|su(q|k)u?ita)\b/g,
      generic ? "comida" : "refrigerante sukita"
    )
    .replace(
      /\b(a(n|m)tar?c?ti(d|c|k)?a)\b/g,
      generic ? "comida" : "refrigerante antarctica"
    )
    .replace(/\b(bn?a?n?a?na)\b/g, generic ? "comida" : "banana")

    .replace(/\b(famil(h|i)?ar?|fml)\b/g, generic ? "comida" : "familia")
    .replace(/\b(gra(m|n)?d(e|i))\b/g, generic ? "comida" : "grande")

    .replace(/\b(pi?t?i?(s+|z+)as?)\b/g, generic ? "comida" : "pizza")
    .replace(/\b(ai?pi(m|n)?)\b/g, generic ? "comida" : "aipim")
    .replace(
      /\b((h|r)(a|e)i?(n(i|e))?k(y|i|ine|e)(m|n)?)\b/g,
      generic ? "comida" : "heineken"
    )
    .replace(/\b(e?spate(n|m))\b/g, generic ? "comida" : "spaten")
    .replace(
      /\b(b(u|a)d(i|e)?(w|u)?(e|a)i(s|z)(e|i)r?)\b/g,
      generic ? "comida" : "budweiser"
    )
    .replace(/\b(stel+a)\b/g, generic ? "comida" : "stella")
    .replace(
      /\b(chorica|(g|c)alabr?e(z|s)a|lingu?i(c|s)a)\b/g,
      generic ? "comida" : "calabresa"
    )
    .replace(/\b(a(c|s)+air?)\b/g, generic ? "comida" : "acai")
    .replace(/\b(pas?te(l|is|u))\b/g, generic ? "comida" : "pastel")
    .replace(/\b(camar?a?o)\b/g, generic ? "comida" : "camarao")
    .replace(
      /\b(chic?ken|fra?(n|m)?(g|f)(o|u)|galin?h?a)\b/g,
      generic ? "comida" : "frango"
    )
    .replace(
      /\b(goi?abada|rome(o|u).*juliett?a)\b/g,
      generic ? "comida" : "romeu e julieta"
    )
    .replace(/\b(pr?esun?t(o|u))\b/g, generic ? "comida" : "presunto")
    .replace(/\b(mi(x|s)t(o|u))\b/g, generic ? "comida" : "misto")
    .replace(/\b(g(u|o)+b(e|i)?)\b/g, generic ? "comida" : "goob")
    .replace(/\b(ched+(a|e)r?)\b/g, generic ? "comida" : "cheddar")
    .replace(
      /\b(catu?i?p(i|e)r+(i|y|e)?|re(q|k)u?ei?jao)\b/g,
      generic ? "comida" : "catupiry"
    )
    .replace(/\b(ca(z|s)+a)\b/g, generic ? "comida" : "casa")
    .replace(/\b((q|k)u?ei?j(o|u))\b/g, generic ? "comida" : "queijo")
    .replace(/\b((s|c)ebou?n?lar?)\b/g, generic ? "comida" : "cebola")
    .replace(/\b(h?oh?rega(n|m)?o?u?r?)\b/g, generic ? "comida" : "oregano")
    .replace(
      /\b(me(ch|x)i(c|k)?a?(m|n)(o|a))\b/g,
      generic ? "comida" : "mexicano"
    )
    .replace(/\b(nor?de?s?ti?(m|n)(o|a))\b/g, generic ? "comida" : "nordestino")
    .replace(
      /\b((s|c)er?ta(n|m)ei?j(o|a))\b/g,
      generic ? "comida" : "sertanejo"
    )
    .replace(/\b(car?ne)\b/g, generic ? "comida" : "carne")
    .replace(
      /\b((q|k)u?eij(o|u)|m(o|u)(zz?|c|ss?)arell?(o|a))\b/g,
      generic ? "comida" : "queijo"
    )
    .replace(/\b(peru|perivis)\b/g, generic ? "comida" : "peru")
    .replace(/\b(be?bida)\b/g, generic ? "comida" : "bebida")
    .replace(
      /\b(((p(a?r?a?)|de)\s+)?com(ida|er))\b/g,
      generic ? "comida" : "comida"
    );

  console.log("before fix products", text);
  console.log("fixed products", r);
  return r;
};

export const prepareProductsIntent = async (normalized: string) => {
  const products = await getProducts({}); //cache.get<IProduct[]>("products");

  let n = replaceNumbersText(
    replaceProductsText(removeTrashWords(normalized), true)
    // .replace(
    //   /\bs\b\s*(ceb|to|mol|cat|req|pre|bor|ore|pim|sal|suc|ref|cer|pre|tal|pra)/g,
    //   "s/$1"
    // )
  );

  if (products) {
    const tags = (products ?? [])
      .sort((a, b) => b.sales - a.sales)
      .map((x) => `${x.name} ${x.tags.join(" ")}`);

    const foundProducts: (IProduct & { quantity: number })[] = [];

    //   const STOPWORDS = new Set([
    //   "de","do","da","dos","das","com","sem","e","ou","um","uma","uns","umas",
    //   "pra","para","por","no","na","nos","nas","ao","aos","as","os"
    // ]);

    // const tokens = tokenize(normalized).filter(x => !STOPWORDS.has(x))

    const tokenFrequency = buildTokenFrequency(products);
    const totalProducts = products.length;

    const MAX_FREQ_RATIO = 0.5; // aparece em mais de 50% dos produtos? ignora

    const relevantTokens = new Set<string>();

    for (const p of products) {
      const tokens = [
        ...tokenize(p.name),
        ...(p.tags ?? []).flatMap((x) => tokenize(x)),
        ...tokenize(p.description ?? ""),
      ];

      for (const token of tokens) {
        const freq = tokenFrequency.get(token) ?? 0;
        if (freq / totalProducts <= MAX_FREQ_RATIO && token.length >= 4) {
          relevantTokens.add(token);
        }
      }
    }

    if (relevantTokens.size !== 0) {
      // Ordena do maior pro menor (evita substituir "car" antes de "carne")
      const sortedTokens = Array.from(relevantTokens).sort(
        (a, b) => b.length - a.length
      );
      const regex = new RegExp(`\\b(${sortedTokens.join("|")})\\b`, "gi");

      n = n.replace(regex, "comida");
    }
  }
  return n;
};

function buildTokenFrequency(products: IProduct[]): Map<string, number> {
  const freq = new Map<string, number>();

  for (const p of products) {
    const tokens = new Set([
      ...tokenize(p.name),
      ...(p.tags ?? []).flatMap((x) => tokenize(x)),
      ...tokenize(p.description ?? ""),
    ]);

    for (const t of tokens) {
      freq.set(t, (freq.get(t) ?? 0) + 1);
    }
  }

  return freq;
}
