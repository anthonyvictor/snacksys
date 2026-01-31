import { Model, Schema, Types, model, models } from "mongoose";
import { FinalAddressSchema, IFinalAddress } from "./address";

export interface ICustomer {
  id: string;
  name: string;
  tags: string[];
  imageUrl?: string;
  phone: string;
  address: IFinalAddress;
  customData?: { key: string; value: any };
  otherContacts?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    tags: { type: [String], default: [] },
    imageUrl: { type: String },
    phone: { type: String, required: true },
    address: FinalAddressSchema,
    customData: {
      key: String,
      value: Schema.Types.Mixed,
    },

    otherContacts: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const CustomerModel =
  (models.Customer as Model<ICustomer>) ||
  model<ICustomer>("Customer", CustomerSchema);
