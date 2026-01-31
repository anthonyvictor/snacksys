import { MsgIntentFunc } from "types";
import { replacePaymentsText } from "../replace/payments";
import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";

export const askPaymentMethods: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    replacePaymentsText(normalized).replace(
      /((taxa|aceita|pega|receb|trabalha).*(cart(aos?|oes)|(wil|master|\belo\b|diner|american|soro.*cred|\bvr\b)|pix|refeicao|alimentacao|alelo|voucher?|transferen|\bted\b|\bvale\b|ticke?t)|qua(l|is).*(bandeira|carta(os?|oes)))/g,
      "formas pagamento"
    )
  )
    .replace(/\s+/g, " ")
    .trim();

  return !!n.match(/formas pagamento/g);
};
