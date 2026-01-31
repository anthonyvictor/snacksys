import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";

export const askRestaurantAddress: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    normalized.replace(
      /\b((quero|onde|qual).*(endereco|localizacao|ficam?))\b/g,
      "quero endereco"
    )
  )
    .replace(/\s+/g, " ")
    .trim();

  return !!n.match(/quero endereco/g);
};
