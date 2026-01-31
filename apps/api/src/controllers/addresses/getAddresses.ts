import { logError, resError } from "@/infra/error";
import { normalizeOrdinal } from "@/services/text/ordinals";
import { Request, Response } from "express";

import { AddressModel, ff, GetAddressesDTO, populates } from "types";

export const handler_getAddresses = async (req: Request, res: Response) => {
  try {
    const result = await getAddresses(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const getAddresses = async ({
  ids,
  streets,
  zipCodes,
  neighborhoods,
}: GetAddressesDTO) => {
  let q: any = {};

  if (ids && ids.length > 0) {
    q["_id"] = { $in: ids };
  }
  if (streets && streets.length > 0) {
    const array = streets.map(
      (street) => new RegExp(normalizeOrdinal(street), "i"),
    );
    q["street"] = { $in: array };
  }
  if (neighborhoods && neighborhoods.length > 0) {
    const array = neighborhoods.map(
      (neighborhood) => new RegExp(neighborhood, "i"),
    );
    q["neighborhood"] = { $in: array };
  }
  if (zipCodes && zipCodes.length > 0) {
    const array = zipCodes.map((zipCode) => new RegExp(zipCode, "i"));
    q["zipCode"] = { $in: array };
  }

  return (
    (await ff({
      m: AddressModel,
      q,
      // p: populates.chat,
    }))! || []
  );
};
