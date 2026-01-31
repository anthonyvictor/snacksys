import { IChat, IMessage } from "types";
import { sleep } from "../misc";
import { emit } from "@/infra/socketio";
import { wa } from "@/infra/whatsapp";

export const ignoreMessages = async (chat: IChat, ttl = 5 * 1000) => {
  for (const msg of msgs) {
    // Await aqui garante que esta mensagem será COMPLETADA
    // antes que o loop avance para a próxima.
    if (msg.delay) await sleep(msg.delay);
    if (!msg.body.length) continue;

    switch (chat.platform) {
      case "whatsapp":
        // Assumindo que wa.sendMessage é síncrono ou retorna undefined,
        // mas se fosse assíncrono (retornando uma Promise),
        // você usaria 'await wa?.sendMessage(...)'
        wa?.sendMessage(chat.from, msg.body.join(msg.separator || "\n"));
        break;
      case "telegram":
        break;
      case "messenger":
        break;
    }

    emit("msg:sent", msg.body.join(msg.separator || "\n"));
  }
};
