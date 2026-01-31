import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";

import { OrderModel, ff, DeleteOrdersDTO } from "types";

export const handler_deleteOrders = async (req: Request, res: Response) => {
  try {
    await deleteOrders(req.body);
    res.status(200).end();
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const deleteOrders = async ({ ids, customers }: DeleteOrdersDTO) => {
  let q: any = {};

  if (ids && ids.length > 0) {
    q["_id"] = { $in: ids };
  }
  if (customers && customers.length > 0) {
    q["customer"] = { $in: customers };
  }
  await OrderModel.findOneAndDelete(q);
};
