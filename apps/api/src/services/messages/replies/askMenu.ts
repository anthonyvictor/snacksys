import {
  getMinProductPrice,
  IChatList,
  IMessage,
  IProductCategory,
  MessageReplyDTO,
  MsgReplyFunc,
} from "types";
import { textStyles } from "@/services/text/styles";
import { formatCurrency } from "@/services/format";
import { listToText } from "@/services/text/listToText";

import { saveChat } from "../../save";
import { getProducts } from "@/controllers/product/getProducts";
import { whatProductsTemplate } from "../templates/whatProducts";

export const askMenu: MsgReplyFunc = async ({ chat, msg, entities }) => {
  const products = await getProducts({ onlyActive: true });
  const categories: IProductCategory[] = [];

  products.forEach((p) => {
    const found = categories.findIndex((x) => x.id === p.category.id);

    if (found > -1) {
      categories[found].products.push(p);
    } else {
      categories.push({ ...p.category, products: [{ ...p }] });
    }
  });

  const { bold, italic, code } = textStyles;

  const lists: IChatList[] = categories.map((category) => {
    return {
      title: category.name,
      description: category.description,
      items: category.products.map((prod) => {
        const minPrice = getMinProductPrice(prod);
        return {
          body: [
            bold(prod.name),
            italic(prod.description),
            code(formatCurrency(minPrice || 0)),
          ],
          // regex: join([prod.regex, join(prod.tags, "|")], "|"),
          value: "",
          context: "",
        };
      }),
    };
  });

  saveChat(chat.id, { menuSent: true });

  return [
    { body: ["Vou te mandar cardápio, um momento..."] },
    { body: ["*Aqui estão as opções disponíveis no momento:*"], delay: 2000 },
    ...lists.map((list) => ({ body: [listToText(list)], delay: 2000 })),
    // {
    //   body: ["Agora me fala..."],
    //   delay: 1000,
    //   delayNext: 1000,
    // },
    ...(await whatProductsTemplate({ chat, msg, entities })),
  ];
};
