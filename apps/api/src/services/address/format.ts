import { randomUUID } from "crypto";
import { IAddress } from "types";
import { normalizeOrdinal } from "../text/ordinals";

export const format_photon = (data: any) => {
  const _addresses = ((data.features as any[]) || [])
    .filter((e) => !!e?.properties?.postcode && !!e?.geometry)
    .map((e) => ({
      id: e.properties.osm_id,
      street: normalizeOrdinal(e.properties.formatted || e.properties.name),
      zipCode: e.properties.postcode.replace(/\D/g, ""),
      neighborhood:
        e.properties.locality || e.properties.suburb || e.properties.district,
      city: e.properties.city,
      state: e.properties.state,
      lon: e.geometry.coordinates[0],
      lat: e.geometry.coordinates[1],
    })) as unknown as IAddress[];

  return _addresses;
};

export const format_nominatim = (_data: any) => {
  const data = Array.isArray(_data) ? _data : [_data];

  const _addresses = (data || [])
    .filter((e) => !!e?.address?.postcode && !!e?.lat)
    .map((e) => ({
      id: e.osm_id ?? randomUUID(),
      street: normalizeOrdinal(e.address.road || e.name),
      zipCode: e.address.postcode.replace(/\D/g, ""),
      neighborhood:
        e.address.suburb ||
        e.address.neighbourhood ||
        e.address.quarter ||
        e.address.city_district,
      city: e.address.city,
      state: e.address.state,
      lon: e.lon ? Number(e.lon) : undefined,
      lat: e.lat ? Number(e.lat) : undefined,
    })) as unknown as IAddress[];

  return _addresses;
};
export const format_viaCEP = (_data: any) => {
  const data = Array.isArray(_data) ? _data : [_data];

  const _addresses = (data || [])
    .filter((e) => !!e?.cep)
    .map((e) => ({
      zipCode: e.cep.replace(/\D/g, ""),
      street: normalizeOrdinal(e.logradouro),
      neighborhood: e.bairro,
      city: e.localidade,
      state: e.estado,
      id: randomUUID(),
      lon: e.lon,
      lat: e.lat,
    })) as unknown as IAddress[];

  return _addresses;

  //   const filtrarMesmoBairro = (d: any[]) =>
  //   d.filter((x) =>
  //     !_bairro
  //       ? true
  //       : removeAccents(String(x.bairro).toLowerCase()) ===
  //         removeAccents(String(_bairro).toLowerCase())
  //   ) as any[];
  // const peloBairro = filtrarMesmoBairro(data);

  // data = peloBairro?.length ? peloBairro : data;
};
export const format_brasilApi = (_data: any) => {
  const data = Array.isArray(_data) ? _data : [_data];

  const _addresses = (data || [])
    .filter((e) => !!e?.cep)
    .map((e) => ({
      zipCode: e.cep.replace(/\D/g, ""),
      street: normalizeOrdinal(e.street),
      neighborhood: e.neighborhood,
      city: e.city,
      state: e.estado,
      id: randomUUID(),
      lon: e.lon,
      lat: e.lat,
    })) as unknown as IAddress[];

  return _addresses;
};
export const format_cepAberto = (_data: any) => {
  const data = Array.isArray(_data) ? _data : [_data];

  const _addresses = (data || [])
    .filter((e) => !!e?.cep)
    .map((e) => ({
      zipCode: e.cep.replace(/\D/g, ""),
      street: normalizeOrdinal(e.logradouro),
      neighborhood: e.bairro,
      city: e.cidade.nome,
      state: e.estado.nome ?? e.estado.sigla,
      id: randomUUID(),
      lon: e.longitude,
      lat: e.latitude,
    })) as unknown as IAddress[];

  return _addresses;
};
