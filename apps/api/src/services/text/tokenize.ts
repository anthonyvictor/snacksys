import { normalize } from "./normalize";
import { singularize } from "./singularize";

export function tokenize(text: string, _normalize = false) {
  const f = _normalize
    ? (x: string) => {
        return x;
      }
    : normalize;
  return f(text)
    .split(/\s+/)
    .map((t) => singularize(t))
    .filter((t) => t.length > 0);
}

export function extractTextChunks(text: string) {
  const words = text.split(/\s+/g);

  const chunks: { text: string; quantity: number }[] = [];

  let buffer = [];
  let quantity = 1;

  const quantityReg = /^\d+$/;

  for (const word of words) {
    if (quantityReg.test(word)) {
      quantity = parseInt(word);
      continue;
    }

    buffer.push(word);

    // heurística simples: chunk termina quando:
    // - já tem quantidade
    // - encontrou um potencial nome de produto
    if (buffer.length >= 2) {
      const chunkText = buffer.join(" ").trim();
      chunks.push({ text: chunkText, quantity });
      buffer = [];
      quantity = 1;
    }
  }

  // último pedaço
  if (buffer.length > 0) {
    chunks.push({
      text: buffer.join(" ").trim(),
      quantity,
    });
  }

  return chunks;
}
