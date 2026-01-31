import { IOrder } from "types";

export const getTotal = (order: IOrder) => {
  const productsPrice = order.products.reduce(
    (acc, curr) => acc + (curr.price * curr.quantity - curr.discount),
    0
  );
  const deliveryFee =
    order.type === "pickup"
      ? 0
      : (order.delivery?.fee ?? 0) - (order.delivery?.discount ?? 0);

  const total = productsPrice + deliveryFee;

  return { total, productsPrice, deliveryFee };
};
