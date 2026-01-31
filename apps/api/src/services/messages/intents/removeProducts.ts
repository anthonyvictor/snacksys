import { prepareProductsIntent } from "../replace/products";
import { MsgIntentFunc } from "types";

export const removeProducts: MsgIntentFunc = async ({ normalized }) => {
  const n = await prepareProductsIntent(normalized);

  console.log("\n\n\nn:\n", n);

  return !!n.match(
    /\b(((nao\s+)(quero|pedi)|(nao\s+)?dis+e|(nao\s+)?falei|(nao\s+)?(apa?gu?|li?mp|re?mo?v|tir)(a|e)r?)(.*(car+inho|iso|comidas?|tu?do?|ite(ns?|m)|produtos?))?)\b/g
  );
};
