import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";

export const continueOrder: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    normalized
      .replace(/quero/g, "")
      .replace(
        /\b(co(n|m)?tinuar?|pro(x|c|s)im(a|o)(\s+(etapa|pa(s|c)o))?)\b/g,
        "continuar"
      )
  )
    .replace(/\s+/g, " ")
    .trim();

  return !!n.match(/^continuar$/g);
};
