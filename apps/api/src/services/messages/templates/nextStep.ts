import { MsgReplyFunc } from "types";
import { receivingMethodTemplate } from "./receivingMethod";
import { paymentMethodTemplate } from "./paymentMethod";
import { whatProductsTemplate } from "./whatProducts";
import { whatNameTemplate } from "./whatName";
import { whatAddressTemplate } from "./whatAddress";
import { reviewOrder } from "../replies/reviewOrder";

export const nextStepTemplate: MsgReplyFunc = async ({
  chat,
  msg,
  entities,
}) => {
  const order = chat.order;

  console.log(order);

  return !order || !order.products?.length
    ? await whatProductsTemplate({ chat, msg, entities })
    : !order.type
      ? await receivingMethodTemplate({ chat, msg, entities })
      : order.type === "delivery" &&
          (!order.delivery?.address ||
            !chat.tempAddress?.foundAddress ||
            !chat.tempAddress.reference)
        ? await whatAddressTemplate({ chat, msg, entities })
        : !order.reviewed
          ? await reviewOrder({ chat, msg, entities })
          : !order.payments?.length
            ? await paymentMethodTemplate({ chat, msg, entities })
            : !chat.customer
              ? await whatNameTemplate({ chat, msg, entities })
              : [{ body: [`Já estamos quase finalizando seu pedido...`] }];
};
