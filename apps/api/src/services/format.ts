export function formatCurrency(valor: number) {
  const res = !isNaN(Number(valor))
    ? valor.toLocaleString("pt-br", {
        style: "currency",
        currency: "BRL",
      })
    : "R$ -,--";
  return res;
}

export const normalize = (text: string) => {
  const normalized = removeAccents(text.toLowerCase())
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
};

export function removeAccents(txt: string) {
  const r = String(txt)
    .replace(/[ÀÁÂÃÄÅ]/g, "A")
    .replace(/[Ç]/g, "C")
    .replace(/[ÈÉÊË]/g, "E")
    .replace(/[ÌÍÎÏ]/g, "I")
    .replace(/[ÒÓÔÕÖ]/g, "O")
    .replace(/[ÙÚÛÜ]/g, "U")

    .replace(/[àáâãäå]/g, "a")
    .replace(/[ç]/g, "c")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .trim();
  return r;
}
