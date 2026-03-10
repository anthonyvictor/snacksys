import { MsgReplyFunc } from "types";
import { receivingMethodTemplate } from "./receivingMethod";
import { paymentMethodTemplate } from "./paymentMethod";
import { whatProductsTemplate } from "./whatProducts";
import { askCustomerNameTemplate } from "./askCustomerName";
import { whatAddressTemplate } from "./whatAddress";
import { reviewOrder } from "../replies/reviewOrder";
import { textStyles } from "@/services/text/styles";

export const nextStepTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const order = chat.order;
  const { bold } = textStyles;

  console.log("chegou aqui");

  // Caso não exista o pedido ou não tenha produtos
  if (!order || !order.products?.length) {
    console.log("precisa de produtos");
    return await whatProductsTemplate({ chat, msg, entities });
  }

  // Caso não tenha o tipo (ex: delivery ou retirada)
  if (!order.type) {
    console.log("precisa do metodo de recebimento");
    return await receivingMethodTemplate({ chat, msg, entities });
  }

  // Lógica de endereço para delivery
  if (order.type === "delivery") {
    const needsAddress =
      !order.delivery?.address ||
      !chat.tempAddress?.foundAddress ||
      !chat.tempAddress?.reference;

    if (needsAddress) {
      console.log("precisa de endereço");
      return await whatAddressTemplate({ chat, msg, entities });
    }
  }

  // Caso o pedido ainda não tenha sido revisado pelo cliente
  if (!order.reviewed) {
    console.log("precisa revisar o pedido");
    return await reviewOrder({ chat, msg, entities });
  }

  // Caso não tenha métodos de pagamento definidos
  if (!order.payments?.length) {
    console.log("precisa dos pagamentos");
    return await paymentMethodTemplate({ chat, msg, entities });
  }

  // Caso ainda não tenhamos os dados do cliente (nome)
  if (!order.customer?.name || !order.customer?.phone) {
    console.log("precisa de cliente");
    return await askCustomerNameTemplate({ chat, msg, entities });
  }

  // Caso tenha passado por todas as validações acima
  console.log("Todas as validações passadas com sucesso!");
  return [
    {
      body: [
        `Pronto, ${bold("pedido anotado!")} ✅. Aguarde alguns segundos a confirmação! 😊`,
      ],
    },
  ];

  // return !order || !order.products?.length
  //   ? await whatProductsTemplate({ chat, msg, entities })
  //   : !order.type
  //     ? await receivingMethodTemplate({ chat, msg, entities })
  //     : order.type === "delivery" &&
  //         (!order.delivery?.address ||
  //           !chat.tempAddress?.foundAddress ||
  //           !chat.tempAddress.reference)
  //       ? await whatAddressTemplate({ chat, msg, entities })
  //       : !order.reviewed
  //         ? await reviewOrder({ chat, msg, entities })
  //         : !order.payments?.length
  //           ? await paymentMethodTemplate({ chat, msg, entities })
  //           : !chat.customer
  //             ? await whatNameTemplate({ chat, msg, entities })
  //             : [{ body: [`Já estamos quase finalizando seu pedido...`] }];
};
