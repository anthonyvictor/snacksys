import { textStyles } from "@/services/text/styles";
import { MsgReplyFunc } from "types";

export const whatProductsTemplate: MsgReplyFunc = async () => {
  const { bold } = textStyles;
  return [
    {
      body: [
        bold(`Quais itens você vai querer? 📝`),
        `Manda tudo em uma mensagem só de forma clara, por ex: "2 pastéis de frango e uma pepsi 1L"`,
      ],
    },
    // {
    //   body: [`Se quiser, te mando o cardápio atualizado, é só me pedir! 😉`],
    //   delay: 1000,
    // },
  ];
};
