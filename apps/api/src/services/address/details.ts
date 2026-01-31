import { axiosOk, IAddress } from "types";
import { removeAccents } from "../format";
import axios from "axios";
import { query_cepaberto, query_nominatim, query_photon } from "./query";
import { zipcode_cepAberto } from "./zipcode";
import { HTTPError, NoLogError } from "types";
import { similarAddresses } from "./compare";
import { normalizeOrdinal } from "../text/ordinals";
import { sleep } from "../misc";
import { getConfigs } from "@/controllers/configs/getConfigs";

export const viaCep = async (
  zipCode: string,
  street?: string,
  neighborhood?: string,
  tries = 1,
): Promise<
  | {
      zipCode: string;
      street: string;
      neighborhood: string;
      city: string;
      state: string;
    }
  | undefined
> => {
  let url: string;

  // Definir URL baseado na tentativa
  if (street && tries === 1) {
    url = `https://viacep.com.br/ws/BA/${encodeURIComponent(
      "Salvador/" + normalizeOrdinal(street),
    )}/json/`;
  } else if (street && tries === 2) {
    url = `https://viacep.com.br/ws/BA/${encodeURIComponent(
      "Salvador/" + street,
    )}/json/`;
  } else if (street && tries === 3) {
    url = `https://viacep.com.br/ws/BA/${encodeURIComponent(
      "Lauro de Freitas/" + normalizeOrdinal(street),
    )}/json/`;
  } else if (street && tries === 4) {
    url = `https://viacep.com.br/ws/BA/${encodeURIComponent(
      "Lauro de Freitas/" + street,
    )}/json/`;
  } else {
    url = `https://viacep.com.br/ws/${zipCode}/json/`;
  }

  try {
    const res = await axios.get(url);

    if (!axiosOk(res.status))
      throw new NoLogError("ViaCEP falhou", { zipCode, street, neighborhood });

    let data: any = res.data;

    if (data.erro)
      throw new NoLogError("CEP inválido", { zipCode, street, neighborhood });

    data = Array.isArray(res.data) ? res.data : [res.data];

    const filtrarMesmoBairro = (d: any[]) =>
      d.filter((x) =>
        !neighborhood
          ? true
          : removeAccents(String(x.bairro).toLowerCase()) ===
            removeAccents(String(neighborhood).toLowerCase()),
      ) as any[];
    const byHood = filtrarMesmoBairro(data);

    data = byHood?.length ? byHood : data;

    data = Array.isArray(data) && data.length ? data[0] : data;

    return {
      zipCode: data.cep.replace(/\D/g, ""),
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (err) {
    // fallback recursivo
    if (tries < 5) {
      await sleep(500);
      return viaCep(zipCode, street, neighborhood, tries + 1);
    }

    console.error("ViaCEP falhou em todas as tentativas", err);
    return undefined;
  }
};

type ModoORS =
  | "cycling-regular"
  | "cycling-electric"
  | "driving-motorcycle"
  | "driving-car"
  | "driving-hgv"
  | "foot-walking";

export async function getDistance(
  lat: number | string,
  lon: number | string,
  mode: ModoORS = "foot-walking",
) {
  const configs = await getConfigs();
  const configsLocal = configs.find((x) => x.key === "store")?.value!;
  if (!configsLocal)
    throw new HTTPError("Configuração da loja não encontrada", 500);

  const ORS_API_KEY = process.env.ORS_API_KEY!;
  const rotaResp = await axios.post(
    `https://api.openrouteservice.org/v2/directions/${mode}`,
    {
      coordinates: [
        [configsLocal.address.lon, configsLocal.address.lat],
        [lon, lat],
      ],
    },
    {
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
  const rota = rotaResp.data.routes?.[0];
  if (!rota)
    throw new HTTPError("Oops, não foi possível obter a distância", 404, {
      lat,
      lon,
    });
  const distanceInMetters = rota.summary.distance;
  const timeInSeconds = rota.summary.duration;

  return { distanceInMetters, timeInSeconds };
}

export async function getExtraAddress(
  originalAddress: IAddress,
): Promise<IAddress> {
  // 1. Buscar endereço no BrasilAPI

  const compararSemelhanca = (
    origAddr: IAddress,
    finalAddr: IAddress,
    method: string,
  ) => {
    if (!finalAddr) return null;
    const ehIgual = similarAddresses(origAddr.street, finalAddr.street);
    if (!ehIgual) {
      console.info(
        `[ metodo: ${method} ] Ruas diferentes:`,

        `\n- ${origAddr.street}`,
        `\n- ${finalAddr.street}`,
      );
      return null;
    } else {
      return finalAddr;
    }
  };

  if (originalAddress.lat && originalAddress.lon) {
    if (originalAddress.distanceInMetters) {
      return originalAddress;
    } else {
      return {
        ...originalAddress,
        ...(await getDistance(originalAddress.lat, originalAddress.lon)),
      };
    }
  } else if (!originalAddress?.zipCode || !originalAddress.street) {
    throw new HTTPError(
      "Endereço não especificado para obter dados extras! Faltando cep ou nome da rua",
      400,
      originalAddress,
    );
  }

  let extraAddress: IAddress | null = null;

  const obterGeoLoc = async () => {
    if (!extraAddress) {
      extraAddress = (
        await query_cepaberto(
          originalAddress.street,
          originalAddress.neighborhood,
        )
      )?.[0];

      extraAddress = compararSemelhanca(
        extraAddress,
        originalAddress,
        "query_cepAberto",
      );
    }

    if (!extraAddress) {
      extraAddress = (await zipcode_cepAberto(originalAddress.zipCode))?.[0];
      extraAddress = compararSemelhanca(
        extraAddress,
        originalAddress,
        "zipcode_cepAberto",
      );
    }

    const qnom = async (str: string) => {
      extraAddress = (await query_nominatim(str))?.[0];
      extraAddress = compararSemelhanca(
        extraAddress,
        originalAddress,
        `query_nominatim`,
      );
    };
    const qpho = async (str: string) => {
      extraAddress = (await query_photon(str))?.[0];
      extraAddress = compararSemelhanca(
        extraAddress,
        originalAddress,
        `query_photon`,
      );
    };

    if (!extraAddress) {
      await qnom(`${originalAddress.street}, ${originalAddress.neighborhood}`);
    }

    if (!extraAddress) {
      await qnom(originalAddress.street);
    }
    if (!extraAddress) {
      await qpho(`${originalAddress.street}, ${originalAddress.neighborhood}`);
    }

    if (!extraAddress) {
      await qpho(originalAddress.street);
    }

    if (!extraAddress)
      throw new HTTPError(
        "Coordenadas não encontradas para o endereço.",
        404,
        originalAddress,
      );
  };

  await obterGeoLoc();

  extraAddress = extraAddress!;

  const { distanceInMetters, timeInSeconds } = await getDistance(
    extraAddress.lat,
    extraAddress.lon,
  );

  const zipCode = (extraAddress?.zipCode ?? originalAddress.zipCode)?.replace?.(
    /\D/g,
    "",
  );

  const enderecoFinal = {
    ...originalAddress,
    ...extraAddress,
    distanceInMetters,
    timeInSeconds,
    zipCode,
  };

  return enderecoFinal;
}
