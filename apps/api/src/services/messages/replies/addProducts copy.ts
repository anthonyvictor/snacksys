import {
  AddProductsEntity,
  IChatList,
  IMessage,
  IOrderProduct,
  IProduct,
  MessageReplyDTO,
  OrderModel,
} from "types";
import { getProducts } from "@/controllers/product/getProducts";

import { mapEntitiesToProducts } from "@/services/levenshtein";
import { arrayUnified, arrayUniqueObj } from "@/services/array";
import { saveChat } from "../../save";
import { getOrders } from "@/controllers/order/getOrders";
import { listToText } from "@/services/text/listToText";
import { menuItems } from "@/data/menu";
import { getProductsCategories } from "@/controllers/productCategory/getProductsCategories";
import { findProductsIA } from "@/services/ia/findProducts";

export const addProducts = async ({
  chat,
  msg,
  entities: _entities,
}: MessageReplyDTO): Promise<IMessage[]> => {
  const entities = _entities
    ? Array.isArray(_entities)
      ? { products: _entities }
      : (_entities as AddProductsEntity)
    : undefined;

  if (
    !entities ||
    !entities.products ||
    !entities.products?.length ||
    !entities.products?.filter((x) => !!x.name)?.length
  ) {
    return [
      { body: ["Certo, me diz quais itens você quer?"] },
      { body: ["Se quiser, te mando o cardápio. É só pedir! 😁"], delay: 1000 },
    ];
  }

  const categories = (await getProductsCategories({})).filter(
    (x) => !!x.products?.length
  );
  const products = categories.map((x) => x.products).flat();

  try {
    const foundByIA = await findProductsIA(categories, msg);

    console.log("foundByIA", foundByIA);
  } catch (err) {
    console.error(err);
  }

  const result = mapEntitiesToProducts(entities.products, products);

  // saveChat(chat?.id, "addProducts");

  const foundProducts = result
    .map((x) =>
      x.match.found
        ? { ...x.match.product, quantity: x.entity.quantity || 1 }
        : undefined
    )
    .filter((x) => !!x?.id)
    .map((x) => x!) as (IProduct & { quantity: number })[];

  console.log({ foundProducts });

  const activeProducts = foundProducts.filter((x) => x.active);

  const inactiveProducts = arrayUniqueObj(
    foundProducts.filter((x) => !x.active),
    "id"
  );

  const unknownProducts = arrayUniqueObj(
    result.filter((x) => !x.match.found).map((x) => x.entity),
    "name"
  );

  const concat: string[] = [];

  if (activeProducts.length) {
    concat.push(
      `*✅ Itens adicionados ao carrinho:*`,
      activeProducts.map((prod) => `${prod.quantity}x ${prod.name}`).join("\n")
    );

    let order = chat.order;
    const prodsToCreate = activeProducts.map((prod) => ({
      original: prod.id,
      discount: 0,
      price: prod.basePrice,
      quantity: prod.quantity,
    }));

    if (!order) {
      const _order = await OrderModel.create({
        products: prodsToCreate,
        status: "building",
      });

      order = (await getOrders({ ids: [_order._id.toString()] }))?.[0];
      await saveChat(chat.id, { order: order.id } as any);
    } else {
      await OrderModel.findByIdAndUpdate(order.id, {
        $push: {
          products: prodsToCreate,
        },
      });
    }
  }

  if (inactiveProducts.length) {
    concat.push(
      `*❌ Itens indisponíveis:*`,
      inactiveProducts.map((prod) => `${prod.name}`).join("\n")
    );
  }

  // if (unknownProducts.length) {
  //   concat.push(
  //     `*❓ Não encontramos esses itens:*`,
  //     unknownProducts.map((prod) => `${prod.name}`).join("\n")
  //   );
  // }

  const list: IChatList = {
    items: [],
  };
  if (
    activeProducts.length &&
    !inactiveProducts.length &&
    !unknownProducts.length
  ) {
    list.items.push(menuItems.moreProds);
    list.items.push(menuItems.cart);
    list.items.push(menuItems.next);
  } else if (activeProducts.length) {
    list.items.push(menuItems.menu);
    list.items.push(menuItems.cart);
    list.items.push(menuItems.next);
  } else {
    concat.push(`Não encontrei os itens que você pediu.`);
  }

  saveChat(chat.id, { context: "addProducts" });
  return [
    {
      body: [concat.join("\n\n")],
    },
    {
      body: [listToText(list)],
      delay: 1000,
    },
  ];
};
