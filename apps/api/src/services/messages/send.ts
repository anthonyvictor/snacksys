import { IChat, IMessage } from "types";
import { sleep } from "../misc";
import { emit } from "@/infra/socketio";
import { wa } from "@/infra/whatsapp";
import { saveChat } from "../save";

export const send = async (chat: IChat, msgs: (IMessage | undefined)[]) => {
  for (const msg of msgs.filter(Boolean).map((x) => x!)) {
    // Await aqui garante que esta mensagem será COMPLETADA
    // antes que o loop avance para a próxima.
    if (msg.delay) await sleep(msg.delay);
    const body = msg.body.filter((x) => x.length);
    if (!body.length) continue;

    switch (chat.platform) {
      case "whatsapp":
        // Assumindo que wa.sendMessage é síncrono ou retorna undefined,
        // mas se fosse assíncrono (retornando uma Promise),
        // você usaria 'await wa?.sendMessage(...)'
        wa?.sendMessage(chat.from, body.join(msg.separator || "\n"));
        break;
      case "telegram":
        break;
      case "messenger":
        break;
    }

    emit("msg:sent", body.join(msg.separator || "\n"));
  }
};
