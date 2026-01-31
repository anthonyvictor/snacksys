import { containsAll } from "@/services/text/contains";
import { maxWords } from "@/services/text/maxWords";
import { MsgIntentFunc } from "types";

export const askPix: MsgIntentFunc = async ({ normalized }) => {
  if (containsAll(normalized, "quero", "pix") && maxWords(normalized, 3))
    return true;

  return false;
};
