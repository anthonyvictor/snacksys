import {
  IAddress,
  IBuildingAddress,
  IChat,
  InformReceivingMethodEntity,
  IOrder,
  MsgReplyFunc,
} from "types";
import { formatCurrency } from "@/services/format";
import { textStyles } from "@/services/text/styles";
import { receivingMethodTemplate } from "../templates/receivingMethod";
import { saveChat, saveOrder } from "@/services/save";
import { whatAddressTemplate } from "../templates/whatAddress";
import { nextStepTemplate } from "../templates/nextStep";
import { join } from "@/services/text/join";
import {
  isHoodRestricted,
  isOutOfRoute,
  isStreetRestricted,
} from "@/util/configs";
import { askRestaurantAddress } from "./askRestaurantAddress";
import { findAddressApi } from "@/controllers/addresses/findAddressApi";
import { extractAddressIA2 } from "@/services/ia/extractAddress2";
import { getCommunities } from "@/controllers/community/getCommunities";
import { normalize } from "@/services/text/normalize";
import { getMostProbableAddress } from "@/services/address/getMostProbable";
import { getAddresses } from "@/controllers/addresses/getAddresses";
import { saveAddress } from "@/controllers/addresses/saveAddress";
import { mergeUniqueText } from "@/services/text/mergeUnique";
import { reverse } from "dns";

const validKeys = [
  "street",
  "neighborhood",
  "number",
  "complement",
  "reference",
  "zipCode",
  "city",
  "state",
];

const buildAddress = (chat: IChat): IBuildingAddress => {
  return {
    street: chat.tempAddress?.street || null,
    neighborhood: chat.tempAddress?.neighborhood || null,
    reference: chat.tempAddress?.reference || null,
    number: chat.tempAddress?.number || null,
    city: chat.tempAddress?.city || null,
    state: chat.tempAddress?.state || null,
    zipCode: chat.tempAddress?.zipCode || null,
    complement: chat.tempAddress?.complement || null,
    foundAddress: chat.tempAddress?.foundAddress || null,
    allMessages: chat.tempAddress?.allMessages || "",
    confirmed: chat.tempAddress?.confirmed || false,
  };
};

