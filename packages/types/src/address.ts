import { Model, Schema, model, models } from "mongoose";

export interface IFinalAddress {
  original: IAddress;
  reference: string;
  complement?: string;
  number?: string;
}

export interface IAddressCommunity {
  name: string;
  street: string;
  neighborhood: string;
  city: string;
  zipCode?: string;
}
export interface IAddress {
  id: string;
  street: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  state: string;
  distanceInMetters: number;
  timeInSeconds: number;
  fee: number;
  lat: number;
  lon: number;
  timesSelected: number;
}

export interface IBuildingAddress {
  street: string | null;
  reference: string | null;
  complement: string | null;
  number: string | null;
  foundAddress: IAddress | null;
  allMessages: string;
  neighborhood: string | null;
  zipCode: string | null;
  city: string | null;
  state: string | null;
  confirmed: boolean;

  distanceInMetters?: number;
  timeInSeconds?: number;
  lat?: number;
  lon?: number;
}

export interface INeighborhood {
  id: string;
  name: string;
  fee: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const NeighborhoodSchema = new Schema<INeighborhood>(
  {
    name: { type: String, required: true },
    fee: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const AddressCommunitySchema = new Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  neighborhood: { type: String, required: true },
  city: { type: String, required: true },
  zipCode: { type: String },
});

export const AddressSchema = new Schema(
  {
    street: { type: String, required: true },
    zipCode: { type: String, required: true },
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    distanceInMetters: { type: Number, required: true },
    timeInSeconds: { type: Number, required: true },
    timesSelected: { type: Number, default: 0 },
    fee: { type: Number },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
  { timestamps: true },
);

// AddressSchema.index({ street: "text" });

export const FinalAddressSchema = new Schema(
  {
    original: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    reference: { type: String, required: true },
    complement: { type: String },
    number: { type: String },
  },
  { timestamps: true },
);

export const AddressModel =
  (models.Address as Model<IAddress>) ||
  model<IAddress>("Address", AddressSchema);

export const AddressCommunityModel =
  (models.AddressCommunity as Model<IAddressCommunity>) ||
  model<IAddressCommunity>("AddressCommunity", AddressCommunitySchema);

export const NeighborhoodModel =
  (models.Neighborhood as Model<INeighborhood>) ||
  model<INeighborhood>("Neighborhood", NeighborhoodSchema);
