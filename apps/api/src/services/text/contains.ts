export const contains = (text: string, ...arr: string[]) =>
  arr.some((x) => text.includes(x));
export const containsAll = (text: string, ...arr: string[]) =>
  arr.every((x) => text.includes(x));
