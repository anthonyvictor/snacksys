import { MsgIntentFunc } from "types";
import { prepareProductsIntent } from "../replace/products";

export const changeProducts: MsgIntentFunc = async ({ normalized }) => {
  const n = await prepareProductsIntent(normalized);

  console.log("\n\n\nn:\n", n);

  return !!n.match(
    /\b(troca|tira|nao|na\s+(verdade|vdd)|(eh?\s+)?so)\b.*comida/g,
  ); //|s\/\w+
};
