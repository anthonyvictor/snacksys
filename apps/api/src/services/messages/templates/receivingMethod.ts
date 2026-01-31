import { formatCurrency } from "@/services/format";
import { join } from "@/services/text/join";
import { IMessage, MsgReplyFunc } from "types";
import { sendMeLocationTemplate } from "./sendMeLocation";
import { textStyles } from "@/services/text/styles";
import { savedAddressTemplate } from "./savedAddress";

export const receivingMethodTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const { bold, italic } = textStyles;

  return [
    {
      body: [`Você ${bold("vem buscar")}, ou é pra ${bold("entrega?")} 📝`],
    },
  ];

  const address = chat?.customer?.address;
  const addressParts = `vou precisar de: ${italic(
    "rua, número, bairro, complemento (se houver) e ponto de referência"
  )}`;

  const res: (IMessage | undefined)[] = [
    {
      body: [
        `Você ${bold("vem buscar")} o pedido, ou é pra ${bold("entrega?")} 📝`,
      ],
    },
  ];

  console.log("address =>>>>>>>>", address);
  if (address) {
    res.push(...(await savedAddressTemplate({ chat, msg, entities })));
  } else {
    res.push({
      body: [`${bold("Se for pra entrega")}, ${addressParts}`],

      delay: 1500,
    });
  }

  res.push(...(await sendMeLocationTemplate({ chat, msg, entities })));

  return res;
};

//(rua, número, bairro e ponto de referência)
