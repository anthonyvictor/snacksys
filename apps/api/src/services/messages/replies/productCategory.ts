import { IChatList, IMessage, MessageReplyDTO, MsgReplyFunc } from "types";
import { saveChat } from "../../save";
import { getProducts } from "@/controllers/product/getProducts";
import { textStyles } from "@/services/text/styles";
import { formatCurrency } from "@/services/format";
import { listToText } from "@/services/text/listToText";
import { join } from "@/services/text/join";
import { getProductsCategories } from "@/controllers/productCategory/getProductsCategories";
import { back } from "./back";

export const productCategory: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const categories = await getProductsCategories({ onlyActive: true });
  const category = categories.find(
    (x) => x.id === (chat.context as IChatList).selectedItem?.value!
  );
  console.log("category", category);
  console.log("chat.context", chat.context);
  if (!category || !category.products.some((x) => x.active)) {
    return await back({ chat, msg, entities });
  }
  const products = await getProducts({ onlyActive: true });

  const productsInCategory = products.filter(
    (x) => x.category.id === category.id
  );

  console.log("productsInCategory", productsInCategory);
  if (!productsInCategory?.length) {
    return await back({ chat, msg, entities });
  }

  const { bold, italic, code } = textStyles;

  // const categories = group(products, "category").sort(
  //   (a, b) => b.items.length - a.items.length
  // );

  const list: IChatList = {
    title: category.name,
    description: "Selecione um dos itens abaixo: (Um item por vez)",
    items: productsInCategory.map((product) => ({
      body: [
        bold(product.name),
        italic(product.description),
        code(`Preço: ${formatCurrency(product.price)}`),
      ],
      context: "confirmProduct",
      value: product.id,
      regex: join([product.regex, join(product.tags, "|")], "|"),
    })),
  };

  saveChat(chat?.id, list);

  return [
    {
      body: [
        listToText(list),
        join(
          [],
          "\nSelecione uma opção por vez, depois você poderá adicionar outros"
        ),
      ],
    },
  ];
};
