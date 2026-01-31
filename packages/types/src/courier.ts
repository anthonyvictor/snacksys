import { Model, Schema, model, models } from "mongoose";

export interface ICourier {
  id: string;
  name: string;
  phone: string;
  imageUrl?: string;
  active: boolean;
  isDefault: boolean;
  vehicleType: "motorcycle" | "bicycle" | "car" | "foot";
  createdAt: Date;
  updatedAt: Date;
}

export const CourierSchema = new Schema<ICourier>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    active: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false, required: true },
    vehicleType: {
      type: String,
      enum: ["motorcycle", "bicycle", "car", "foot"],
    },
  },
  {
    timestamps: true,
  }
);

export const CourierModel =
  (models.Courier as Model<ICourier>) ||
  model<ICourier>("Courier", CourierSchema);
