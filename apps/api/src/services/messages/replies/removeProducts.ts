import { MsgReplyFunc } from "types";
import { saveChat, saveOrder } from "../../save";
import { whatProductsTemplate } from "../templates/whatProducts";
import { nextStep } from "./nextStep";

export const removeProducts: MsgReplyFunc = async ({ chat, msg, entities }) => {
  if (!chat.order || !chat.order.products || !chat.order.products.length)
    return nextStep({ chat, msg, entities });

  saveOrder(chat.order?.id, { products: [], reviewed: false });
  return [
    {
      body: ["Certo, tirei os produtos do seu pedido, agora me diz aí..."],
      delayNext: 1000,
    },
    ...(await whatProductsTemplate({ chat, msg, entities })),
  ];
};
