import { IMessage, MessageReplyDTO, MsgReplyFunc } from "types";
import { getTotal } from "@/services/order/total";
import { formatCurrency } from "@/services/format";
import { join } from "@/services/text/join";
import { askCustomerNameTemplate } from "../templates/askCustomerName";

export const continueOrder: MsgReplyFunc = async ({ chat, msg, entities }) => {
  const order = chat.order;

  const concat: IMessage[] = [];
  if (order?.products?.length) {
    concat.push({
      body: ["Se quiser mais algum item, é só me falar!"],
    });
  }

  if (!order?.products?.length) {
    return [
      {
        body: [`Me diz quais produtos que você quer incluir no pedido.`],
      },
      {
        body: [`Se quiser, digita *"cardápio"* que te envio aqui!`],
        delay: 500,
      },
    ];
  } else if (!order?.type) {
    return [
      {
        body: [
          `O seu pedido será para entrega ou retirada? Se for entrega, me fala seu endereço`,
        ],
      },
    ];
  } else if (
    order?.type === "delivery" &&
    !order.delivery?.address?.original?.neighborhood
  ) {
    return [
      {
        body: [
          `Me informa seu endereço completo com a *rua*, o *bairro* e *ponto de referência*`,
        ],
      },
    ];
  } else if (!order?.payments?.length) {
    const { total } = getTotal(order);
    return [
      {
        body: [
          `Por enquanto tá dando um total de ${formatCurrency(total)}`,
          "Agora me diz, qual vai ser a forma de pagamento? (*PIX*, *Dinheiro*, ou *Cartão*)",
          "Se quiser adicionar outros itens no pedido, ou se quiser que o pedido seja para entrega, é só falar!",
        ],
      },
    ];
  } else if (!order.customer) {
    return askCustomerNameTemplate({ chat, msg, entities });
  } else {
    const data: string[] = [];

    const products =
      `*==== PRODUTOS ====*\n\n` +
      order.products
        .map((prod) =>
          [
            `*- x${prod.quantity} ${prod.original.name}*`,
            ` ${formatCurrency(prod.price * prod.quantity - prod.discount)}`,
          ].join("\n"),
        )
        .join("\n\n");

    data.push(products);
    if (order.type === "delivery" && order.delivery?.address) {
      const {
        original: { neighborhood, street, zipCode },
        complement,
        number,
        reference,
      } = order.delivery.address;
      const delivery =
        `*==== ENTREGA ====*\n\n` +
        join(
          [neighborhood, complement, number, reference, street, zipCode],
          ", ",
        );
      data.push(delivery);
    } else if (order.type === "pickup") {
      const pickup = `*==== RETIRADA NA LOJA ====*\n\n`;
      data.push(pickup);
    }

    const payments =
      `*==== PAGAMENTO ====*\n\n` +
      order.payments
        .map((pay) =>
          join(
            [
              `*- ${formatCurrency(pay.amount)} ${
                pay.method === "card"
                  ? "No cartão"
                  : pay.method === "cash"
                    ? "Em dinheiro"
                    : "Via PIX"
              }*`,
              pay.method === "cash"
                ? ` ${pay.changeFor ? `Troco p/${pay.changeFor}` : "Sem troco"}`
                : "",
            ],
            "\n",
          ),
        )
        .join("\n\n");
    data.push(payments);

    return [
      {
        body: ["Vamos revisar o pedido!"],
      },
      {
        body: [data.join("\n\n")],
        delay: 1000,
      },
      {
        body: [`Podemos confirmar?`],
        delay: 1000,
      },
    ];
  }
};
