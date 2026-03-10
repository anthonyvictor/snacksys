import { saveChat, saveOrder } from "@/services/save";
import { IOrderDelivery, MsgReplyFunc } from "types";
import { nextStep } from "../replies";
import { nextStepTemplate } from "./nextStep";

export const saveOrderSavedAddrTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const addr = chat.tempAddress;
  if (!addr || !addr.foundAddress) return nextStep({ chat, msg, entities });

  saveOrder(chat.order?.id, {
    delivery: {
      ...(chat.order?.delivery ?? {}),
      address: chat.order?.customer?.address!,
    } as IOrderDelivery,
    type: "delivery",
    reviewed: false,
  });
  chat = (await saveChat(
    chat.id,
    {
      context: "",
    },
    true,
  ))!;
  return [
    { body: [`Ok, vamos entregar nesse endereço então! 📝`] },
    ...(await nextStepTemplate({ chat, msg, entities })),
  ];
};
