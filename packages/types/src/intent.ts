import { IBuildingAddress } from "./address";

export interface AddProductsEntity {
  products: [
    {
      name: string;
      observations: string | null;
      quantity: number;
    },
  ];
}
export interface AddPaymentsEntity {
  payments: [
    {
      method: "card" | "cash" | "pix";
      amount: "part" | "half" | "total" | "rest" | number;
      changeFor: string | null;
    },
  ];
}
export interface AskDeliveryEntity {
  type: "pickup" | "delivery";
  address?: IBuildingAddress;
}
export interface InformNameEntity {
  fullName: string;
  // nickName?: string;
  phoneNumber?: string;
}

export type Entities =
  | AddProductsEntity
  | AddPaymentsEntity
  | InformNameEntity
  | AskDeliveryEntity;

export interface IntentResult {
  intent: string;
  entities?: Entities;
}
