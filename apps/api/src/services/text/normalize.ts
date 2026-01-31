import emojiRegex from "emoji-regex";

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(emojiRegex(), "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// function normalize(str) {
//   return removeDuplicates(removeAccents(str.toLowerCase().trim()))
//     .replace(/\s+/g, " ");
// }

// export function normalize(s: string): string {
//   return s
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "") // remove accents
//     .replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu, "") // remove some emojis
//     .replace(/[^\p{L}\p{N}\s]/gu, " ") // keep letters/numbers/space
//     .replace(/\s+/g, " ")
//     .trim()
//     .toLowerCase()
//     .replace(/[^0-9a-z ]/g, "");
// }
