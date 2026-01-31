import {
  ChatModel,
  CustomerModel,
  IChat,
  ICustomer,
  IOrder,
  OrderModel,
  serializeMongo,
} from "types";

export const saveChat = async (
  chatId: string | undefined,
  q: Partial<IChat>,
  returnUpdated = false,
) => {
  if (!chatId) return;
  try {
    const raw = await ChatModel.findByIdAndUpdate(
      chatId,
      {
        $set: q,
      },
      { new: true },
    );
    if (!returnUpdated) return;

    if (!raw) return null;

    // Apenas serializa o que já veio do update
    return serializeMongo(raw) as IChat;
  } catch (err) {
    console.error(err);
  }
};
export const saveOrder = async (
  orderId: string | undefined,
  q: Partial<IOrder>,
  returnUpdated = false,
) => {
  if (!orderId) return;
  try {
    const raw = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        $set: q,
      },
      { new: true },
    );

    if (!returnUpdated) return;

    if (!raw) return null;

    // Apenas serializa o que já veio do update
    return serializeMongo(raw) as IChat;
  } catch (err) {
    console.error(err);
  }
};
export const saveCustomer = async (
  customerId: string | undefined,
  q: Partial<ICustomer>,
  returnUpdated = false,
) => {
  if (!customerId) return;
  try {
    const raw = await CustomerModel.findByIdAndUpdate(
      customerId,
      {
        $set: q,
      },
      { new: true },
    );

    if (!returnUpdated) return;

    if (!raw) return null;

    // Apenas serializa o que já veio do update
    return serializeMongo(raw) as ICustomer;
  } catch (err) {
    console.error(err);
  }
};
