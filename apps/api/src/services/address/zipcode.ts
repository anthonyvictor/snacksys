import { axiosOk } from "types";
import axios from "axios";
import { format_brasilApi, format_cepAberto, format_viaCEP } from "./format";

export const zipcode_cepAberto = async (value?: string | null) => {
  try {
    const v = (value ?? "").replace(/\D/g, "");
    if (v.length !== 8) return [];
    const res = await axios.get(`https://www.cepaberto.com/api/v3/cep`, {
      params: { cep: v },
      headers: {
        Authorization: `Token token=${process.env.CEPABERTO_TOKEN}`,
      },
    });

    if (!axiosOk(res.status) || res?.data?.erro)
      throw new Error(`Requisição CepAberto falhou, \nurl:${res.config.url}`);

    const data = format_cepAberto(res.data);
    return data;
  } catch (err) {
    console.error(`Erro no cep CepAberto`, err);
    return [];
  }
};
export const zipcode_brasilApi = async (value?: string | null) => {
  try {
    const v = (value ?? "").replace(/\D/g, "");
    if (v.length !== 8) return [];
    const res = await axios.get(`https://brasilapi.com.br/api/cep/v2/${v}`);

    if (!axiosOk(res.status) || res?.data?.erro)
      throw new Error(`Requisição BrasilAPI falhou, \nurl:${res.config.url}`);

    const data = format_brasilApi(res.data);
    return data;
  } catch (err) {
    console.error(`Erro no cep brasilApi`, err);
    return [];
  }
};

export const zipcode_viaCep = async (value?: string | null) => {
  try {
    const v = (value ?? "").replace(/\D/g, "");
    if (v.length !== 8) return [];
    const res = await axios.get(`https://viacep.com.br/ws/${v}/json/`);

    if (!axiosOk(res.status) || res?.data?.erro)
      throw new Error(`Requisição ViaCEP falhou, \nurl:${res.config.url}`);

    const data = format_viaCEP(res.data);
    return data;
  } catch (err) {
    console.error(`Erro no cep ViaCEP`, err);
    return [];
  }
};
