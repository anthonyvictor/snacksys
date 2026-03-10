import {
  group,
  IChat,
  IChatList,
  IMessage,
  MessageReplyDTO,
  MsgReplyFunc,
} from "types";
import { saveChat } from "../../save";
import { getProducts } from "@/controllers/product/getProducts";
import { textStyles } from "@/services/text/styles";
import { formatCurrency } from "@/services/format";
import { listToText } from "@/services/text/listToText";
import { join } from "@/services/text/join";
import { getProductsCategories } from "@/controllers/productCategory/getProductsCategories";
import { back } from "./back";
import { nextStep } from "./nextStep";

export const reviewOrder: MsgReplyFunc = async ({ chat, msg, entities }) => {
  // const productId = (chat.context as IChatList).selectedItem?.value!;
  // const product = (await getProducts({ ids: [productId] }))?.[0]!;

  // if (!product || !product.active) {
  //   return await back({ chat, msg, entities });
  // }

  const { bold, italic, sliced } = textStyles;
  const order = chat.order!;

  console.log(
    "order.products?.length",
    order.products?.length,
    "\norder.type",
    order.type,
    "\norder.delivery?.address",
    order.delivery?.address,
    "\norder.delivery?.address?.reference",
    order.delivery?.address?.reference,
  );
  if (
    !order ||
    !order.products?.length ||
    !order.type ||
    (order.type === "delivery" &&
      (!order.delivery?.address.original ||
        !order.delivery?.address?.reference))
  )
    return nextStep({ chat, msg, entities });

  // const list: IChatList = {
  //   title: category.name,
  //   description: "Selecione um dos itens abaixo: (Um item por vez)",
  //   items: productsInCategory.map((product) => ({
  //     body: [
  //       bold(product.name),
  //       italic(product.description),
  //       code(`Preço: ${formatReal(product.price)}`),
  //     ],
  //     context: "confirmProduct",
  //     value: product.id,
  //     regex: join([product.regex, join(product.tags, "|")], "|"),
  //   })),
  // };
  console.log(order.products.map((p) => p.original));

  const products = join(
    group(
      (order.products || []).map((x) => ({ ...x, originalId: x.original.id })),
      ["originalId", "price", "discount"],
    ).map((prod) => {
      return `- ${join(
        [
          bold(join([`${prod.length}x`, prod[0].original.name], ", ")),
          // join([prod.description, prod.observation], ", "),
          italic(
            (() => {
              const price = prod[0].price;
              const discount = prod[0].discount;
              const quantity = prod.length;
              return discount
                ? `${sliced(formatCurrency(eval(`${price} ${discount}`) * quantity))} ${bold(formatCurrency(price * quantity))}`
                : `${formatCurrency(price * quantity)}`;
            })(),
          ),
        ],
        "\n",
      )}`;
    }),
    "\n",
  );

  const delivery = order.delivery!;

  const receivingMethod =
    order.type === "delivery"
      ? join(
          [
            `Pedido ${bold("para entrega 🛵")}`,
            `Endereço: ${italic(
              join(
                [
                  delivery.address.original.street,
                  delivery.address.number,
                  delivery.address.original.neighborhood,
                  delivery.address.complement,
                  delivery.address.reference,
                ],
                ", ",
              ),
            )}`,
          ],
          "\n",
        )
      : "🏪 Pedido pra retirar na loja";

  const productsValue = order.products.reduce(
    (sum, p) => sum + eval(`${p.price} ${p.discount}`),
    0,
  );
  // const productsDisWcount = order.products.reduce((sum, p) => sum + eval(p.price, p.discount), 0)
  const feeValue = order.type === "delivery" ? delivery.fee || 0 : 0;

  const values = join(
    [
      italic(`Itens: ${formatCurrency(productsValue)}`),
      order.type === "delivery"
        ? italic(`Entrega: ${formatCurrency(feeValue)}`)
        : "",

      bold(`Total: ${formatCurrency(productsValue + feeValue)}`),
    ],
    "\n",
  );

  saveChat(chat?.id, { context: "reviewOrder" });

  return [
    {
      body: [
        "Vamos revisar o pedido...",
        "-------------",
        products,
        "-------------",
        receivingMethod,
        "-------------",
        values,
      ],
    },
    {
      body: [bold("Confirma que está tudo certo?")],
      delay: 1000,
    },
  ];
};
