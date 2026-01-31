import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";

import {
  ff,
  GetProductsDTO,
  IProduct,
  IProductCategory,
  ProductCategoryModel,
  ProductModel,
} from "types";

export const handler_getProductsCategories = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getProductsCategories(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const getProductsCategories = async ({
  ids,
  query,
  onlyActive,
}: GetProductsDTO) => {
  let q: any = {};

  if (query && query.length > 0) {
    const regex = new RegExp(query, "i");
    q["$or"] = [
      { name: { $regex: regex } },
      { description: { $regex: regex } },
      { tags: { $elemMatch: { $regex: regex } } },
      { category: { $regex: regex } },
    ];
  }
  // const products = await getProducts({ onlyActive });

  const data = (
    (await ff({
      m: ProductCategoryModel,
      q,
    }))! || []
  )
    // .map((x) => {
    //   x.products = products.filter((y) => y.category.id === x.id);
    //   return x;
    // })
    .filter((x) => (onlyActive ? x.products?.length : true))
    .sort((a, b) => a.position - b.position);
  return data;
};

// export const getProductsC = async ({
//   ids,
//   query,
//   onlyActive,
// }: GetProductsDTO) => {

//   if (!data) {
//     data =
//       (await ff({
//         m: ProductModel,
//         // q,
//       }))! || [];
//     cache.set("products", data, 5 * 60);
//   }

//   return data
//     .filter((x) => {
//       if (onlyActive && !x.active) return false;

//       if (query && query.length > 0) {
//         const regex = new RegExp(query, "i");
//         if (
//           !join(
//             [x.name, x.description, join(x.tags, " "), x.category.name],
//             " "
//           ).match(regex)
//         )
//           return false;
//       }
//     })

//     .sort((a, b) => a.name.localeCompare(b.name))
//     .sort((a, b) => b.sales - a.sales);
// };
