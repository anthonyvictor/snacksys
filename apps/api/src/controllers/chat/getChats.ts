import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";

import { ChatModel, ff, GetChatsDTO, populates } from "types";

export const handler_getChats = async (req: Request, res: Response) => {
  try {
    const result = await getChats(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const getChats = async ({
  ids,
  from,
  platforms,
  status,
}: GetChatsDTO) => {
  let q: any = {};

  if (ids && ids.length > 0) {
    q["_id"] = { $in: ids };
  }
  if (from && from.length > 0) {
    q["from.id"] = { $in: from };
  }

  if (platforms && platforms.length > 0) {
    q["platform"] = { $in: platforms };
  }

  if (status && status.length > 0) {
    q["status"] = { $in: status };
  }
  return (
    (await ff({
      m: ChatModel,
      q,
      p: populates.chat,
    }))! || []
  );
};
