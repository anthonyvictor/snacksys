import { textStyles } from "@/services/text/styles";
import { MsgReplyFunc } from "types";
import { sendMeLocationTemplate } from "./sendMeLocation";
import { savedAddressTemplate } from "./savedAddress";

export const whatAddressTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const { bold, italic } = textStyles;

  if (
    chat.order?.products?.length &&
    chat.order.customer?.address &&
    !chat.askSavedAddress
  )
    return savedAddressTemplate({ chat, msg, entities });

  if (
    chat.tempAddress?.foundAddress &&
    (chat.tempAddress?.reference ?? "").length < 6
  ) {
    return [
      {
        body: [
          `Precisamos de ${bold("pontos de referência")}, por ex:`,
          italic(
            `${bold("Perto do")} mercado mine preço, ${bold(
              "ao lado da",
            )} farmácia`,
          ),
        ],
      },
    ];
  } else if (chat.tempAddress?.reference && !chat.tempAddress?.foundAddress) {
    return [
      {
        body: [`Precisamos do ${bold("nome da rua")} ou ${bold("CEP")} 📝`],
        delayNext: 1000,
      },
      ...(await sendMeLocationTemplate({ chat, msg, entities })),
    ];
  }

  return sendMeLocationTemplate({ chat, msg, entities });
};

//(rua, número, bairro e ponto de referência)
