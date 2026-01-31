import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";
import NodeCache from "node-cache";
import {
  ChatModel,
  ff,
  ffid,
  IChat,
  IMessage,
  populates,
  ReceivedMessageDTO,
} from "types";
import { getConfigs } from "../configs/getConfigs";
import { getChats } from "../chat/getChats";
import { getCustomers } from "../customer/getCustomers";
import * as replies from "@/services/messages/replies";
import * as intents from "@/services/messages/intents";
import { normalize } from "@/services/format";
import { join } from "@/services/text/join";
import { send } from "@/services/messages/send";
import { detectIntent } from "@/infra/groq";

const cache = new NodeCache({ stdTTL: 3, checkperiod: 1 }); // segundos de espera entre msgs

cache.on("expired", async (chatId, data) => {
  await reply(data);
});

export const handler_receivedMessage = async (req: Request, res: Response) => {
  try {
    const data = await reply(req.body);
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
  try {
    if (!data.body) return;

    const configs = await getConfigs();
    const cfgChatbot = configs.find((x) => x.key === "chatbot")?.value!;

    if (!cfgChatbot) throw new Error("Configurações do chatbot inválidas!");

    // const { txt, txtOrig } = sanitizar(txtRaw, cfgChatbot.msgMax);

    let chat: IChat | null | undefined = (
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
    }

    let res: IMessage[] = [];

    const intent = await detectIntent(data.body);
    console.log(JSON.stringify(intent));

    return [{ body: ["ai carai"] }] as IMessage[];

    if (chat?.context) {
      if (typeof chat.context === "string") {
        const e = Object.entries(replies).find((x) => x[0] === chat?.context);

        if (e) {
          res = await e[1](chat);
        }
      } else {
        const items = chat.context.items;
        const normalized = normalize(data.body);

        const matchedItem = items.find((item, i) => {
          const numbers = normalized.replace(/[^0-9 ]/g, "").split(" ");
          const body = normalize(join(item.body, " "));

          if (numbers.length && Number(numbers[0]) === i + 1) {
            return true;
          } else if (normalized.replace(" ", "").length > 2) {
            const contains = body.includes(normalized);
            console.log("contains", { body, normalized, contains });
            return contains;
          } else if (item.regex) {
            const regex = new RegExp(item.regex, "i");
            return regex.test(normalized);
          }
        });

        if (!matchedItem) {
          res = await replies.unknownItem(chat);
        } else {
          const e = Object.entries(replies).find(
            (x) => x[0] === matchedItem.context,
          );
          if (e) {
            (await ChatModel.findByIdAndUpdate(
              chat.id,
              {
                $set: {
                  "context.selectedItem": matchedItem,
                },
              },
              { new: true },
            ))!;

            chat = (await ffid({
              m: ChatModel,
              id: chat.id,
              p: populates.chat,
            }))!;

            res = await e[1](chat);
          } else {
            throw new Error(
              `Função de resposta não encontrada para ${matchedItem.context}`,
            );
          }
        }
      }
    } else if (await intents.hi(data.body, chat)) {
      res = await replies.hi(chat);
    }

    send(chat, res);
    return res;
  } catch (err) {
    console.error(err);
    return ["Ops, ocorreu um erro aqui!"];
  }
};
