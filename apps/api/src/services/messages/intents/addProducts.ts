import { MsgIntentFunc } from "types";
import { prepareProductsIntent } from "../replace/products";

export const addProducts: MsgIntentFunc = async ({ normalized }) => {
  const n = await prepareProductsIntent(normalized);

  console.log("\n\n\nn:\n", n);

  return !!n.match(/\b(^comida.*|quero.*comida|\d+\s+comida)\b/g); //|s\/\w+
};
