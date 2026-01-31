export const replacePaymentsText = (text: string, empty = false) => {
  const r = text
    .replace(
      /\b(p[ieou]?(x+i?s?|s+|z+|c+|ki?s|qu?i?s|ci?s|xz)?c?z?)\b/g,
      empty ? "" : "pix"
    )
    .replace(
      /\b((cod(e|igo)?\s*)?qr\s?(pix|cod(e|i(go)?)?)?)\b/g,
      empty ? "" : "pix"
    )
    .replace(
      /\b((como\s+e\s+)?(qual\s+e\s+)?(cade\s+)?(manda(r)?\s+)?((sua|seu)\s+)?(chave\s*pix|chave|pix|qr\s*code)((\s+numero)?\s+do\s+pix)?)\b/g,
      empty ? "" : "quero pix"
    )
    .replace(
      /\b((na|em) maos?|dinheiro|especie|(s(em)?\s*)?tro?co?(\s+p)?|cash|money|cedulas?)\b/g,
      empty ? "" : "em especie"
    )
    .replace(
      /\b(((em|no|via)\s+)?cartao|debit(o|u)u?|credit(o|u)|master|(quero.*)?maquininha)\b/g,
      empty ? "" : "no cartao"
    );

  console.log("before fix payments", text);
  console.log("after fix payments", r);
  return r;
};
