import { MsgReplyFunc, OrderModel } from "types";
import { whatAddressTemplate } from "../templates/whatAddress";
import { nextStepTemplate } from "../templates/nextStep";
import { saveOrder } from "@/services/save";

export const deny: MsgReplyFunc = async ({ chat, msg, entities }) => {
  if (chat.context === "sendMeLocation") {
    return whatAddressTemplate({ chat, msg, entities });
  } else if (chat.context === "askSavedAddress") {
    return whatAddressTemplate({ chat, msg, entities });
  } else if (chat.context === "unReview") {
    return nextStepTemplate({ chat, msg, entities });
  } else if (chat.context === "reviewOrder") {
    saveOrder(chat.order?.id, { reviewed: false });
    return [
      {
        body: [
          `Ok, o que deseja alterar no pedido? (Adicionar/Remover itens, mudar endereço, adicionar observações, etc)`,
        ],
      },
    ];
  } else {
    return nextStepTemplate({ chat, msg, entities });
  }
};
