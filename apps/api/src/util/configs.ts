import { getConfigs } from "@/controllers/configs/getConfigs";
import { normalize } from "@/services/text/normalize";

export const isHoodRestricted = async (neighborhood: string) => {
  const configs = await getConfigs();
  const configDelivery = configs.find((x) => x.key === "delivery")?.value;
  if (!configDelivery) throw new Error("Configurações de delivery inválidas");

  return configDelivery.restrictions.neighborhoods.some(
    (x) => x.active && normalize(x.name) === normalize(neighborhood),
  );
};

export const isStreetRestricted = async (
  street: string | null,
  zipCode: string | null,
) => {
  const configs = await getConfigs();
  const configDelivery = configs.find((x) => x.key === "delivery")?.value;
  if (!configDelivery) throw new Error("Configurações de delivery inválidas");

  return configDelivery.restrictions.streets.some(
    (x) =>
      x.active &&
      [street, zipCode]
        .filter(Boolean)
        .map((x) => (x ? normalize(x) : ""))
        .includes(normalize(x.nameOrZipcode)),
  );
};

export const isOutOfRoute = async (distanceInMetters: number) => {
  const configs = await getConfigs();
  const configDelivery = configs.find((x) => x.key === "delivery")?.value;
  if (!configDelivery) throw new Error("Configurações de delivery inválidas");

  const distInKm = distanceInMetters / 1000;
  const maxDistInKm = configDelivery.maxDistanceInKm;

  return distInKm > maxDistInKm;
};
