import NodeCache from "node-cache";

export const cache = new NodeCache({
  stdTTL: 5 * 60,
  checkperiod: 1 * 60,
});

// productsCache.on("expired", async (chatId, data) => {
//   await reply(data);
// });
