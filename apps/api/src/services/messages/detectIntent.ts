import { IChat } from "types";
import { removeAccents } from "../text/removeAccents";
import { removeDuplicateChars } from "../text/removeDuplicateChars";
import { intents } from "./intents";
import { removeDuplicateWords } from "../text/removeDuplicateWords";
export const detectIntent = async (msg: string, chat: IChat) => {
  const normalized = removeDuplicateWords(
    removeDuplicateChars(
      removeAccents(msg.toLowerCase()).replace(/[^0-9a-z ]/g, " "),
    )
      .replace(/\s+/g, " ")
      .trim()

      // CORREÇÕES
      .replace(/\b((q|c)u?a?n?to?|(qual|q|fica).*valor?)\b/g, "quanto")
      .replace(/\b(o(q|k)u?e?)\b/g, "oq")
      .replace(/^(e|o|s)$/g, "sim")
      .replace(/\b(q|qe|ki|ke)\b/g, "que")
      .replace(/\b(c(o|u)a(l|is)|quais)\b/g, "qual")

      .replace(/\b(os?|as?|e)\b/g, "")
      .replace(/\b(pa?ra?.*noi?s)\b/g, "")
      .replace(/\b(?:noi?s\s+((?:va|que)\w*))\b/g, "quero")
      .replace(/\b(ma?n?d(a|e)?|me d(a|e))\b/g, "quero")
      .replace(
        /\b(eu|tu|me|gent(e|i)?|galera|povos?|pessoal|el(e|a|i)s?|tu|vo?ce?s?)\b/g,
        "",
      )
      .replace(/\s+/g, " ")
      .trim()

      // ORDENS
      .replace(
        /\b((q|k)u?e?r(o|u|emos?)?(\s+(pa?r?a?|co?mo?))?|va(o|i)\s+ser?(\s+(pa?r?a?|co?mo?))?|inclu(ir?|a)|colo(que|car?)(\s+(pa?r?a?|co?mo?))?|ad|(vei?(ja)?|(m(a|e)nd|(e|r)n(v|f)i|adi?cion|bot)(ar?|e))(\s+ai)?|v(ou?|ai|amos?)\s+quer(o|er?)|querem(os)?|tra(s|z))\b/g,
        "quero",
      )

      .replace(/\b(vai ser)\b/g, "quero")

      .replace(
        /(?<!\b(codigo|pix)\s)\bqr\b(?!\s*(pix|((qr)?cod(igo|e)?)))/g,
        "quero",
      )
      .replace(/\s+/g, " ")
      .trim()

      // ARTIGOS / CONJUNÇÕES
      // .replace(/\b(ou|uma?)\b/g, "")

      .replace(/\s+/g, " ")

      .replace(/\b(c|co)\b/g, "com") // VER

      // CANCELAMENTOS
      .replace(/\b(de?i?x(a|e)?)\b/g, "cancela")
      .replace(/\b(co?m? vo?ce?s)\b/g, "")
      .replace(/\b(vo?ce?s?|eu)\b/g, "")

      // SAUDAÇÕES
      .replace(
        /\b(^boa$|b(oa|om)?\s*(dia|(n|m)oi?te?|tar?d(e|i)?)|boa\s+pr?a?\s+noi?s(\s*familia)|fala\s*tu|oie|opa|ola(h|r)?|salve|(q|c)f|cofoi|qual\s*foi|col?e|e\s?a(i|e))\b/g,
        "oi",
      )
      .replace(
        /\b(como|tudo)\b.*\b(est[aã]o|bom|tran?qui?lo|be?le?(z|s)a?|bele|boas?)\b/g,
        "oi",
      )

      // .replace(/\b(aqu?i?|la|n(o|a)s?|ai)\b/g, "")

      .replace(/\s+/g, " ")
      .trim(),
  );

  // const unique = removeDuplicateChars(normalized);

  console.log("pre-normalized", normalized);

  for (const [k, v] of Object.entries(intents)) {
    const result = await v({ normalized, original: msg, chat });
    console.log(k, result);

    if (result) {
      return typeof result === "boolean" ? { intent: k } : result;
    }
  }
};
