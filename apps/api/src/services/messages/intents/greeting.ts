import { maxWords } from "@/services/text/maxWords";
import { startsW } from "@/services/text/starts";
import { MsgIntentFunc } from "types";

export const greeting: MsgIntentFunc = async ({ normalized }) => {
  return startsW(normalized, "oi") && maxWords(normalized, 2);
};
