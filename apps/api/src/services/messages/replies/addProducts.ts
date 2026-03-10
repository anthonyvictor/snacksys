import {
  capitalize,
  CustomerModel,
  getOrderValues,
  ICustomer,
  IMessage,
  IProduct,
  IProductCategory,
  MessageReplyDTO,
  MsgReplyFunc,
  OrderModel,
} from "types";
import { getProducts } from "@/controllers/product/getProducts";
import { saveChat } from "../../save";
import { getOrders } from "@/controllers/order/getOrders";
import { ExtractedProduct, findProductsIA } from "@/services/ia/findProducts";
import { formatCurrency } from "@/services/format";
import { textStyles } from "@/services/text/styles";
import { findProductCandidates } from "@/services/product/filter";
import { send } from "../send";
import { whatProductsTemplate } from "../templates/whatProducts";
import { getCustomers } from "@/controllers/customer/getCustomers";

export const addProducts: MsgReplyFunc = async ({ chat, msg, entities }) => {
  const { code, italic, bold } = textStyles;

  const products = await getProducts({});

  // console.log(
  //   products.map(({ name, description, tags }) => ({
  //     name,
  //     description,
  //     tags,
  //   })),
  // );

  let preCandidates = findProductCandidates(products, msg).slice(0, 15);

  if (!preCandidates.length) {
    return [
      {
        body: [
          `Por gentileza, especifique os produtos desejados, por ex: 👇👇`,
          `${italic("Quero 2 pastéis de frango, e uma pepsi 1L")}`,
        ],
      },
    ];
  }

  console.log(
    "pré candidatos:",

    preCandidates.map(
      ({ name, score, matchedWords }) =>
        `${score} ${name
          .toUpperCase()
          .replace(/[^A-Z0-9 ]/g, "")
          .replace(/PASTEL( DE )?/g, "P.")} (${matchedWords.join(", ")})`,
    ),
  );

  const res: IMessage[] = [];

  await send(chat, [{ body: ["Um momentinho..."] }]);

  const foundByIA: ExtractedProduct[] = (
    await findProductsIA(preCandidates, msg)
  ).map((found) => ({
    ...found,
    candidates: (found.candidates ?? [])
      .map((x) => ({ ...x, original: products.find((y) => y.id === x.id) }))
      .filter((x) => !!x.original),
  }));
  // const foundByIA = await findProductsIA(products, msg);

  // 4) SALES para DESEMPATE:
  //  - Diferença >= 100 → escolha apenas o mais vendido. (Em caso de ambiguidade muito rasa, ignore.
  //  Ex: "quero um Refrigerante" → não retorne um refrigerante específico)
  //  - Diferença < 100 → retorne ambos com accuracy dividida.

  console.log(
    foundByIA.map((x) => {
      return {
        candidates: x.candidates.map(
          (y) => products.find((z) => z.id === y.id)?.name ?? "",
        ),
        chunk: x.chunkOfText,
        quantity: x.quantity,
      };
    }),
  );

  if (!foundByIA.length) return whatProductsTemplate({ chat, msg, entities });

  const oneCandidate: ExtractedProduct[] = [];
  const noCandidates: ExtractedProduct[] = [];
  const inactiveCandidates: ExtractedProduct[] = [];
  const multipleCandidates: ExtractedProduct[] = [];

  foundByIA.forEach((found) => {
    const candidates = found.candidates;
    // if(nao achou original){
    //   candidates.
    // }

    const onlyActive = candidates.filter((x) => x.original?.active);
    const notActive = candidates.filter((x) => !x.original?.active);
    if (!candidates.length) {
      noCandidates.push(found);
    } else if (onlyActive.length > 1) {
      const sorted = onlyActive.sort(
        (a, b) => (b.original?.sales ?? 0) - (a.original?.sales ?? 0),
      );
      const [first, second] = sorted;
      const diff = first.original!.sales - second.original!.sales;
      if (
        diff > 100 ||
        (first.original!.sales > 10 && diff > second.original!.sales * 2)
      ) {
        oneCandidate.push({ ...found, candidates: [first] });
      } else {
        multipleCandidates.push(found);
      }
    } else if (!onlyActive.length && notActive.length) {
      inactiveCandidates.push(found);
    } else {
      oneCandidate.push(found);
    }
  });

  if (oneCandidate.length) {
    let order = chat.order;
    const prodsToCreate = oneCandidate
      .map(({ candidates, quantity }) => {
        const r = {
          original: candidates[0].id,
          discount: "",
          price: candidates[0].original!.basePrice,
        };
        return Array(quantity).fill(r);
      })
      .flat();

    if (!order) {
      // vai criar um novo pedido
      let customer: ICustomer | null = null;
      if (chat.platform === "whatsapp") {
        // se for whatsapp, procura no banco cliente com esse numero
        customer = (await getCustomers({ phone: [chat.from.phoneNumber!] }))[0];
      }
      // if (!customer) {
      //   // se n encontrar, cria um novo
      //   if (chat.platform === "whatsapp") {
      //     customer = await CustomerModel.create({
      //       name: "",
      //       description: chat.from.publicName,
      //       imageUrl: chat.from.imageUrl,
      //       phone: chat.from.phoneNumber || "",
      //     });
      //      (await saveCustomer(
      //       undefined,
      //       {
      //         name: "",
      //         description: chat.from.publicName,
      //         imageUrl: chat.from.imageUrl,
      //         phone: chat.from.phoneNumber || "",
      //       },
      //       true,
      //     ))!;
      //   } else {
      //     throw new Error("Plataforma não suportada!");
      //   }
      // }
      const _order = await OrderModel.create({
        products: prodsToCreate,
        customer,
        status: "building",
      });

      order = (await getOrders({ ids: [_order._id.toString()] }))?.[0];

      await saveChat(chat.id, { order: order.id } as any);
    } else {
      await OrderModel.findByIdAndUpdate(order.id, {
        $push: {
          products: prodsToCreate,
        },
        $set: {
          reviewed: false,
        },
      });
    }

    // const { totalPrice } = getOrderValues(order);
    res.push({
      body: [
        bold(`✅ Adicionei esses itens ao pedido: 👇`),
        ...oneCandidate.map(
          ({ candidates, quantity }) =>
            `- *${quantity}x ${candidates[0].original!.name}*\n     ${code(
              formatCurrency(candidates[0].original!.basePrice * quantity),
            )}`,
        ),
        // `${bold('Total parcial:')} ${code(formatReal(totalPrice))}`,
      ],
      separator: "\n\n",
    });
  }

  if (noCandidates.length || inactiveCandidates.length) {
    res.push({
      body: [
        bold(`❌ Não estão saindo esses itens: 👇`),
        `${Array.from(
          new Set([
            ...inactiveCandidates
              .map((prod) => prod.candidates.map((x) => x.original?.name))
              .flat(),
            ...noCandidates.map((e) => capitalize(e.chunkOfText)),
          ]),
        ).join(", ")}`,
      ],
      delay: 1000,
      separator: "\n\n",
    });
  }

  if (multipleCandidates.length) {
    await saveChat(chat.id, {
      lostMsg: multipleCandidates.map((x) => x.chunkOfText).join(", "),
    });
    const ambiguous: IProduct[] = [];
    multipleCandidates.forEach((mc) => {
      mc.candidates.forEach((c) => {
        if (ambiguous.every((x) => x.id !== c.id)) {
          ambiguous.push(c.original!);
        }
      });
    });
    res.push({
      body: [
        bold(`⚠️ Quais desses vc prefere? 👇`),
        ambiguous
          .map((p) => {
            const { sliced } = textStyles;
            const f =
              !p.active || p.stock === 0
                ? (x: string) => `${sliced(x)} (indisponível)`
                : (x: string) => x;
            return f(`${p.name} - ${formatCurrency(p.basePrice)}`);
          })
          .join("\n"),
        `Peço que especifique os itens desejados.`,
      ],
      separator: "\n\n",
    });
  }

  if (inactiveCandidates.length || noCandidates.length) {
    res.push({
      body: [
        `Se quiser, te mando ${chat.menuSent ? "novamente " : ""}o ${bold(
          "cardápio atualizado",
        )}, é só me pedir!`,
      ],
      delay: 1500,
    });
  }

  if (oneCandidate.length && !multipleCandidates.length) {
    res.push({
      body: [
        `${bold("Deseja algo mais?")} Refrigerante, suco, açaí, etc)`,
        `Se quiser mudar os itens, digite ${bold('"limpar carrinho"')}`,
      ],
      delay: 1500,
    });
  }

  saveChat(chat.id, { context: "addProducts" });
  return res;
};
