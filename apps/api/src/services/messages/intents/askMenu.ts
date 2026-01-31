import { maxWords } from "@/services/text/maxWords";
import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";
import { replaceProductsText } from "../replace/products";

export const askMenu: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    replaceProductsText(normalized, true)
      .replace(
        /\b((nao\s+)?vendem?(\s+(oq|comida|ai))|(nao\s+)?tem\s+(oq|comidas?|bebidas?)(\s+ai)?|(quero|tem).*(precos?|valor(es)?|car?d?api?os?|menu|opc(aos?|oes?)|tabelas?))\b/g,
        "quero cardapio"
      )
      .replace(
        /\b((nao\s+)?ta\s*(saindo|rolando)|(tem|(qua(l|is)(\s+as?|os?)?))\s+(comida|bebida)s?)\b/g,
        "quero cardapio"
      )
  );

  return !!n.match(/quero.*cardapio|^cardapio/g) && maxWords(normalized, 10);
};
