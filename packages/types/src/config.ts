import { model, Model, models, Schema } from "mongoose";
import { IAddress, IFinalAddress } from "./address";

interface IConfigBase {
  createdAt: Date;
  updatedAt: Date;
}

interface IConfigStore {
  name: string;
  address: IAddress & {
    reference: string;
    complement?: string;
    number?: string;
  };
}
interface IConfigDelivery {
  maxDistanceInKm: number;
  restrictions: {
    neighborhoods: { name: string; active: boolean }[];
    streets: { nameOrZipcode: string; active: boolean }[];
  };
}
interface IConfigChatbot {
  active: boolean;
  disabledFor: string[];
}

interface IWeekDayOpen {
  open: boolean;
  from: string;
  to: string;
}

interface IConfigHours {
  week: {
    sunday: IWeekDayOpen;
    monday: IWeekDayOpen;
    tuesday: IWeekDayOpen;
    wednesday: IWeekDayOpen;
    thursday: IWeekDayOpen;
    friday: IWeekDayOpen;
    saturday: IWeekDayOpen;
  };
  exceptions: { date: string; open: boolean }[];
  temporary: { open: boolean; expiresIn: Date };
}

type IConfig = IConfigBase &
  (
    | {
        key: "store";
        value: IConfigStore;
      }
    | {
        key: "delivery";
        value: IConfigDelivery;
      }
    | {
        key: "hours";
        value: IConfigHours;
      }
    | {
        key: "chatbot";
        value: IConfigChatbot;
      }
  );

const ConfigSchema = new Schema(
  {
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const ConfigModel =
  (models.Config as Model<IConfig>) || model<IConfig>("Config", ConfigSchema);
