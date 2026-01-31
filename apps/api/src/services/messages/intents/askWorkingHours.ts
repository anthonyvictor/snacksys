import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";

export const askWorkingHours: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    normalized.replace(
      /\b(ho?je?.*(fun?ci?o?nar?m?|abr(e|i)r?|ter)|(fun?ci?o?nam?r?|abr(e|i)r?|ter).*ho?je?|(fun?ci?o?nam?r?|abr(e|i)r?|ter).*(hora|dia|amanha|segunda|terca|quarta|quinta|sexta|feriado)s?|fu?ncio?namento?|horas?.*(abr(e|i)r?|comecar?|fu?nci?onam?r?)|(dias|amanha|segunda|terca|quarta|quinta|sexta|feriado).*(abr(e|i)r?|fu?n?ci?o?nam?r?))\b/g,
      "horario funcionamento"
    )
  )
    .replace(/\s+/g, " ")
    .trim();

  return !!n.match(/horario funcionamento/g);
};
