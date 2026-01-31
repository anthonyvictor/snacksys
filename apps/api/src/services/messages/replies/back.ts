import { IChat, IMessage, MessageReplyDTO, MsgReplyFunc } from "types";
import { menu } from "./askMenu";

export const back: MsgReplyFunc = async ({ chat, msg, entities }) => {
  const menuResps = await menu({ chat, msg, entities });

  return [
    {
      body: ["Oops, ocorreu um erro 😐"],
    },
    {
      body: ["Retornando ao menu principal..."],
      delay: 500,
    },
    ...menuResps.map((x, i) => ({ ...x, delay: i === 0 ? 500 : x.delay })),
  ];
};
