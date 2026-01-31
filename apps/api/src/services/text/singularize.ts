export function singularize(word: string) {
  word = word.toLowerCase();

  // especiais
  if (word.endsWith("oes")) return word.slice(0, -3) + "ao"; // paes/eoes → pão
  if (word.endsWith("aes")) return word.slice(0, -3) + "ao"; // maos → mão
  if (word.endsWith("ois")) return word.slice(0, -3) + "ol"; // lençois → lençol
  if (word.endsWith("is")) return word.slice(0, -2); // barris → barril (simples)

  // plurais regulares
  if (word.endsWith("ses")) return word.slice(0, -2); // bases → base
  if (word.endsWith("xes")) return word.slice(0, -2);
  if (word.endsWith("zes")) return word.slice(0, -2);
  if (word.endsWith("res")) return word.slice(0, -2);

  // plural simples (termina em s)
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);

  return word;
}
