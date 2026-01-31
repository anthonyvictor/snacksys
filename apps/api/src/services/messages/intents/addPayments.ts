import { starts } from "@/services/text/starts";
import { MsgIntentFunc } from "types";
import { replacePaymentsText } from "../replace/payments";

export const addPayments: MsgIntentFunc = async ({ normalized, chat }) => {
  const order = chat.order;
  if (!order?.products?.length) return false;

  const n = replacePaymentsText(normalized);

  // const r = starts(n, "no cartao", "em especie", "pix");
  const r = !!n.match(/\b((quero.*)?(pix|cartao|especie))\b/g); //|s\/\w+
  console.log("intent addPayments", { normalized, n, r });
  return r;
};
