const address = { path: "original", model: "Address" };
const customer = {
  path: "address",
  populate: [address],
};

const product = {
  path: "category",
};

const order = [
  {
    path: "customer",
    model: "Customer",
    populate: [customer],
  },
  {
    path: "products",
    populate: [{ path: "original", model: "Product", populate: [product] }],
  },
  {
    path: "delivery",
    populate: [
      { path: "courier", model: "Courier" },
      { path: "address", populate: [{ path: "original", model: "Address" }] },
    ],
  },
];

export const populates = {
  order,
  chat: [
    { path: "order", populate: order },
    { path: "customer", populate: customer },
    {
      path: "tempAddress",
      populate: [
        {
          // remova quantity, não ta servindo pra nada e pode atrapalhar
          // cada produto deve ter seu proprio preço desconto etc
          path: "foundAddress",
          model: "Address",
        },
      ],
    },
  ],
  address,
  customer,
  product,
};
