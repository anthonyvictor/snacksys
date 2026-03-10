import { saveChat } from "@/services/save";
import { MsgReplyFunc } from "types";
import { receivingMethodTemplate } from "../templates/receivingMethod";
import { whatProductsTemplate } from "../templates/whatProducts";

export const askTotal: MsgReplyFunc = async ({ chat, msg, entities }) => {
  const order = chat.order;

  if (!order || !order.products.length) {
    return [
      { body: [`Primeiro, vamos adicionar alguns itens ao seu pedido.`] },
      ...(await whatProductsTemplate({ chat, msg, entities })),
    ];
  } else if (
    !order.type ||
    (order.type === "delivery" && !order.delivery?.fee)
  ) {
    // await saveChat(chat.id, { lastQuestion: '' } );

    return [
      {
        body: [`Antes de eu te passar o total me diz uma coisinha:`],
      },
      ...(await receivingMethodTemplate({ chat, msg, entities })),
    ];
  }

  const productsPrice = order.products.reduce((sum, p) => sum + p.price, 0);

  const feePrice = order.type === "delivery" ? order.delivery?.fee || 0 : 0;
  const totalPrice = productsPrice + feePrice;
  return [
    {
      body: [
        `Até aqui, o pedido tá dando um total de *R$ ${totalPrice.toFixed(2)}*${
          order.type === "pickup" ? " (para retirada)" : " (com a entrega)"
        } 💰`,
        `Posso te mandar um resumo completo do pedido, pra gente confirmar tudo certinho`,
      ],
    },
    {
      body: [
        `Se quiser adicionar mais algum produto, é só me falar quais vc quer.`,
      ],
      delay: 1500,
    },
  ];
};
