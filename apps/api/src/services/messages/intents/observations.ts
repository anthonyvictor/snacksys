import { replaceProductsText } from "../replace/products";
import { MsgIntentFunc } from "types";

export const observations: MsgIntentFunc = async ({ normalized }) => {
  const n = replaceProductsText(normalized, true).replace(
    /(?:(z|qu?)?inh(o|a))\b/g,
    "$1"
  );
  console.log("\n\n\nn:\n", n);

  return !!n.match(
    /\b(quero.*(cop(o|u)s?|pratos?|ca(n|m)udos?|sa(ch|x)ei?s?|(k|c|qu?)(a|e)(ti?e?|me)chupe?i?s?|m(ou?|u)starda?|ma(i|y)o(n|m)e(s|z)(e|i))|(quero\s+)?(so(mente)?|apenas?|bem|mais?|menos?|muito|nao|quero|sem|com|ba(s|x)ta(n|m)t(e|i)|pou?(c|k)(o|a)).*(bran|as+a|frit|dourad|cru|comida)\w*(.+demais?)?)\b/g
  );
};
