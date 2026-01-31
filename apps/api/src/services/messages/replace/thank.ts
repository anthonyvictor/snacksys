import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";

export const replaceThankText = (text: string, empty = false) => {
  const r = removeDuplicateWords(
    text
      .replace(/\b(certo|ok|be?le?z?a?)\b/g, empty ? "" : "obg")
      .replace(
        /\b(o?br?i?ga?d?(o|a)?|((fic(amos?|ou?)|e?s?t(ou?|amos?)).+)?(gratos?|agradec(o|id(o|a)?))|va?le?(w|u)?)\b/g,
        empty ? "" : "obg"
      )
      .replace(/\s+/g, " ")
      .trim()
  )
    .replace(/\s+/g, " ")
    .trim();
  return r;
};
