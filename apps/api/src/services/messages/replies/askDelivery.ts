import {
  IAddress,
  IBuildingAddress,
  IChat,
  AskDeliveryEntity,
  IOrder,
  MsgReplyFunc,
} from "types";
import { textStyles } from "@/services/text/styles";
import { receivingMethodTemplate } from "../templates/receivingMethod";
import { saveChat, saveOrder } from "@/services/save";
import { whatAddressTemplate } from "../templates/whatAddress";
import { nextStepTemplate } from "../templates/nextStep";
import { join } from "@/services/text/join";
import { askRestaurantAddress } from "./askRestaurantAddress";
import { findAddressApi } from "@/controllers/addresses/findAddressApi";
import { getCommunities } from "@/controllers/community/getCommunities";
import { normalize } from "@/services/text/normalize";
import { getMostProbableAddress } from "@/services/address/getMostProbable";
import { getAddresses } from "@/controllers/addresses/getAddresses";
import { saveAddress } from "@/controllers/addresses/saveAddress";
import { mergeUniqueText } from "@/services/text/mergeUnique";
import { getChats } from "@/controllers/chat/getChats";
import { confirmAddressTemplate } from "../templates/confirmAddress";
import { verifyAndConfirmDeliveryTemplate } from "../templates/verifyAndConfirmDelivery";

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

const getCurrentInfos = (entities: AskDeliveryEntity) => {
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

  let _currStreet = entities?.address?.street ?? "";

  if (["rua", "street"].some((x) => x === _currStreet.toLowerCase()))
    _currStreet = "";

  const currentStreet = _currStreet
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
  entities: AskDeliveryEntity,
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
    // console.log("VAI SALVAR O ENDEREÇO", buildingAddress);
    // await saveChat(chat.id, { tempAddress: buildingAddress });
  }
};

const isPickup = async (
  order: IOrder | null,
  chat: IChat,
  msg: string,
  entities: AskDeliveryEntity,
) => {
  if (order?.products?.length) {
    saveOrder(chat?.order?.id, {
      type: "pickup",
      reviewed: false,
    });
    chat = (await getChats({ ids: [chat.id] }))[0];
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
  entities: AskDeliveryEntity,
) => {
  // PERGUNTA SOBRE TAXA OU SE ENTREGA
  // saveChat

  const { bold, italic } = textStyles;

  console.log("----- PEDIDO", order?.id);
  await saveOrder(order?.id, { type: "delivery", reviewed: false });
  chat = (await getChats({ ids: [chat.id] }))[0];

  const buildingAddress = buildAddress(chat);

  await updateAddress(chat, msg, entities, buildingAddress);

  const { currentStreet, currentZipCode, currentReference } =
    getCurrentInfos(entities);

  // const currentStreetLiquid = currentStreet.replace(/\b(rua|street)\b/g,'').replace(/\s+/g,' ').trim()
  // if(){

  // }

  // const isFoundAndConfirmedAddress =
  //   buildingAddress.foundAddress && buildingAddress.confirmed;

  if (
    currentStreet ||
    currentZipCode.length ||
    (currentReference && !buildingAddress.foundAddress)
  ) {
    // aqui procura o endereço com base na rua, cep ou referencia
    // primeiro procura entre os endereços salvos, primeiro pela rua, depois referencia, depois cep
    // depois procura nas apis externas

    const communities = await getCommunities({});
    const foundCommunity = communities.find((comm) =>
      normalize(currentReference).includes(normalize(comm.name)),
    );

    let candidates: IAddress[] = [];

    //ele nao entra aq pq ja tem um endereço

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

  return !buildingAddress.foundAddress || !buildingAddress?.reference
    ? whatAddressTemplate({ chat, msg, entities })
    : !buildingAddress.confirmed
      ? confirmAddressTemplate({ chat, msg, entities })
      : verifyAndConfirmDeliveryTemplate({ chat, msg, entities });
};

export const askDelivery: MsgReplyFunc = async ({
  msg,
  chat,
  entities: _entities,
}) => {
  const order = chat.order;
  const entities = _entities as AskDeliveryEntity;

  if (order?.reviewed) {
    saveChat(chat.id, { context: "unReview" });
    return [
      { body: [`O pedido já foi revisado. Deseja modificar? (Sim/Não)`] },
    ];
  }

  console.log("ASK DELIVERY ENTITIES", entities);
  if (
    entities?.type === "delivery" ||
    entities?.address ||
    chat.tempAddress?.foundAddress ||
    chat.tempAddress?.reference
  ) {
    return isDelivery(order, chat, msg, entities);
  } else if (entities?.type === "pickup") {
    return isPickup(order, chat, msg, entities);
  } else {
    return receivingMethodTemplate({ chat, msg, entities });
  }
};

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
