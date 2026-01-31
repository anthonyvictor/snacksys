import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";
import NodeCache from "node-cache";
import {
  ChatModel,
  ff,
  ffid,
  IChat,
  IMessage,
  IntentResult,
  populates,
  ReceivedMessageDTO,
} from "types";
import { getConfigs } from "../configs/getConfigs";
import { getChats } from "../chat/getChats";
import { getCustomers } from "../customer/getCustomers";
import * as replies from "@/services/messages/replies";
// import * as intents from "@/services/messages/intents";
import { send } from "@/services/messages/send";
import { unknownIntent } from "@/services/messages/replies/unknownIntent";
import { detectIntentIA } from "@/services/ia/detectIntent";
import { detectIntent } from "@/services/messages/detectIntent";
import { saveChat } from "@/services/save";
import { detectIntentIA2 } from "@/services/ia/detectIntent2";

const cache = new NodeCache({ stdTTL: 5, checkperiod: 1 }); // segundos de espera entre msgs

cache.on("expired", async (from, data) => {
  await reply(data);
});

export const handler_receivedMessage = async (req: Request, res: Response) => {
  try {
    const data = await reply(req.body);
    // const data = await receivedMessage(req.body);
    res.status(200).json(data);
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const receivedMessage = async (data: ReceivedMessageDTO) => {
  try {
    const lastMsg = cache.get<ReceivedMessageDTO>(data.from);

    if (!lastMsg) {
      cache.set<ReceivedMessageDTO>(data.from, data);
    } else {
      cache.set<ReceivedMessageDTO>(data.from, {
        ...data,
        body: lastMsg.body + " " + data.body,
      });
    }
  } catch (err) {
    console.error(err);
    return ["Ops, ocorreu um erro aqui!"];
  }
};

export const reply = async (data: ReceivedMessageDTO) => {
  let chat: IChat | null | undefined;
  try {
    if (!data.body || !data.body.replace(/[^a-zA-Z0-9]/g, "").length) return;

    const configs = await getConfigs();
    const cfgChatbot = configs.find((x) => x.key === "chatbot")?.value!;

    if (!cfgChatbot) throw new Error("Configurações do chatbot inválidas!");

    // const { txt, txtOrig } = sanitizar(txtRaw, cfgChatbot.msgMax);

    let msg = data.body;

    let res: (IMessage | undefined)[] = [];

    chat = (
      await getChats({
        from: [data.from],
        status: ["open"],
        platforms: [data.platform],
      })
    )?.[0];

    if (!chat) {
      const customer = (
        await getCustomers({
          phone: [data.from],
        })
      )?.[0];

      chat = await ChatModel.create({
        customer: customer?.id,
        ...data,
      });

      if (!chat) throw new Error("Oops, chat não criado");

      chat = (await getChats({ ids: [chat.id] }))[0];

      res = await replies.greeting({ chat, msg });
    } else {
      console.log("IS REPLYING:", chat.isReplying);
      if (chat.isReplying) {
        await saveChat(chat.id, {
          lostMsg: chat.lostMsg ? chat.lostMsg + " " + msg : msg,
        });
        return;
      }
      msg = chat.lostMsg ? chat.lostMsg + " " + msg : msg;

      await saveChat(chat.id, { isReplying: true, lostMsg: null });

      let intentResult: IntentResult | undefined;

      intentResult = await detectIntent(msg, chat);
      if (!intentResult) {
        try {
          // intentResult = await detectIntentIA(msg, chat);
          intentResult = await detectIntentIA2(msg, chat);
          if (!intentResult?.intent) throw new Error();
        } catch (err) {
          console.error(
            "Intent não encontrada pela IA",
            { intentResult },
            "\n\n",
            err,
          );
          await saveChat(chat?.id, { isReplying: false });

          send(chat, [
            {
              body: [
                "Desculpe, não entendi, pode falar novamente? De forma mais resumida",
              ],
            },
          ]);

          return;
        }
      }

      console.log(
        JSON.stringify(
          { intent: intentResult.intent, entities: intentResult.entities },
          null,
          2,
        ),
      );

      const reply = Object.entries(replies).find(
        ([_intent]) =>
          intentResult.intent.toLowerCase() === _intent.toLowerCase(),
      );
      if (!reply) {
        res = await unknownIntent({
          chat,
          msg,
          entities: intentResult.entities,
        });
      } else {
        res = await reply[1]({ chat, msg, entities: intentResult.entities });
      }
    }

    await send(chat, res);
    await saveChat(chat.id, { isReplying: false });
    return res;
  } catch (err) {
    console.error(err);
    try {
      await saveChat(chat?.id, { isReplying: false });
    } catch (e) {}
    return ["Ops, ocorreu um erro aqui!"];
  }
};
