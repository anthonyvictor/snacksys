import { maxWords } from "@/services/text/maxWords";
import { MsgIntentFunc } from "types";
import { replaceThankText } from "../replace/thank";

export const thank: MsgIntentFunc = async ({ normalized }) => {
  const n = replaceThankText(normalized);

  return !!n.match(/^obg/g) && maxWords(normalized, 2);
};
