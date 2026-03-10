import { saveChat, saveOrder } from "@/services/save";
import {
  IAddress,
  ICustomer,
  IFinalAddress,
  IOrderDelivery,
  MsgReplyFunc,
  OrderModel,
} from "types";
import { nextStep } from "../replies";
import { nextStepTemplate } from "./nextStep";
import { getCustomers } from "@/controllers/customer/getCustomers";
import { getOrders } from "@/controllers/order/getOrders";

export const saveOrderDeliveryTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const addr = chat.tempAddress;
  if (!addr || !addr.foundAddress) return nextStep({ chat, msg, entities });

  const finalAddress = {
    original: chat.tempAddress?.foundAddress?.id!,
    reference: chat.tempAddress?.reference,
    complement: chat.tempAddress?.complement,
    number: chat.tempAddress?.number,
  } as unknown as IFinalAddress;

  let order = chat.order;

  if (order) {
    saveOrder(chat.order?.id, {
      delivery: {
        ...(chat.order?.delivery ?? {}),
        address: finalAddress,
      } as IOrderDelivery,
      reviewed: false,
    });
  } else {
    let customer: ICustomer | null = null;
    if (chat.platform === "whatsapp") {
      // se for whatsapp, procura no banco cliente com esse numero
      customer = (await getCustomers({ phone: [chat.from.phoneNumber!] }))[0];
    }
    // if (!customer) {
    //   // se n encontrar, cria um novo
    //   if (chat.platform === "whatsapp") {
    //     customer = (await saveCustomer(
    //       undefined,
    //       {
    //         name: "",
    //         description: chat.from.publicName,
    //         imageUrl: chat.from.imageUrl,
    //         phone: chat.from.phoneNumber || "",
    //         address: finalAddress,
    //       },
    //       true,
    //     ))!;
    //   } else {
    //     throw new Error("Plataforma não suportada!");
    //   }
    // }

    const _order = await OrderModel.create({
      delivery: {
        address: finalAddress,
      } as IOrderDelivery,
      reviewed: false,
      customer,
      status: "building",
    });

    order = (await getOrders({ ids: [_order._id.toString()] }))?.[0];
  }

  chat = (await saveChat(
    chat.id,
    {
      order: order.id,
      context: "",
      tempAddress: {
        ...chat.tempAddress!,
        foundAddress: chat.tempAddress?.foundAddress
          ?.id! as unknown as IAddress,
        confirmed: true,
      },
    } as any,
    true,
  ))!;
  return [
    { body: [`Ok, endereço salvo! 📝`] },
    ...(await nextStepTemplate({ chat, msg, entities })),
  ];
};
// fazer o detectIntent detectar o intent customerInfo e criar o serviço para salvar o customer no chat
