import { getConfigs } from "@/controllers/configs/getConfigs";
import { join } from "@/services/text/join";
import { MsgReplyFunc } from "types";

export const askRestaurantAddress: MsgReplyFunc = async ({ chat }) => {
  const configs = await getConfigs();
  const configsStore = configs.find((x) => x.key === "store")?.value!;
  const storeAddr = configsStore.address;
  //const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const formattedAddress = join([
    storeAddr.complement,
    storeAddr.street,
    storeAddr.number,
    storeAddr.neighborhood,
    storeAddr.reference,
  ]);
  const encodedAddress = encodeURIComponent(
    join(
      [
        storeAddr.street,
        storeAddr.number,
        storeAddr.neighborhood,
        storeAddr.city,
        storeAddr.state,
      ],
      " ",
    ),
  );
  return [
    {
      body: [
        `Ficamos localizados no endereço: ${formattedAddress}`,

        "\nLink do Google Maps: 🗺️📍📲",
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      ],
    },
  ];
};
