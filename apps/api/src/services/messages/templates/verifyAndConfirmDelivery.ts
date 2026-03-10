import { formatCurrency } from "@/services/format";
import { saveChat } from "@/services/save";
import { textStyles } from "@/services/text/styles";
import {
  isHoodRestricted,
  isOutOfRoute,
  isStreetRestricted,
} from "@/util/configs";
import { MsgReplyFunc } from "types";
import { nextStep } from "../replies";
import { saveOrderDeliveryTemplate } from "./saveOrderDelivery";

export const verifyAndConfirmDeliveryTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const { bold } = textStyles;
  const addr = chat.tempAddress;
  if (!addr || !addr.foundAddress) return nextStep({ chat, msg, entities });

  if (
    (await isOutOfRoute(addr.foundAddress.distanceInMetters)) ||
    (await isHoodRestricted(addr.foundAddress.neighborhood)) ||
    (await isStreetRestricted(
      addr.foundAddress.street,
      addr.foundAddress.zipCode,
    ))
  ) {
    // VERIFICAR NO FRONTEND SE REALMENTE N ENTREGA, SE N RESPONDER EM X SEGUNDOS, CONTINUA
    return [
      {
        body: [`Poxa, no momento não estamos entregando nessa localidade 😕`],
      },
    ];
  } else {
    await saveChat(chat.id, { context: "verifyAndConfirmDelivery" });

    const ask = (type: "confirm" | "start") => [
      {
        body: [
          `A entrega para ${bold(
            addr.foundAddress!.street?.toUpperCase(),
          )} tá custando ${bold(formatCurrency(addr.foundAddress!.fee))}`,
          type === "start"
            ? `Quer pedir pra esse endereço?`
            : `Confirma a entrega nesse endereço?`,
        ],
      },
    ];

    return chat.customerAskDeliveryFee
      ? chat.order?.products.length
        ? ask("confirm")
        : ask("start")
      : saveOrderDeliveryTemplate({ chat, msg, entities });
  }
};
// fazer o detectIntent detectar o intent customerInfo e criar o serviço para salvar o customer no chat
