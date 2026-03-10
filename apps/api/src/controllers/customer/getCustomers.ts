import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";

import { CustomerModel, ff, GetCustomersDTO, populates } from "types";

export const handler_getCustomers = async (req: Request, res: Response) => {
  try {
    const result = await getCustomers(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const getCustomers = async ({ ids, phone, query }: GetCustomersDTO) => {
  let q: any = {};

  if (ids && ids.length > 0) {
    q["_id"] = { $in: ids };
  }

  if (phone && phone.length > 0) {
    q["phone"] = {
      $in: phone.map((x) => {
        const cleanNumber = x.replace(/\D/g, "").slice(-10);
        const regex = new RegExp(`${cleanNumber}$`);

        return regex;
      }),
    };
  }

  if (query && query.length > 0) {
    const regex = new RegExp(query, "i");
    q["$or"] = [
      { name: { $regex: regex } },
      { tags: { $elemMatch: { $regex: regex } } },
      { phone: { $regex: regex } },
    ];
  }

  return (
    (await ff({
      m: CustomerModel,
      q,
      p: populates.customer,
    }))! || []
  );
};
