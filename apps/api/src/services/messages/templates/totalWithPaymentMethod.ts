import { getOrderValues, MsgReplyFunc } from "types";
import { paymentMethodTemplate } from "./paymentMethod";
import { formatCurrency } from "@/services/format";

export const totalWithPaymentMethodTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const order = chat.order!;

  const { totalPrice } = getOrderValues(order);

  return [
    {
      body: [
        `Até aqui, o pedido tá dando um *total de ${formatCurrency(
          totalPrice
        )} ${
          order.type === "delivery" ? "com a entrega" : "para retirada"
        }* 💰`,
      ],
      delayNext: 1000,
    },
    ...(await paymentMethodTemplate({ chat, msg, entities })),
  ];
};
