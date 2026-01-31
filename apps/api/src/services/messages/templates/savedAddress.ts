import { formatCurrency } from "@/services/format";
import { join } from "@/services/text/join";
import { MsgReplyFunc } from "types";
import { textStyles } from "@/services/text/styles";
import { saveChat } from "@/services/save";

export const savedAddressTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const address = chat?.customer?.address;

  if (!address) return [];

  const { bold, italic } = textStyles;
  // const addressParts = `vou precisar de: ${italic(
  //   "rua, número, bairro, complemento (se houver) e ponto de referência"
  // )}`;

  await saveChat(chat.id, { context: "savedAddress", askSavedAddress: true });

  return [
    {
      body: [
        `${bold("Já temos seu endereço salvo aqui: 👇")}`,
        italic(
          join(
            [
              address.original.street,
              address.number,
              address.complement,
              address.reference,
            ],
            ", ",
          ),
        ),

        `A entrega tá custando ${bold(formatCurrency(address.original.fee))}`,

        " ",
        `É nesse endereço mesmo?`,

        // `Se for em outro endereço, ${addressParts}`,
      ],
    },
  ];
};

//(rua, número, bairro e ponto de referência)
