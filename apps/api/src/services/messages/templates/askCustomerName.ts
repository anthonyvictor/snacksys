import { saveChat } from "@/services/save";
import { textStyles } from "@/services/text/styles";
import { MsgReplyFunc } from "types";

export const askCustomerNameTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const { bold } = textStyles;
  await saveChat(chat.id, { context: "askCustomerName" });
  return [
    {
      body: [
        `Agora preciso do seu ${bold("nome e sobrenome")} pra cadastrar aqui 📝`,
        chat.platform !== "whatsapp"
          ? `Me manda também seu ${bold("Whatsapp")}, ou um telefone pra ligar`
          : "",
      ],
    },
  ];
};
// fazer o detectIntent detectar o intent customerInfo e criar o serviço para salvar o customer no chat
