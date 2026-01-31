export const starts = (text: string, ...arr: string[]) =>
  arr.some((x) => text.startsWith(x));
export const startsW = (text: string, ...arr: string[]) =>
  arr.some((x) => text.split(" ")?.[0] === x);
