import { maxWords } from "@/services/text/maxWords";
import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { MsgIntentFunc } from "types";

export const confirm: MsgIntentFunc = async ({ normalized }) => {
  const n = removeDuplicateWords(
    normalized

      .replace(
        /^(eh?(\s+s(im)?)|ok(ay|ey|ei)|ce?rto?|be?le?za?|tah?\s+(b(om)?|ok|ce?rto?)|((tah?|pod(e|i)?)\s+)?confir?mar?(do)?)$/g,
        "sim",
      )
      .replace(
        /\b(((nao|sim)\s+)?(eh?\s+)?((soh?|apenas?)\s+)is+o (mes?mo)?|ta(h|r)?\s+(bo?m|cer?to?|ct)|(eh?\s+)?po?de?\s+(se?r?|pah?)|s|ta(h|r)?|is+o(\s+mes?mo?)?|yes|sin?|positivo|(ta(h|r)?\s+)?co(n|m)fir?m(o|e|a|ad(o|a)s?)|(ta(h|r)?\s+)?vi(u|o)|(ta(h|r)?\s+)?ok(ay|ei|ey|ai)?|(ta(h|r)?\s+)?cla?ro+(\s+qu?e?)?(\s+sim)?|(ta(h|r)?\s+)?(cer?|core|exa)t(o|amente?)?)\b/g,
        "sim",
      )
      .replace(
        /\b(sim(\s+com\s+(c|s)e?r?te?(z|s)a?)?(\s+(po?r?\s*?fa?vo?r?|obg))?)\b/g,
        "sim",
      )
      .replace(/^(pronto)/g, "sim")
      .replace(/^(((es)?ta\s+)(certo|ok))$/g, "sim")
      .replace(/^((pod(e|i)?\s+)?continu(a|e)r?)$/g, "sim")
      .replace(/quero/g, "")
      .replace(/\b((e\s+)?(soh?\s+)?iso(\s+me?(s|r)mo?)?)\b/g, "sim")
      .replace(
        /\b(co(n|m)?tinuar?|pro(x|c|s)im(a|o)(\s+(etapa|pa(s|c)o))?)\b/g,
        "sim",
      )
      .replace(/^(obg|po?r?\s*?fa?vo?r?)$/g, "sim")
      .replace(/(^\s*s\s*$|quero\s+\b(s(im)?)|^quero$\b)/g, "sim"),
  )
    .replace(/\s+/g, " ")
    .trim();

  return !!n.match(/^sim/g) && maxWords(normalized, 3);
};
