import { Model, Schema, Types, model, models } from "mongoose";
import { FinalAddressSchema, IFinalAddress } from "./address";

export interface IBuildingCustomer {
  // id: string;
  name: string | null;
  tags: string[] | null;
  imageUrl: string | null;
  phone: string | null;
  foundCustomer: ICustomer | null;
  // address: IFinalAddress|null;
  // customData?: { key: string; value: any };
  // otherContacts?: string[];
  // createdAt: Date;
  // updatedAt: Date;
}
export interface ICustomer {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  imageUrl: string | null;
  phone: string;
  address: IFinalAddress | null;
  customData?: { key: string; value: any };
  otherContacts?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    description: { type: String },
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
  },
);

export const CustomerModel =
  (models.Customer as Model<ICustomer>) ||
  model<ICustomer>("Customer", CustomerSchema);
