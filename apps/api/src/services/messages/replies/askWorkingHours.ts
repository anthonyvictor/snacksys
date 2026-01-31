import { IMessage, MessageReplyDTO, MsgReplyFunc } from "types";
import { textStyles } from "@/services/text/styles";

export const askWorkingHours: MsgReplyFunc = async ({ chat }) => {
  const { bold, italic, code } = textStyles;

  return [
    {
      body: ["Funcionamos de terça à domingo, das 18h às 23:30"],
    },
  ];
};
