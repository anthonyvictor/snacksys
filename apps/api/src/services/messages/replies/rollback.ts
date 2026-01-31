import { IMessage, MessageReplyDTO, MsgReplyFunc, OrderModel } from "types";
import { receivingMethodTemplate } from "../templates/receivingMethod";
import { paymentMethodTemplate } from "../templates/paymentMethod";

export const rollback: MsgReplyFunc = async ({ chat, msg, entities }) => {
  const order = chat.order;
  if (!order) {
    return [
      {
        body: [
          "Se quiser fazer um pedido, é só me falar o que você quer pedir !😊",
          "Posso te mandar o cardápio, digita *'cardápio'* que eu te envio aqui!",
        ],
      },
    ];
  }

  if (chat.context === "addProducts" && order.products?.length) {
    await OrderModel.findByIdAndUpdate(order.id, {
      $set: {
        products: [],
      },
    });

    return [
      {
        body: [
          "Certo, vou remover os produtos do seu pedido, um momentinho...",
        ],
      },
      {
        body: ["Pronto, agora me diz, o que você quer pedir?"],
        delay: 2000,
      },
      {
        body: [
          'Peço que diga todos os itens em uma só mensagem, de forma *direta e objetiva*, por ex: "quero 1 pastel calabresa e pepsi 1L"',
        ],
        delay: 1000,
      },
    ];
  } else if (chat.context === "addPayments" && order.payments?.length) {
    await OrderModel.findByIdAndUpdate(order.id, {
      $set: {
        payments: [],
      },
    });
    return paymentMethodTemplate({ chat, msg, entities });
  } else if (chat.context === "informReceivingMethod") {
    await OrderModel.findByIdAndUpdate(order.id, {
      $set: {
        delivery: null,
      },
    });
    return receivingMethodTemplate({ chat, msg, entities });
  } else {
    return [
      {
        body: [
          `Se deseja cancelar o pedido, digite *"cancelar"*.`,
          `Se deseja continuar, me diz aí o que você quer pedir!`,
        ],
      },
    ];
  }
};
