import {
  IChatList,
  IMessage,
  MessageReplyDTO,
  AskDeliveryEntity,
  MsgReplyFunc,
} from "types";
import { textStyles } from "@/services/text/styles";
import { listToText } from "@/services/text/listToText";
import { join } from "@/services/text/join";
import { saveChat, saveOrder } from "../../save";
import { getTotal } from "@/services/order/total";
import { formatCurrency } from "@/services/format";
import { totalWithPaymentMethodTemplate } from "../templates/totalWithPaymentMethod";

export const informReceivingMethod: MsgReplyFunc = async ({
  chat,
  msg,
  entities: _entities,
}) => {
  const entities = _entities as AskDeliveryEntity;
  const resps: IMessage[] = [];

  const { bold, italic } = textStyles;
  const order = chat.order;

  if (!order) {
    return [];
  }

  if (entities.method === "pickup") {
    resps.push({ body: ["Certo, você vem buscar aqui! 🏪"] });

    await saveOrder(order.id, { type: "pickup" });

    saveChat(chat.id, { context: "informReceivingMethod" });

    if (!order.payments.length) {
      const { total } = getTotal(order);
      return totalWithPaymentMethodTemplate({ chat, msg, entities });
    } else if (!order.customer) {
      return [
        {
          body: [
            `Agora me informa seu nome e sobrenome pra eu salvar aqui no pedido!`,
            chat.platform !== "whatsapp"
              ? "Me informa também seu número de telefone"
              : "",
          ],
        },
      ];
    } else {
      return [
        {
          body: [
            `Agora me informa seu nome e sobrenome pra eu salvar aqui no pedido!`,
          ],
        },
      ];
    }
  } else if (entities.method === "delivery") {
    resps.push({ body: ["Certo, o pedido será para entrega! 🛵"] });
    if (entities.address) {
      if (entities.address.street && entities.address.neighborhood) {
        resps.push({
          body: [
            join(
              [
                bold(entities.address.neighborhood),
                italic(entities.address.street),
                italic(entities.address.number),
                italic(entities.address.complement),
                italic(entities.address.reference),
              ],
              ", ",
            ),
          ],
        });
      } else {
        resps.push({ body: [entities.address.fullAddress] });
      }
    } else {
      resps.push({ body: ["Agora me informa seu endereço completo:"] });
      resps.push(
        {
          body: [
            `*Rua*, Número (Opcional), *Bairro*, Complemento (Opcional), e *Ponto de Referência*`,
          ],
          delay: 500,
        },
        // `\n${[
        //   "BAIRRO (Obrigatório)",
        //   "RUA",
        //   "PONTO DE REFERÊNCIA",
        //   "COMPLEMENTO (Opcional)",
        //   "NÚMERO DA RESIDÊNCIA (Opcional)",
        // ]
        //   .map((x, i) => `${i + 1}. *${x}*`)
        //   .join("\n")}`
      );
      resps.push({
        body: [
          `Exemplo: Rua do canal, 27, Pituba, bloco B, próximo ao mercado mini preço`,
        ],
        delay: 500,
      });
    }
  }

  saveChat(chat.id, { context: "informReceivingMethod" });
  return [...resps];
};
