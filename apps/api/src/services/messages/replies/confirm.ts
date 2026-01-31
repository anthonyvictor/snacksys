import { IAddress, IFinalAddress, IOrderDelivery, MsgReplyFunc } from "types";
import { nextStepTemplate } from "../templates/nextStep";
import { saveChat, saveCustomer, saveOrder } from "@/services/save";

export const confirm: MsgReplyFunc = async ({ chat, msg, entities }) => {
  if (chat.context === "askSavedAddress") {
    saveOrder(chat.order?.id, {
      delivery: {
        ...(chat.order?.delivery ?? {}),
        address: chat.customer?.address!,
      } as IOrderDelivery,
            reviewed: false,

    });
    saveChat(chat.id, {
      context: "",
    });
    return [
      { body: [`Ok, vamos entregar nesse endereço então! 📝`] },
      ...(await nextStepTemplate({ chat, msg, entities })),
    ];
  } else if (chat.context === "confirmAddress") {
    const finalAddress = {
      original: chat.tempAddress?.foundAddress?.id!,
      reference: chat.tempAddress?.reference,
      complement: chat.tempAddress?.complement,
      number: chat.tempAddress?.number,
    } as unknown as IFinalAddress;
    saveOrder(chat.order?.id, {
      delivery: {
        ...(chat.order?.delivery ?? {}),
        address: finalAddress,
      } as IOrderDelivery,
      reviewed: false,
    });
    if (!chat.customer?.address) {
      saveCustomer(chat.customer?.id, {
        address: finalAddress,
      });
    }
    saveChat(chat.id, {
      context: "",
      tempAddress: {
        ...chat.tempAddress!,
        foundAddress: chat.tempAddress?.foundAddress
          ?.id! as unknown as IAddress,
        confirmed: true,
      },
    });
    return [
      { body: [`Ok, endereço salvo! 📝`] },
      ...(await nextStepTemplate({ chat, msg, entities })),
    ];
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
