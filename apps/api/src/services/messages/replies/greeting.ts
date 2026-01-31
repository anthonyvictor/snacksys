import { IChatList, IMessage, MessageReplyDTO, MsgReplyFunc } from "types";
import { saveChat } from "../../save";
import { listToText } from "@/services/text/listToText";
import { textStyles } from "@/services/text/styles";

export const greeting: MsgReplyFunc = async ({ chat }) => {
  const h = new Date().getHours();
  const morning =
    h >= 18 || h < 5 ? "boa noite" : h >= 12 ? "boa tarde" : "bom dia";

  const { bold, italic } = textStyles;

  const list: IChatList = {
    items: [
      {
        body: [
          bold("📋 Cardápio"),
          italic(
            "Acesse nosso cardápio para ver quais produtos temos disponíveis"
          ),
        ],

        context: "",
      },
      {
        body: [
          bold("⌛ Estimativa de tempo"),
          italic("Veja quantos pedidos tem na fila, e o tempo de espera"),
        ],

        context: "",
      },
      {
        body: [
          bold("🕓 Horário de funcionamento"),
          italic("Confira o horário de funcionamento da loja"),
        ],
        context: "",
      },
      {
        body: [
          bold("📱 Mídias sociais"),
          italic("Segue a gente para ficar por dentro das promoções!"),
        ],
        context: "",
      },
      {
        body: ["🔁 Repetir o último pedido"],
      },
      {
        body: ["💬 Falar com um atendente"],
      },
    ],
  };

  // if (chat) saveContext(chat.id, list);
  const instagram = "@nosso_instagram";
  return [
    {
      body: [
        `Olá, ${morning}! Seja bem vindo(a) 😊`,
        `Sou seu atendente virtual 🤖, vamos iniciar seu pedido!`,
      ],
    },
    {
      delay: 1000,
      body: [listToText(list)],
    },
  ];
};
