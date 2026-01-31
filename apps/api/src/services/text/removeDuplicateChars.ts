// import { removeAccents } from "./removeAccents";

// export const removeDuplicates = (txt: string) => {
//   const res = removeAccents(txt)
//     .toLowerCase()
//     .replace(/(\w)\1+/g, "$1")
//     .replace(/\s+/g, " ")
//     .trim();

//   return res;
// };

export function removeDuplicateChars(str: string) {
  return str.replace(/(\w)\1+/g, "$1");
}
