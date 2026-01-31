import { IMessage, MessageReplyDTO, MsgReplyFunc } from "types";
import { textStyles } from "@/services/text/styles";
export const askWaitTime: MsgReplyFunc = async ({ chat }) => {
  const { bold, italic, code } = textStyles;

  return [
    {
      body: [
        "Temos 3 pedidos na fila. Hoje os pedidos estão saindo em média 40min! 🔥",
      ],
    },
  ];
};
