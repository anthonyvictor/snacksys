import { textStyles } from "@/services/text/styles";
import { MsgReplyFunc } from "types";

export const paymentMethodTemplate: MsgReplyFunc = async ({ chat }) => {
  const { bold } = textStyles;
  return [
    {
      body: [
        // `Ficou ${}`,
        `Qual vai ser a ${bold("forma de pagamento?")} 📝`,
        // `Aceitamos *PIX 💠*, *Dinheiro 💵*, ou *Crédito/Débito 💳*`,
      ],
    },
    // {
    //   body: [
    //     italic(
    //       "Se for usar mais de uma forma de pagamento, me fala o valor de cada."
    //     ),
    //   ],
    //   delay: 800,
    // },
  ];
};
