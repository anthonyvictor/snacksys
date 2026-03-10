import { saveChat } from "@/services/save";
import { textStyles } from "@/services/text/styles";
import { MsgReplyFunc } from "types";
import { nextStep } from "../replies";
import { join } from "@/services/text/join";

export const confirmAddressTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const { bold } = textStyles;
  const addr = chat.tempAddress;
  if (!addr || !addr.foundAddress) return nextStep({ chat, msg, entities });

  console.log("vai pedir confirmação", addr);

  await saveChat(chat.id, { context: "confirmAddress" });
  return [
    {
      body: [
        // `Por favor, confirme o endereço antes de continuar.`,
        bold(
          join(
            [
              addr.foundAddress.street,
              addr.foundAddress.neighborhood,
              addr.number,
              addr.complement,
              addr.reference,
            ],
            ", ",
          ),
        ),
        " ",
        `O endereço tá certo?`,
      ],
    },
  ];
};
// fazer o detectIntent detectar o intent customerInfo e criar o serviço para salvar o customer no chat
