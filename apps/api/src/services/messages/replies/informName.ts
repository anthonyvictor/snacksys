import {
  capitalize,
  CustomerModel,
  formatPhoneNumber,
  ICustomer,
  InformNameEntity,
  MsgReplyFunc,
} from "types";
import { saveChat, saveOrder } from "@/services/save";
import { nextStep } from "./nextStep";
import { getChats } from "@/controllers/chat/getChats";
import { textStyles } from "@/services/text/styles";
import { saveCustomer } from "@/controllers/customer/saveCustomer";
import { getCustomers } from "@/controllers/customer/getCustomers";

export const informName: MsgReplyFunc = async ({
  msg,
  chat,
  entities: _entities,
}) => {
  const { bold } = textStyles;

  const entities = _entities as InformNameEntity;

  console.log("================== entities", entities);

  const order = chat.order;

  if (!order) return nextStep({ chat, msg, entities });

  let customer: ICustomer | null = null;
  // let customer = order.customer;
  // if (!customer) {
  // } else {
  // }
  const onlyNum = (x: string) => x.replace(/[^0-9+]/g, "");

  let from: any = chat.from || {};

  if (chat.order?.customer) return nextStep({ chat, msg, entities });

  if (entities.fullName && !from.fullName)
    from.fullName = capitalize(
      entities.fullName
        .replace(/[^a-zA-Z]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    );

  if (
    entities.phoneNumber &&
    !from.phoneNumber &&
    (entities.phoneNumber ?? "").replace(/\D+/g, "").length >= 8
  )
    from.phoneNumber = formatPhoneNumber(onlyNum(entities.phoneNumber));

  if (from) chat = (await saveChat(chat.id, { from }, true))!;

  if (!from.phoneNumber) {
    return [
      {
        body: [
          `Preciso do ${bold("seu WhatsApp")}, ou telefone com DDD pra contato. 📝`,
        ],
      },
    ];
  }

  customer = (await getCustomers({ phone: [from.phoneNumber!] }))[0];

  if (customer) {
    (await saveOrder(
      chat.order!.id,
      {
        customer: customer.id,
      } as any,
      true,
    ))!;
    chat = (await getChats({ ids: [chat.id] }))[0];
    return nextStep({ chat, msg, entities }, true);
  } else if (!from.fullName) {
    return [
      {
        body: [
          `Preciso do seu ${bold("nome completo")} pra cadastrar aqui. 📝`,
        ],
      },
    ];
  } else {
    const _customer = await CustomerModel.create({
      name: chat.from.fullName,
      phone: chat.from.phoneNumber,
      imageUrl: chat.from.imageUrl,
      description: chat.from.username || null,
      address: order.delivery?.address
        ? {
            ...order.delivery.address,
            original: order.delivery.address.original.id,
          }
        : null,
    });

    customer = (await getCustomers({ ids: [_customer.id] }))[0];

    await saveOrder(order.id, { customer: customer.id } as any, true);
    chat = (await getChats({ ids: [chat.id] }))[0];
    return [
      {
        body: [`Certo, vou salvar seu cadastro aqui... 📝`],
        delayNext: 1500,
      },
      ...(await nextStep({ chat, msg, entities }, true)),
    ];
  }

  // if (!phoneNumber) {
  //   if (entities.fullName && !chat.order?.customer?.name) {
  //     customer = (await saveCustomer({
  //       newCustomer: {
  //         id: chat.order?.customer?.id,
  //         name: entities.fullName,
  //         tags: [],
  //         description: "",
  //         address:
  //           chat.order?.customer?.address ||
  //           chat.order?.delivery?.address ||
  //           null,
  //         imageUrl: chat.order?.customer?.imageUrl || chat.from.imageUrl,
  //       },
  //     }))!;

  //     (await saveOrder(
  //       chat.order!.id,
  //       {
  //         customer: customer.id as unknown as ICustomer,
  //       },
  //       true,
  //     ))!;
  //   }
  //   return [
  //     {
  //       body: [
  //         `Me manda ${bold("seu WhatsApp")}, ou um número de telefone com DDD pra contato. 📝`,
  //       ],
  //     },
  //   ];
  // }

  // customer = (await saveCustomer(
  //   chat.order?.customer?.id,
  //   {
  //     name: chat.order?.customer?.name || entities.fullName,
  //     phone: phoneNumber,
  //     address: chat.order?.customer?.address || chat.order?.delivery?.address,
  //     imageUrl: chat.order?.customer?.imageUrl || chat.from.imageUrl,
  //   },
  //   true,
  // ))!;

  // (await saveOrder(
  //   chat.order!.id,
  //   {
  //     customer: customer.id as unknown as ICustomer,
  //   },
  //   true,
  // ))!;

  // chat = (await getChats({ ids: [chat.id] }))[0];

  // return [
  //   {
  //     body: [`Certo, vou salvar seu cadastro aqui... 📝`],
  //     delayNext: 1500,
  //   },
  //   ...(await nextStep({ chat, msg, entities })),
  // ];
};
