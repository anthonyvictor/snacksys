export const removeTrashWords = (text: string) => {
  return text
    .replace(/\b(la\s*el(e|i))\b/g, "")
    .replace(/\b(m(eu|o) pai)\b/g, "")
    .replace(/\b(no\s+ma(x|c)imo)\b/g, "")
    .replace(/\b(ta\s+ligad(o|a))\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};
