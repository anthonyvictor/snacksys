import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";

export const askWaitTime: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    normalized.replace(
      /\b(falta.*(sair|pront(o|a)s?|ter?minar?)|tem\s+(quant(o|a)s?|muit(a|o)s?)\s+(gentes?|pesoas?|pedidos?|pizzas?|comandas?)|quant(o|a)s?\s+((hora|minuto)s?)|tempo.*espera|(sai|pront(o|a)).*horas?|.*horas?\s+(sai|pront(a|o))|demorar?\s*.*(quanto|tempo|muito)?|quanto\s+tempo|qual\s*.*tempo(\s+estima(do|tiva))?|estimativa|(quant(a|o)?s?|pedidos|pizzas?|muit(o|a)s?)\s*.*(frente|fila)|fila\s*grande)\b/g,
      "tempo espera"
    )
  )
    .replace(/\s+/g, " ")
    .trim();

  return !!n.match(/tempo espera/g);
};
