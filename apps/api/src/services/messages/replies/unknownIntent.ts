import { emit } from "@/infra/socketio";
import { IMessage, MessageReplyDTO, MsgReplyFunc } from "types";

export const unknownIntent: MsgReplyFunc = async ({ chat, msg }) => {
  emit("bot:unknownIntent", { chat, msg });
  return [
    // {
    //   body: [`Desculpe, não entendi sua mensagem.`],
    // },
  ];
};
