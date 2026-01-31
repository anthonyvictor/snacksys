import { IOrder } from "types";

export const getOrderValues = (order: IOrder) => {
  const productsPrice = order.products.reduce(
    (sum, p) => sum + p.quantity * p.original.basePrice,
    0
  );
  const feePrice = order.type === "delivery" ? order.delivery?.fee || 0 : 0;
  const totalPrice = productsPrice + feePrice;

  const totalDiscount = 0;

  return { productsPrice, feePrice, totalPrice, totalDiscount };
};
