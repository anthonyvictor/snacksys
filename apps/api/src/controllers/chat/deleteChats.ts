import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";

import { ChatModel, ff, DeleteChatsDTO } from "types";

export const handler_deleteChats = async (req: Request, res: Response) => {
  try {
    await deleteChats(req.body);
    res.status(200).end();
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const deleteChats = async ({ from }: DeleteChatsDTO) => {
  let q: any = {};

  if (from && from.length > 0) {
    q["from"] = { $in: from };
  }
  await ChatModel.findOneAndDelete(q);
};
