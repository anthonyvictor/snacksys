import { IOrder } from "types";

export const getTotal = (order: IOrder) => {
  const productsPrice = order.products.reduce(
    (acc, curr) => acc + eval(`${curr.price} ${curr.discount}`),
    0,
  );
  const deliveryFee =
    order.type === "pickup"
      ? 0
      : eval(`${order.delivery?.fee ?? 0} ${order.delivery?.discount ?? ""}`);

  const total = productsPrice + deliveryFee;

  return { total, productsPrice, deliveryFee };
};
