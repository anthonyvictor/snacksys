import { IOrder } from "types";

export const getOrderValues = (order: IOrder) => {
  const productsPrice = order.products.reduce(
    (sum, p) => sum + eval(`${p.price} ${p.discount}`),
    0,
  );
  const feePrice = order.type === "delivery" ? order.delivery?.fee || 0 : 0;
  const totalPrice = productsPrice + feePrice;

  const totalDiscount = 0;

  return { productsPrice, feePrice, totalPrice, totalDiscount };
};
