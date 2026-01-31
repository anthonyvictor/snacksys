import { IAddress } from "types";

import fuzz from "fuzzball";
import { getConfigs } from "@/controllers/configs/getConfigs";
import { removeAccents } from "../text/removeAccents";

function calcularDistancia(addr1: IAddress, addr2: IAddress) {
  const R = 6371e3; // Raio da Terra em metros
  const dLat = ((Number(addr2.lat) - Number(addr1.lat)) * Math.PI) / 180;
  const dLon = ((Number(addr2.lon) - Number(addr1.lon)) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(addr1.lat) * Math.PI) / 180) *
      Math.cos((Number(addr2.lat) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  console.log(addr1.street, addr1.neighborhood, "distancia", R * c, "metros");

  return R * c; // Distância em metros
}

export async function getMostProbableAddress(msg: string, arr: IAddress[]) {
  const configs = await getConfigs();
  const cfgStore = configs.find((x) => x.key === "store")?.value!;
  return arr
    .map((addr) => {
      // 1. Similaridade de Texto (0 a 100)
      const fullAddress = `${addr.street} ${addr.neighborhood}`.toLowerCase();
      const textoScore = fuzz.partial_ratio(
        removeAccents(msg.toLowerCase())
          .replace(/^tv\.? /g, "travessa ")
          .replace(/^r\.? /g, "rua ")
          .replace(/^av\.? /g, "avenida ")
          .replace(/^lad\.? /g, "ladeira ")
          .replace(/^ala?\.? /g, "alameda ")
          .replace(/\b(sao cr?istova?o)\b/g, "bairro sao cristovao"),

        fullAddress,
      );

      // 2. Score de Distância (Inverso: quanto menor a distância, maior o score)
      // Ex: se estiver a mais de 10km, o score cai muito
      const distScore = Math.max(
        0,
        100 -
          (addr.distanceInMetters ??
            calcularDistancia(addr, cfgStore.address)) /
            100,
      );

      // 3. Score de Popularidade
      const popScore = Math.min(100, (addr.timesSelected ?? 0) * 10);
      console.log(
        addr.neighborhood,
        "textoScore",
        textoScore,
        "distScore",
        distScore,
        "popScore",
        popScore,
      );

      // Peso Final
      const finalScore = textoScore * 0.7 + distScore * 0.2 + popScore * 0.1;

      return { ...addr, totalScore: finalScore };
    })
    .sort((a, b) => b.totalScore - a.totalScore)[0]; // Pega o maior score
}
