import { contains } from "@/services/text/contains";
import { maxWords } from "@/services/text/maxWords";
import { starts } from "@/services/text/starts";
import { IChat, IProduct, MessageIntentDTO, MsgIntentFunc } from "types";
import { replaceProductsText } from "../replace/products";
import { cache } from "@/data/cache";
import { replaceNumbersText } from "../replace/numbers";
import { tokenize } from "@/services/text/tokenize";
import { removeTrashWords } from "../replace/trashWords";
import { getProducts } from "@/controllers/product/getProducts";

export const rollback: MsgIntentFunc = async ({ normalized }) => {
  const n = normalized.replace(
    /\b(apagar?|d(e|i)s?fa(z|s)(er?)?)\b/g,
    "desfazer"
  );

  return !!n.match(/^desfazer$/g) && maxWords(normalized, 1);
};
