import { MsgReplyFunc } from "types";
import { nextStepTemplate } from "../templates/nextStep";

export const nextStep: MsgReplyFunc = async (
  { chat, msg, entities },
  reloadChat,
) => {
  return nextStepTemplate({ chat, msg, entities }, reloadChat);
};
