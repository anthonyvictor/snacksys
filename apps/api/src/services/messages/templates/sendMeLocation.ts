import { saveChat } from "@/services/save";
import { textStyles } from "@/services/text/styles";
import { MsgReplyFunc } from "types";

export const sendMeLocationTemplate: MsgReplyFunc = async ({ chat }) => {
  const { bold, italic } = textStyles;

  if (
    (chat.platform === "whatsapp" || process.env.NODE_ENV === "development") &&
    !chat.askLocation
  ) {
    await saveChat(chat.id, { context: "sendMeLocation", askLocation: true });

    return [
      {
        body: [
          `Se a entrega for onde você está, me manda sua ${bold("localização")} 📍🗺️`,
          " ",
          `Passo a passo:`,
          `1. Clique no ${bold("botão de anexo")} aqui em baixo 👇 ${italic(
            "(o clip ao lado da câmera 📎)",
          )}`,
          `2. Depois em ${bold(`"Localização"`)}`,
          `3. E por último em ${bold(`"Localização atual"`)}`,
          " ",
          `Se não conseguir, me manda o endereço completo ${bold("rua, bairro e pontos de referência")}`,
        ],
        mediaUrl: "https://i.ibb.co/Hf2S6pYV/passo-a-passo-localizacao.png",
      },

      // {
      //   body: [
      //     `Se não conseguir, me manda o endereço completo ${bold("rua, bairro e ponto de referência")}`,
      //   ],
      // },
    ];
  } else {
    await saveChat(chat.id, { context: "whatAddress" });
    return [
      {
        body: [
          "Preciso do seu endereço *COMPLETO* assim: 👇",
          " ",
          bold(`- Rua (⚠️ Obrigatório);`),
          italic(`Ex: "Rua Maria Antonieta", "Av. Aliomar Baleeiro"`),
          " ",
          bold(`- Bairro (⚠️ Obrigatório);`),
          italic(`Ex: "São Cristóvão", "Mussurunga", "Itapuã"`),
          " ",
          bold(`- Ponto de referência (⚠️ Obrigatório);`),
          italic(
            `Ex: "Ao lado do mercado", "Próx à farmácia", "Entrando à direita do salão de Rose"`,
          ),
          " ",
          bold(`- Número;`),
          italic(`Ex: "37", "5002b"`),
          " ",
          bold(`- Complemento;`),
          italic(
            `Ex: "Cond. Jardim das Flores", "Edf. Cidade Sol", "Bloco B", "Apart. 201"`,
          ),
          " ",
          bold(`- Cidade (Salvador / Lauro de Freitas);`),
          bold(`- CEP;`),
        ],
      },
      {
        body: [
          "Me manda *tudo em uma mensagem só*.",
          `Ex: \n\n${[
            italic(
              "- Rua Acalanto, 27, Edifício Alvorada, ap 201, São Cristóvão, perto da igreja assembleia",
            ),
            italic(
              "- Av. Aliomar Baleeiro, 5002b, Mussurunga, ao lado do mercado Mix",
            ),
            italic(
              "- Travessa 2 de Julho, s/n, Itapuã, próximo à farmácia Pague Menos",
            ),
          ].join("\n")}`,
        ],
        delay: 1500,
      },
    ];
  }
};
