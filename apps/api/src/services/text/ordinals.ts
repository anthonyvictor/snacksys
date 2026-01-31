export function normalizeOrdinal(str: string): string {
  if (!str) return str;
  const basics: Record<string, number> = {
    primeira: 1,
    segundo: 2,
    segunda: 2,
    terceira: 3,
    terceiro: 3,
    quarta: 4,
    quarto: 4,
    quinta: 5,
    quinto: 5,
    sexta: 6,
    sexto: 6,
    sétima: 7,
    sétimo: 7,
    oitava: 8,
    oitavo: 8,
    nona: 9,
    nono: 9,
    décima: 10,
    décimo: 10,
    vigésima: 20,
    vigésimo: 20,
    trigésima: 30,
    trigésimo: 30,
    quadragésima: 40,
    quadragésimo: 40,
    quinquagésima: 50,
    quinquagésimo: 50,
    sexagésima: 60,
    sexagésimo: 60,
    septuagésima: 70,
    septuagésimo: 70,
    octogésima: 80,
    octogésimo: 80,
    nonagésima: 90,
    nonagésimo: 90,
    centésima: 100,
    centésimo: 100,
  };

  function shorten(numero: number, genero: "f" | "m") {
    return numero + (genero === "f" ? "ª" : "º");
  }

  let result = str;

  // Regex captura algo como "décima segunda", "vigésima primeira", etc.
  const regex = new RegExp(
    "\\b(" +
      Object.keys(basics).join("|") +
      ")(\\s+(primeira|primeiro|segunda|segundo|terceira|terceiro|quarta|quarto|quinta|quinto|sexta|sexto|sétima|sétimo|oitava|oitavo|nona|nono))?\\b",
    "i"
  );

  const match = result.match(regex);

  if (match) {
    const base = match[1].toLowerCase();
    const complement = match[3]?.toLowerCase();

    let number = basics[base] || 0;
    if (complement) number += basics[complement] || 0;

    // gênero: assume feminino se achar "travessa", "rua", etc.
    const genre = /\b(travessa|rua|avenida|ladeira)\b/i.test(result)
      ? "f"
      : "m";

    const short = shorten(number, genre);
    result = result.replace(regex, short);
  }

  return result;
}
