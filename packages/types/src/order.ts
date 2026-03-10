import { model, Model, models, Schema } from "mongoose";
import { IProduct } from "./product";
import { ICustomer } from "./customer";
import {
  AddressSchema,
  FinalAddressSchema,
  IAddress,
  IFinalAddress,
} from "./address";
import { ICourier } from "./courier";

export interface IOrder {
  id: string;
  customer: ICustomer | null;
  products: IOrderProduct[];
  payments: IOrderPayment[];
  type: IOrderType | null;
  delivery: IOrderDelivery | null;
  subtotal: number;
  status: IOrderStatus;
  observations: string | null;
  reviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IOrderType = "pickup" | "delivery";

export type IOrderStatus =
  | "building"
  | "queued"
  | "preparing"
  | "finished"
  | "canceled";

export interface IOrderProduct {
  id: string;
  orderId: string;
  original: IProduct;
  // observation?: string;
  price: number;
  discount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderPayment {
  id: string;
  orderId: string;
  method: IOrderPaymentMethod;
  amount: number;
  status: "paid" | "pending";
  changeFor?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDelivery {
  address: IFinalAddress;
  courier: ICourier;
  fee: number;
  discount: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IOrderPaymentMethod = "cash" | "card" | "pix";

const OrderProductSchema = new Schema<IOrderProduct>(
  {
    original: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    price: { type: Number, required: true },
    discount: { type: String, default: "" },
  },
  { timestamps: true },
);

const OrderPaymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["cash", "card", "pix"],
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending"],
      required: true,
    },
    amount: { type: Number, required: true },
    changeFor: Number,
    paidAt: Date,
  },
  { timestamps: true },
);
const OrderDeliverySchema = new Schema(
  {
    address: FinalAddressSchema,
    courier: {
      type: Schema.Types.ObjectId,
      ref: "Courier",
      required: true,
    },
    fee: { type: Number, required: true },
    discount: { type: String, default: "" },
  },
  { timestamps: true },
);

const OrderSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },

    type: { type: String, enum: ["pickup", "delivery"] },
    products: { type: [OrderProductSchema], default: [] },
    payments: { type: [OrderPaymentSchema], default: [] },
    delivery: { type: OrderDeliverySchema, default: null },

    // discount: { type: String, default: '' },
    reviewed: { type: Boolean, default: false },

    observations: { type: String },

    status: {
      type: String,
      enum: ["building", "queued", "preparing", "finished", "canceled"],
      required: true,
    },
  },
  { timestamps: true },
);

export const OrderModel =
  (models.Order as Model<IOrder>) || model<IOrder>("Order", OrderSchema);
