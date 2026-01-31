import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";
import { AddressCommunityModel, ConfigModel, ReceivedMessageDTO } from "types";
import { ff } from "types";

export const handler_getCommunities = async (req: Request, res: Response) => {
  try {
    const data = await getCommunities({});
    res.status(200).json(data);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const getCommunities = async ({}) => {
  return (
    (await ff({
      m: AddressCommunityModel,
    }))! || []
  );
};
