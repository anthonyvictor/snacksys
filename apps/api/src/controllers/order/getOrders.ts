import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";

import { ff, GetOrdersDTO, OrderModel, populates } from "types";

export const handler_getOrders = async (req: Request, res: Response) => {
  try {
    const result = await getOrders(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const getOrders = async ({ ids, status }: GetOrdersDTO) => {
  let q: any = {};

  if (status && status.length > 0) {
    q["status"] = { $in: status };
  }
  if (ids && ids.length > 0) {
    q["_id"] = { $in: ids };
  }
  return (
    (await ff({
      m: OrderModel,
      q,
      p: populates.order,
    }))! || []
  );
};
