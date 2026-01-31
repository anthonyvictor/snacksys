import { MsgReplyFunc } from "types";

export const whatNameTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  return [
    {
      body: [
        `Me informa *seu nome e sobrenome* por gentileza 📝`,
        chat.platform !== "whatsapp"
          ? "Me fala também seu número de telefone, de preferência Whatsapp"
          : "",
      ],
    },
  ];
};
