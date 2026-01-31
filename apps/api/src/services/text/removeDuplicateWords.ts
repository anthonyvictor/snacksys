export function removeDuplicateWords(text: string) {
  if (!text) return text;

  return text
    .split(/\s+/)
    .filter((word, i, arr) => word.toLowerCase() !== arr[i - 1]?.toLowerCase())
    .join(" ");
}
