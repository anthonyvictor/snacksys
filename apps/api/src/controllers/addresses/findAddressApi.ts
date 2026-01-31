import { logError, resError } from "@/infra/error";
import {
  query_cepaberto,
  query_nominatim,
  query_photon,
} from "@/services/address/query";
import { pos_cepaberto, pos_nominatim } from "@/services/address/reverse";
import { zipcode_cepAberto } from "@/services/address/zipcode";
import { Request, Response } from "express";
import { FindAddressesDTO, IAddress } from "types";

export const handler_findAddressApi = async (req: Request, res: Response) => {
  try {
    const result = await findAddressApi(req.body);
    res.json(result);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const findAddressApi = async ({
  street,
  coords,
  zipCode,
  neighborhood,
}: FindAddressesDTO) => {
  console.log("vai pesquisar na api =>>>>>>>>", street);
  const [
    p_cepAberto,
    p_nominatim,
    c_cepAberto,
    q_cepAberto,
    q_nominatimWithNeighborhood,
    q_nominatim,
    q_photon,
  ] = await Promise.all([
    pos_cepaberto(coords),
    pos_nominatim(coords),
    zipcode_cepAberto(zipCode),
    query_cepaberto(street, neighborhood),
    street ? query_nominatim(street + ", " + (neighborhood ?? "").trim()) : [],
    query_nominatim(street),
    query_photon((street + ", " + (neighborhood ?? "")).trim()),
  ]);
  //

  const addresses: IAddress[] = [
    ...p_cepAberto,
    ...p_nominatim,
    ...c_cepAberto,
    ...q_cepAberto,
    ...q_nominatimWithNeighborhood,
    ...q_nominatim,
    ...q_photon,
  ];

  return addresses;
};
