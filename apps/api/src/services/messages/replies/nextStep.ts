import { MsgReplyFunc } from "types";
import { nextStepTemplate } from "../templates/nextStep";

export const nextStep: MsgReplyFunc = async ({ chat, msg, entities }) => {
  return nextStepTemplate({ chat, msg, entities });
};
