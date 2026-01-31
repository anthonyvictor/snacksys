import { IBuildingAddress } from "./address";

export interface AddProductsEntity {
  products: [
    {
      name: string;
      observations: string | null;
      quantity: number;
    }
  ];
}
export interface AddPaymentsEntity {
  payments: [
    {
      method: "card" | "cash" | "pix";
      amount: "part" | "half" | "total" | "rest" | number;
      changeFor: string | null;
    }
  ];
}
export interface InformReceivingMethodEntity {
  type: "pickup" | "delivery";
  address?: IBuildingAddress;
}

export type Entities =
  | AddProductsEntity
  | AddPaymentsEntity
  | InformReceivingMethodEntity;

export interface IntentResult {
  intent: string;
  entities?: Entities;
}
