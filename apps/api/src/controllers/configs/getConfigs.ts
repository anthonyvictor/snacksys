import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";
import { ConfigModel, ReceivedMessageDTO } from "types";
import { ff } from "types";

export const handler_getConfigs = async (req: Request, res: Response) => {
  try {
    const data = await getConfigs();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const getConfigs = async () => {
  return (
    (await ff({
      m: ConfigModel,
    }))! || []
  );
};
