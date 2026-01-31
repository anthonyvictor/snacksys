import { MsgIntentFunc } from "types";

export const changeQuantity: MsgIntentFunc = async ({ chat, normalized }) => {
  const hasOneItem = chat.order?.products?.length === 1;
  if (!hasOneItem) return false;

  const n = normalized
    .replace(/\b((sa?o(mente)?|apenas?|e))\b/g, "so")
    .replace(/\b((nao\s+)?quero)\b/g, "")
    .replace(/\b(?:(\d+)\s+so)\b/g, "so $1")
    .replace(/\b()\b/g, "");

  console.log("\n\n\nn:\n", n);

  return !!n.match(/\b((so\s+)?\d+?$)\b/g); //|s\/\w+
};
