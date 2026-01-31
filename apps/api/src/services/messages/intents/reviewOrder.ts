import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";

export const reviewOrder: MsgIntentFunc = async ({ normalized, chat }) => {
  const order = chat.order;

  if (!order?.products?.length) return false;

  const n = removeDuplicateWords(
    normalized.replace(
      /\b(quanto.*tudo|(dando|deu|ficou)\s+quanto)(?!\s+com\b)/g,
      "quanto total"
    )
  )
    .replace(/\s+/g, " ")
    .trim();

  return !!n.match(/quanto.*total/g);
};