const getCurrents = (entities: InformReceivingMethodEntity) => {
  const rf = (entities?.address?.reference ?? "")
    .toLowerCase()
    .replace(
      /\b(d?n?(ao?i?s?|eh?i?|i|oi?s?)|uma?|d(ois|uas|eu)|eu|el(a|e))\b/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  const zp = (entities?.address?.zipCode ?? "").replace(/[\D+]/g, "");

  const currentReference = rf.split(" ").filter((x) => x.length > 3).length
    ? rf
    : "";

  const currentZipCode = zp.length === 8 ? zp : "";

  console.log("CURRENT STREEEEEEEETTTTTTTTTTTTTTT", entities?.address?.street);

  const currentStreet = (entities?.address?.street || "")
    .replace(
      /(?<!\S)(d?n?(ao?i?s?|eh?i?|i|oi?s?)|uma?|d(ois|uas|eu)|eu|el(a|e))(?!\S)/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  return { currentReference, currentStreet, currentZipCode };
};

const updateAddress = async (
  chat: IChat,
  msg: string,
  entities: InformReceivingMethodEntity,
  buildingAddress: IBuildingAddress,
) => {
  if (entities?.address) {
    // atualiza o endereço em construção
    buildingAddress.allMessages = join(
      [chat?.tempAddress?.allMessages, msg],
      ", ",
    );

    const entries = Object.entries(entities.address).filter(
      (x) => !!x[1] && validKeys.includes(x[0].toLowerCase()),
    );

    if (entries.length) {
      entries.forEach((e) => {
        const val = e[1];
        if ((buildingAddress as any)[e[0]]) {
          if (e[0] === "number") {
            (buildingAddress as any)[e[0]] = val;
          } else {
            (buildingAddress as any)[e[0]] = mergeUniqueText(
              (buildingAddress as any)[e[0]],
              val,
            );
            // (buildingAddress as any)[e[0]] += ", " + val;
          }
        } else {
          (buildingAddress as any)[e[0]] = val;
        }
      });
    }
    // aqui tem q ter alguma coisa tipo ia pra limpar as props, tipo reference: "ao lado do mercado ao lado do mercado em cima de nana"
    // console.log("VAI SALVAR O ENDEREÇO", buildingAddress);
    // await saveChat(chat.id, { tempAddress: buildingAddress });
  }
};

const isPickup = async (
  order: IOrder | null,
  chat: IChat,
  msg: string,
  entities: InformReceivingMethodEntity,
) => {
  if (order?.products?.length) {
    saveOrder(chat?.order?.id, {
      type: "pickup",
      reviewed: false,
    });
    return [
      {
        body: [`Ok, você vem buscar o pedido`],
      },
      ...(await nextStepTemplate({ chat, msg, entities })),
    ];
  } else {
    return askRestaurantAddress({ chat, msg, entities });
  }
};
const isDelivery = async (
  order: IOrder | null,
  chat: IChat,
  msg: string,
  entities: InformReceivingMethodEntity,
) => {
  // PERGUNTA SOBRE TAXA OU SE ENTREGA
  // saveChat

  const { bold, italic } = textStyles;

  console.log("----- PEDIDO", order?.id);
  await saveOrder(order?.id, { type: "delivery", reviewed: false });

  const buildingAddress = buildAddress(chat);

  await updateAddress(chat, msg, entities, buildingAddress);

  const { currentStreet, currentZipCode, currentReference } =
    getCurrents(entities);

  const isFoundAddress =
    chat.tempAddress?.foundAddress && chat.tempAddress?.confirmed;
  if (
    currentStreet ||
    currentZipCode.length ||
    (currentReference && !isFoundAddress)
  ) {
    // aqui procura o endereço com base na rua, cep ou referencia
    // primeiro procura entre os endereços salvos, primeiro pela rua, depois referencia, depois cep
    // depois procura nas apis externas

    const communities = await getCommunities({});
    const foundCommunity = communities.find((comm) =>
      normalize(currentReference).includes(normalize(comm.name)),
    );

    let candidates: IAddress[] = [];

    if (foundCommunity) {
      candidates = await getAddresses({
        streets: [foundCommunity.street],
      });

      if (!candidates.length) {
        candidates = await findAddressApi({
          street: foundCommunity.street,
          neighborhood: foundCommunity.neighborhood,
          zipCode: foundCommunity.zipCode,
        });
      }
    } else if (currentStreet || currentZipCode) {
      candidates = await findAddressApi({
        street: currentStreet,
        neighborhood:
          entities.address?.neighborhood ?? buildingAddress.neighborhood,
        zipCode: currentZipCode,
      });
    }

    if (candidates.length) {
      console.log("Endereços encontrados:", candidates);

      const probableAddress = await getMostProbableAddress(
        buildingAddress.allMessages,
        candidates,
      );

      const newAddress = await saveAddress({ newAddress: probableAddress });

      buildingAddress.foundAddress = newAddress;

      console.log("Endereço provável:", buildingAddress.foundAddress);
    }

    // let allMsgs = normalize(buildingAddress.allMessages);

    // if (currentStreet || currentZipCode) {
    //   // procura nas apis externas pq tem rua ou cep

    //   const correctAddress = await findCommunity();

    //   console.log("Endereço extraído pela IA:", correctAddress);

    //   buildingAddress.foundAddress = getMostProbableAddress(
    //     buildingAddress.allMessages,
    //     candidates,
    //   );

    //   console.log("Endereço provável:", buildingAddress.foundAddress);

    //   console.log("Endereços encontrados:", candidates);

    //   // const addressesResult = await findAddressApi({

    //   // })

    //   // buildingAddress.foundAddress = {
    //   //   street: buildingAddress?.street || "Rua Tal",
    //   //   zipCode: buildingAddress?.zipCode || "40.000-000",
    //   //   fee: 6.9,
    //   //   distanceInMetters: 1500,
    //   //   city: "Salvador",
    //   //   state: "Bahia",
    //   //   lat: -15.09626201,
    //   //   lon: -36.161165,
    //   //   timeInSeconds: 350,
    //   //   neighborhood: buildingAddress?.neighborhood || "Bairro Tal",
    //   // };
    // } else {
    //   // procura somente nos pontos conhecidos, pq n tem cep nem rua

    //   let allMsgs = buildingAddress.allMessages.toLowerCase();
    //   const foundCommunity = communities.find((comm) =>
    //     normalize(allMsgs).includes(normalize(comm.name)),
    //   );

    //   if (foundCommunity) {
    //     const correctAddress = await findCommunity();

    //     if (correctAddress?.street) {
    //       const candidates = await findAddressApi({
    //         street: correctAddress.street,
    //         neighborhood: correctAddress.neighborhood,
    //         zipCode: correctAddress.zipCode,
    //       });

    //       console.log("Endereços encontrados:", candidates);

    //       // if (
    //       //   ["upa", "diamante", "visconde", "mane"].some((x) =>
    //       //     (buildingAddress.reference ?? "").includes(x),
    //       //   )
    //       // ) {
    //       //   buildingAddress.foundAddress = {
    //       //     street: buildingAddress?.street || "Av Aliomar Baleeiro (Pela ref)",
    //       //     zipCode: buildingAddress?.zipCode || "40.000-000",
    //       //     fee: 6.9,
    //       //     distanceInMetters: 1500,
    //       //     city: "Salvador",
    //       //     state: "Bahia",
    //       //     lat: -15.09626201,
    //       //     lon: -36.161165,
    //       //     timeInSeconds: 350,
    //       //     neighborhood: buildingAddress?.neighborhood || "São Cristóvão",
    //       //   };
    //       // }
    //     }
    //   }
    // }
  }

  chat = (await saveChat(
    chat.id,
    {
      tempAddress: {
        ...buildingAddress,
        foundAddress: (buildingAddress.foundAddress
          ? buildingAddress.foundAddress.id
          : null) as unknown as IAddress,
      },
    },
    true,
  ))!;

  if (
    !buildingAddress.foundAddress ||
    (buildingAddress?.reference ?? "").length < 6
  ) {
    return whatAddressTemplate({
      chat,
      msg,
      entities: {
        type: "delivery",
        address: buildingAddress,
      },
    });
  }
  if (!chat.tempAddress?.foundAddress?.confirmed) {
    console.log(
      "PEDINDO CONFIRMAÇÃO DE ENDEREÇO",
      buildingAddress.foundAddress,
    );
    await saveChat(chat.id, { context: "confirmAddress" });
    return [
      {
        body: [
          `Por favor, confirme o endereço antes de continuar.`,
          bold(
            join(
              [
                buildingAddress.foundAddress.street,
                buildingAddress.foundAddress.neighborhood,
                buildingAddress.number,
                buildingAddress.complement,
                buildingAddress.reference,
              ],
              ", ",
            ),
          ),
          `O endereço está correto? `,
        ],
      },
    ];
  }

  if (
    (await isOutOfRoute(buildingAddress.foundAddress.distanceInMetters)) ||
    (await isHoodRestricted(buildingAddress.foundAddress.neighborhood)) ||
    (await isStreetRestricted(
      buildingAddress.foundAddress.street,
      buildingAddress.foundAddress.zipCode,
    ))
  ) {
    // VERIFICAR NO FRONTEND SE REALMENTE N ENTREGA, SE N RESPONDER EM X SEGUNDOS, CONTINUA
    return [
      {
        body: [`Poxa, no momento não estamos entregando nessa localidade 😕`],
      },
    ];
  } else {
    return [
      {
        body: [
          `A entrega para ${bold(
            buildingAddress.foundAddress.street?.toUpperCase(),
          )} tá custando ${bold(
            formatCurrency(buildingAddress.foundAddress.fee),
          )}`,
          `Confirma esse endereço? ${bold("(Sim / Não)")}`,
        ],
      },
    ];
  }
};

export const askDelivery: MsgReplyFunc = async ({
  msg,
  chat,
  entities: _entities,
}) => {
  const order = chat.order;
  const entities = _entities as InformReceivingMethodEntity;

  if (entities.type === "delivery" || entities?.address) {
    return isDelivery(order, chat, msg, entities);
  } else if (entities.type === "pickup") {
    return isPickup(order, chat, msg, entities);
  } else {
    return receivingMethodTemplate({ chat, msg, entities });
  }

  // const list = [
  //   "Lista de bairros em que entregamos:",
  //   "\n",
  //   [
  //     "Ondina",
  //     "Rio Vermelho",
  //     "Barra",
  //     "Federação",
  //     "Brotas",
  //     "Amaralina",
  //     "Pituba",
  //   ]
  //     .map((x, i) => `${i + 1}. ${x}`)
  //     .join("\n"),
  // ];
};
