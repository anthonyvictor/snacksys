import { MsgReplyFunc } from "types";
import { saveChat } from "../../save";
import { join } from "@/services/text/join";
import { receivingMethodTemplate } from "../templates/receivingMethod";
import { nextStepTemplate } from "../templates/nextStep";

export const observations: MsgReplyFunc = async ({ chat, msg, entities }) => {
  const order = chat.order;
  if (!order || !order.products.length) {
    return [
      {
        body: [`Vamos começar. Me diz aí quais produtos você vai querer! 😊`],
      },
    ];
  }
  await saveChat(chat.id, {
    observations: join([order.observations, msg]),
  } as any);

  return [
    {
      body: [
        `Adicionei como observação do seu pedido!`,
        `Agora me diz uma coisinha:`,
      ],
      delayNext: 1000,
    },
    ...(await nextStepTemplate({ chat, msg, entities })),
  ];
};
