import { MsgReplyFunc, OrderModel } from "types";
import { whatAddressTemplate } from "../templates/whatAddress";
import { nextStepTemplate } from "../templates/nextStep";

export const deny: MsgReplyFunc = async ({ chat, msg, entities }) => {
  if (chat.context === "sendMeLocation") {
    return whatAddressTemplate({ chat, msg, entities });
  } else if (chat.context === "askSavedAddress") {
    return whatAddressTemplate({ chat, msg, entities });
  } else if (chat.context === "reviewOrder") {
    return [
      {
        body: [
          `Ok, vamos voltar então. Se deseja cancelar o pedido, digite *"cancelar"*.`,
        ],
      },
    ];
  } else {
    return nextStepTemplate({ chat, msg, entities });
  }
};
