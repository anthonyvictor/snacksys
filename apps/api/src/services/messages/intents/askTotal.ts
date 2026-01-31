import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";

export const askTotal: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    normalized
      .replace(/\b(d(eu|a)|tudo|fic(ou|a)|total|final)\b/g, "total")
      .replace(/\b(quanto.*total|total.*quanto)\b/g, "quanto total")
  )
    .replace(/\s+/g, " ")
    .trim();

  return !!n.match(/quanto total/g);
};
