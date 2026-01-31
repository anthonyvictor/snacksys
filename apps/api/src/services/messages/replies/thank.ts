import { IMessage, MessageReplyDTO, MsgReplyFunc } from "types";

export const thank: MsgReplyFunc = async ({}) => {
  return [
    {
      body: [`Imagina! Estamos sempre à disposição 😊`],
    },
  ];
};
