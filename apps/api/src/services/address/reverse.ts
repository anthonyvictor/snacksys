import axios from "axios";
import { axiosOk } from "types";
import { format_cepAberto, format_nominatim, format_photon } from "./format";

export const pos_photon = async (pos?: [number, number] | null, limit = 5) => {
  if (!pos) return [];
  try {
    const res = await axios.get(`https://photon.komoot.io/reverse`, {
      params: {
        lat: pos[0],
        lon: pos[1],
        layer: "street",
        limit,
      },
    });

    if (!axiosOk(res.status))
      throw new Error(`Requisição photon falhou, \nurl:${res.config.url}`);

    const data = format_photon(res.data);
    return data;
  } catch (err) {
    console.error(`Erro na posicao photon`, err);
    return [];
  }
};

export const pos_cepaberto = async (
  pos?: [number, number] | null,
  limit = 5,
) => {
  if (!pos) return [];

  try {
    const res = await axios.get(`https://www.cepaberto.com/api/v3/nearest`, {
      params: {
        lat: pos[0],
        lng: pos[1],
      },
      headers: {
        Authorization: `Token token=${process.env.CEPABERTO_TOKEN}`,
        "User-Agent": "site-pdb/1.0.0",
      },
    });

    if (!axiosOk(res.status))
      throw new Error(`Requisição CepAberto falhou, \nurl:${res.config.url}`);

    const data = format_cepAberto(res.data);
    return data;
  } catch (err) {
    console.error(`Erro na posicao CepAberto`, err);
    return [];
  }
};
export const pos_nominatim = async (
  pos?: [number, number] | null,
  limit = 5,
) => {
  if (!pos) return [];
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        format: "json",
        addressdetails: 1,
        lat: pos[0],
        lon: pos[1],
      },
      headers: {
        "User-Agent": "MeuDeliveryBot/1.0 (thonnystudiosdev@gmail.com)", // Identifique-se aqui
        // 'Referer': 'https://seusite.com.br' // Opcional, mas ajuda
      },
    });

    if (!axiosOk(res.status))
      throw new Error(`Requisição Nominatim falhou, \nurl:${res.config.url}`);

    const data = format_nominatim(res.data);
    return data;
  } catch (err) {
    console.error(`Erro na posicao Nominatim`, err);
    return [];
  }
};
