import axios from "axios";
import { axiosOk } from "types";
import {
  format_cepAberto,
  format_nominatim,
  format_photon,
  format_viaCEP,
} from "./format";
import { normalizeOrdinal } from "../text/ordinals";
import { bboxBase } from "./data";

export const query_viaCep = async (value?: string | null) => {
  try {
    const v = (value ?? "").trim();

    if (!v.replace(/\s/g, "").length) return [];
    if (v.replace(/\D/g, "").length === 8) return [];
    const res = await axios.get(
      `https://viacep.com.br/ws/BA/Salvador/${encodeURIComponent(
        normalizeOrdinal(v),
      )}/json/`,
    );

    if (!axiosOk(res.status) || res?.data?.erro)
      throw new Error(`Requisição ViaCEP falhou, \nurl:${res.config.url}`);

    const data = format_viaCEP(res.data);
    return data;
  } catch (err) {
    console.error(`Erro na pesquisa ViaCEP`, err);
    return [];
  }
};

export const query_nominatim = async (value?: string | null, limit = 5) => {
  try {
    const v = (value ?? "").trim();
    if (!v.replace(/\s/g, "").length) return [];
    if (v.replace(/\D/g, "").length === 8) return [];
    const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: v,
        format: "json",
        limit,
        viewbox: bboxBase,
        addressdetails: 1,
        bounded: 1,
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
    console.error(`Erro na pesquisa Nominatim`, err);
    return [];
  }
};
export const query_photon = async (value?: string | null, limit = 5) => {
  try {
    const v = (value ?? "").trim();
    if (!v.replace(/\s/g, "").length) return [];
    if (v.replace(/\D/g, "").length === 8) return [];
    const res = await axios.get(`https://photon.komoot.io/api`, {
      params: {
        q: v,
        limit,
        bbox: bboxBase,
        lang: "en",
        layer: "street",
      },
      headers: {
        "User-Agent": "site-pdb/1.0.0",
      },
    });

    if (!axiosOk(res.status))
      throw new Error(`Requisição Photon falhou, \nurl:${res.config.url}`);

    const data = format_photon(res.data);
    return data;
  } catch (err) {
    console.error(`Erro na pesquisa Photon`, err);
    return [];
  }
};

export const query_cepaberto = async (
  value?: string | null,
  bairro?: string | null,
  cidade?: string | null,
  limit = 5,
) => {
  try {
    const v = (value ?? "").trim();

    // const url = `https://www.cepaberto.com/api/v3/address?estado=BA&cidade=`

    console.log("Consulta CepAberto:", {
      value: v,
      'v.replace(/\s/g, "").length': v.replace(/\s/g, "").length,
      'v.replace(/\D/g, "").length === 8': v.replace(/\D/g, "").length === 8,
    });
    if (!v.replace(/\s/g, "").trim().length) return [];

    if (v.replace(/\D/g, "").length === 8) return [];
    console.log({
      estado: "BA",
      cidade: cidade || "Salvador",
      bairro: bairro,
      logradouro: v,
    });
    const res = await axios.get(`https://www.cepaberto.com/api/v3/address`, {
      params: {
        estado: "BA",
        cidade: cidade || "Salvador",
        bairro: bairro,
        logradouro: v,
      },
      headers: {
        Authorization: `Token token=${process.env.CEPABERTO_TOKEN}`,
      },
    });

    if (!axiosOk(res.status))
      throw new Error(`Requisição CepAberto falhou, \nurl:${res.config.url}`);

    const data = format_cepAberto(res.data);

    return data;
  } catch (err) {
    console.error(`Erro na pesquisa CepAberto`, err);
    return [];
  }
};
