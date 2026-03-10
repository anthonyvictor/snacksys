import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";
import {
  CustomerModel,
  SaveCustomerDTO,
  ffid,
  serializeMongo,
  ICustomer,
} from "types";
import { getCustomers } from "./getCustomers";

export const handler_saveCustomer = async (req: Request, res: Response) => {
  try {
    const result = await saveCustomer(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const saveCustomer = async ({ newCustomer }: SaveCustomerDTO) => {
  if (newCustomer.id) {
    const raw = await CustomerModel.findByIdAndUpdate(
      newCustomer.id,
      {
        $set: newCustomer,
      },
      { new: true },
    );

    if (!raw) return null;

    const data = (await getCustomers({ ids: [newCustomer.id] }))[0];
    return data;
  } else {
    const res = await CustomerModel.create(newCustomer);

    const data = (await getCustomers({ ids: [res._id.toString()] }))[0];

    console.info(`📦 Novo cliente salvo: ${data.name}`);
  }
};
