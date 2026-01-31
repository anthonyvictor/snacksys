import { cache } from "@/data/cache";
import { logError, resError } from "@/infra/error";
import { join } from "@/services/text/join";
import { Request, Response } from "express";

import { ProductModel, ff, GetProductsDTO, populates, IProduct } from "types";

export const handler_getProducts = async (req: Request, res: Response) => {
  try {
    const result = await getProducts(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const getProducts = async ({
  categories,
  ids,
  query,
  onlyActive,
}: GetProductsDTO) => {
  // let q: any = {};

  // if (onlyActive) {
  //   q["active"] = true;
  // }
  // if (categories && categories.length > 0) {
  //   q["category"] = {
  //     $in: categories,
  //   };
  // }

  // if (query && query.length > 0) {
  //   const regex = new RegExp(query, "i");
  //   q["$or"] = [
  //     { name: { $regex: regex } },
  //     { description: { $regex: regex } },
  //     { tags: { $elemMatch: { $regex: regex } } },
  //     { category: { $regex: regex } },
  //   ];
  // }

  let data = cache.get<IProduct[]>("products");

  if (!data) {
    data =
      (await ff({
        m: ProductModel,
        p: populates.product,
        // q,
      }))! || [];

    cache.set("products", data, 5 * 60);
  }

  return data
    .filter((x) => {
      if (onlyActive && !x.active) return false;

      if (
        categories &&
        categories.length > 0 &&
        !categories.some((y) => x.category.id === y)
      )
        return false;

      if (query && query.length > 0) {
        const regex = new RegExp(query, "i");
        if (
          !join(
            [x.name, x.description, join(x.tags, " "), x.category.name],
            " "
          ).match(regex)
        )
          return false;
      }

      return true;
    })

    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => b.sales - a.sales);
};
