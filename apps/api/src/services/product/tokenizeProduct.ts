import { IProduct } from "types";
import { tokenize } from "../text/tokenize";

export function tokenizeProduct(p: IProduct) {
  return {
    id: p.id,
    name: tokenize(p.name),
    tags: (p.tags || []).map((t) => singularize(t.toLowerCase())),
    desc: p.description ? tokenize(p.description) : [],
    sales: p.sales,
  };
}
