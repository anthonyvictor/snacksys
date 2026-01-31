import { MsgReplyFunc } from "types";

export const askPaymentMethods: MsgReplyFunc = async () => {
  return [
    {
      body: [
        "✅ Aceitamos os seguintes métodos de pagamento:",
        ["💳 Crédito / Débito", "💠 PIX", "💵 Dinheiro em espécie"]
          .map((x, i) => `- ${x}`)
          .join("\n"),
      ],
    },
    {
      body: [
        "❌ *NÃO* parcelamos compras, nem aceitamos tickets/voucher refeição ou alimentação, cartão Will Bank, tranferência TED ou DOC ou pagamento fiado",
      ],
      delay: 500,
    },
  ];
};
