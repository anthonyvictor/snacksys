import { equals } from "@/services/text/equals";
import { maxWords } from "@/services/text/maxWords";
import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";

export const deny: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    normalized
      .replace(
        /\b((eu\s+)?(n|nao|num).+((s|z)ei|consig\w*|sab\w*|poso)(\s+fazer?(\s+is(o|u))?)?)\b/g,
        "nao consigo",
      )
      .replace(/\b(obg|obrigad(o|a)|por\s+enqu?a?n?to|valeu|vlw)\b/g, "")
      .replace(/\b(not|negativo|erado|falso|nops?)\b/g, "nao")
      .replace(/(^\s*n\s*$|(n(ao)?).*quero|quero\s+\b(n(ao)?)\b)/g, "nao")
      .replace(/\b(nao(\s+eh?(\s+(iso|ese|esa))?)?)\b/g, "nao"),
  )
    .replace(/\s+/g, " ")
    .trim();

  return (
    (!!n.match(/^nao/g) || !!n.match(/nao consigo/g)) && maxWords(normalized, 2)
  );
};
