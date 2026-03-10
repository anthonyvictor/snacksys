import {
  IAddress,
  IChat,
  ICustomer,
  IFinalAddress,
  IOrderDelivery,
  MsgReplyFunc,
} from "types";
import { nextStepTemplate } from "../templates/nextStep";
import { saveChat, saveOrder } from "@/services/save";
import { getChats } from "@/controllers/chat/getChats";
import { askDelivery } from "./askDelivery";
import { getCustomers } from "@/controllers/customer/getCustomers";
import { saveOrderDeliveryTemplate } from "../templates/saveOrderDelivery";
import { saveOrderSavedAddrTemplate } from "../templates/saveOrderSavedAddr";

export const confirm: MsgReplyFunc = async ({ chat, msg, entities }) => {
  if (chat.context === "askSavedAddress") {
    return saveOrderSavedAddrTemplate({ chat, msg, entities });
  } else if (chat.context === "reviewOrder") {
    saveOrder(chat.order?.id, { reviewed: true });
    chat = (await getChats({ ids: [chat.id] }))[0];
    return nextStepTemplate({ chat, msg, entities });
  } else if (chat.context === "unReview") {
    saveOrder(chat.order?.id, { reviewed: false });
    return [
      {
        body: [`Certo, o que deseja alterar no pedido?`],
      },
    ];
  } else if (chat.context === "verifyAndConfirmDelivery") {
    await saveChat(chat.id, { customerAskDeliveryFee: false });
    return saveOrderDeliveryTemplate({ chat, msg, entities });
  } else if (chat.context === "confirmAddress") {
    if (chat.tempAddress?.foundAddress) {
      console.log("entrou em confirm address", chat.tempAddress);
      chat = (await saveChat(
        chat.id,
        { "tempAddress.confirmed": true } as any,
        true,
      )) as IChat;
      return askDelivery({ chat, msg, entities });
    } else {
      return nextStepTemplate({ chat, msg, entities });
    }
  } else {
    return nextStepTemplate({ chat, msg, entities });
  }

  // return [
  //   {
  //     body: [
  //       `Pedido confirmado! 🎉 Muito obrigado por comprar com a gente. Em breve entraremos em contato para confirmar os detalhes do seu pedido.`,
  //     ],
  //   },
  // ];

  // return [
  //   {
  //     body: [
  //       `Se deseja cancelar o pedido, digite *"cancelar"*.`,
  //       `Se deseja continuar, me diz aí o que você quer pedir!`,
  //     ],
  //   },
  // ];
};
