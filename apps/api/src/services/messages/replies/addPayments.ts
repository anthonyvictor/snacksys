import {
  AddPaymentsEntity,
  IMessage,
  IOrderPayment,
  MessageReplyDTO,
  MsgReplyFunc,
} from "types";

import { formatCurrency } from "@/services/format";
import { saveChat, saveOrder } from "../../save";
import { findPaymentsIA } from "@/services/ia/findPayments";
import { emit } from "@/infra/socketio";
import { join } from "@/services/text/join";
import { continueOrder } from "./continueOrder";
import { nextStep } from "./nextStep";

export const addPayments: MsgReplyFunc = async ({
  chat,
  msg,
  entities: _entities,
}) => {
  if (!chat.order?.reviewed) {
    // if (chat.context === "reviewOrder") {
    //   await saveChat(chat.id, { context: "" });
    //   await saveOrder(chat.id, { reviewed: true });
    // } else {
    return nextStep({ chat, msg, entities: _entities });
    // }
  }
  const entities = _entities as AddPaymentsEntity;
  console.log(entities);
  const resps: string[] = [];

  if (!chat.order) {
    emit("bot:noOrder", chat);
    return [];
  }

  const iaResponse = await findPaymentsIA(chat.order, msg);
  console.log("pagamentos via IA", iaResponse);
  const payments = iaResponse.filter(
    (x) =>
      !!x?.amount && !!x?.method && ["pix", "card", "cash"].includes(x.method),
  );

  const getMethod = (payment: any) =>
    payment.method === "pix"
      ? "via PIX"
      : payment.method === "card"
        ? "no cartão"
        : "em espécie";

  const getChange = (payment: any) =>
    payment.method === "cash" && payment.changeFor
      ? `Troco p/${payment.changeFor}`
      : "";

  if (!payments?.length) {
    return [
      {
        body: [
          "Desculpe, não entendi a forma de pagamento. Pode explicar novamente de forma mais resumida?",
        ],
      },
    ];
  }

  await saveOrder(chat.order.id, {
    payments: payments.map((payment) => {
      return {
        amount: payment.amount,
        method: payment.method,
        changeFor: payment.changeFor || null,
        status: "pending",
      } as IOrderPayment;
    }),
  });

  const paymentsText = payments
    .map((pay, i) => {
      const method = getMethod(pay);
      const e = payments.length > 1 && i + 1 === payments.length ? "e" : "";
      const amount = payments.length > 1 ? formatCurrency(pay.amount) : "";
      const change =
        pay.method === "cash" && pay.changeFor
          ? ` (troco p/${pay.changeFor})`
          : "";
      return join([e, amount, method, change], " ");
    })
    .join(", ");

  return [
    { body: [`Certo, o pagamento será ${paymentsText}`] },
    { delay: 1000, body: [] },
    ...(await continueOrder({ chat, msg })),
  ];

  entities.payments.forEach((e) => {
    const amount = `${
      e.amount === "half"
        ? "metade"
        : e.amount === "part"
          ? "uma parte"
          : e.amount === "rest"
            ? "restante"
            : e.amount === "total"
              ? "tudo"
              : formatCurrency(e.amount)
    }`;

    if (["pix", "cash", "card"].some((x) => e.method === x)) {
      resps.push(
        `${amount} ${
          e.method === "card"
            ? "no cartão"
            : e.method === "cash"
              ? "em espécie"
              : "via PIX"
        }`,
      );
    } else {
      resps.push(
        `Desculpe, não entendi o método de pagamento. Aceitamos cartão de débito/crédito, pix ou dinheiro. Qual será o método de pagmento?`,
      );
    }
  });
  saveChat(chat.id, { context: "addPayments" });
  return [
    {
      body: resps,
    },
  ];
};
