import { logError, resError } from "@/infra/error";
import { normalizeOrdinal } from "@/services/text/ordinals";
import { Request, Response } from "express";

import { AddressModel, ff, SaveAddressesDTO, populates, ffid } from "types";
import { getAddresses } from "./getAddresses";
import { getExtraAddress } from "@/services/address/details";

export const handler_saveAddress = async (req: Request, res: Response) => {
  try {
    const result = await saveAddress(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const saveAddress = async ({ newAddress }: SaveAddressesDTO) => {
  const foundAddresses = await getAddresses({
    streets: [newAddress.street],
    neighborhoods: [newAddress.neighborhood],
  });

  if (foundAddresses?.length) return foundAddresses[0];

  const extraAddress = await getExtraAddress(newAddress);

  const res = await AddressModel.create({
    ...extraAddress,
    fee: undefined,
  });

  const finalAddr = (await ffid({
    m: AddressModel,
    id: res._id.toString(),
  }))!;

  console.info(
    `📦 Novo endereço salvo: ${finalAddr.zipCode}, ${finalAddr.street}, ${finalAddr.neighborhood}`,
  );

  return finalAddr;
};
