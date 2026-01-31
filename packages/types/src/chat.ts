import { model, Model, models, Schema } from "mongoose";
import { ICustomer } from "./customer";
import { IOrder, IOrderPayment, IOrderProduct } from "./order";
import { IBuildingAddress } from "./address";

export interface IChat {
  id: string;
  from: string;
  title: string | null;
  platform: IChatPlatform;
  imageUrl: string | null;
  customer: ICustomer | null;
  order: IOrder | null;
  // messages: IMessage[];
  // products: IOrderProduct[];
  // payments: IOrderPayment[];
  isReplying: boolean;
  lostMsg: string | null;
  menuSent: boolean;
  askSavedAddress: boolean;
  askLocation: boolean;
  context: string;
  lastQuestion:
    | "qual_metodo_recebimento"
    | "qual_forma_pagamento"
    | "qual_endereco"
    | null;
  tempAddress: IBuildingAddress | null;
  status: IChatStatus;
  createdAt: Date;
  updatedAt: Date;
  customData?: { key: string; value: any };
}

export interface IChatlistItem {
  body: string[];
  value?: string;
  regex?: string;
  context?: string;
}

export interface IChatList {
  title?: string;
  description?: string;
  // max: number;
  // multi: boolean;
  items: IChatlistItem[];
  selectedItem?: IChatlistItem;
}

export type IChatPlatform = "whatsapp" | "telegram" | "messenger";
export type IChatStatus = "open" | "closed" | "paused";

export interface IMessage {
  body: string[];
  mediaUrl?: string;
  delay?: number;
  delayNext?: number;
  separator?: string;
}

// export interface IMessage {
//   id: string;
//   chatId: string;
//   from: string;
//   to: string;
//   body: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const MessageSchema = new Schema(
//   {
//     chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
//     from: { type: String, required: true },
//     to: { type: String, required: true },
//     body: { type: String, required: true },
//   },
//   { timestamps: true }
// );

const ChatListItemSchema = new Schema({
  body: [String],
  regex: { type: String },
  context: { type: String, required: true },
});

const ChatListSchema = new Schema({
  title: String,
  description: String,
  // max: Number,
  // multi: Boolean,
  items: [ChatListItemSchema],
});
const ChatSchema = new Schema<IChat>(
  {
    title: String,
    imageUrl: String,
    from: { type: String, required: true },
    platform: {
      type: String,
      enum: ["whatsapp", "telegram", "messenger"],
      required: true,
    },
    isReplying: { type: Boolean, default: false },
    lostMsg: { type: String },
    menuSent: { type: Boolean, default: false },
    askSavedAddress: { type: Boolean, default: false },
    askLocation: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["open", "closed", "paused"],
      default: "open",
      required: true,
    },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    tempAddress: {
      street: String,
      reference: String,
      complement: String,
      foundAddress: { type: Schema.Types.ObjectId, ref: "Address" },
      number: String,
      neighborhood: String,
      zipCode: String,
      city: String,
      state: String,
      fullAddress: String,
      confirmed: { type: Boolean, default: false },
    },

    context: String,
    lastQuestion: String,
    // messages: [MessageSchema],

    customData: {
      key: String,
      value: Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

export const ChatModel =
  (models.Chat as Model<IChat>) || model<IChat>("Chat", ChatSchema);
