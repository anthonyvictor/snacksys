import { greeting } from "./greeting";
import { confirm } from "./confirm";
import { deny } from "./deny";
import { askDelivery } from "./askDelivery";
import { askMenu } from "./askMenu";
import { askPix } from "./askPix";
import { askWaitTime } from "./askWaitTime";
import { askRestaurantAddress } from "./askRestaurantAddress";
import { askPaymentMethods } from "./askPaymentMethods";
import { reviewOrder } from "./reviewOrder";
import { addProducts } from "./addProducts";
import { addPayments } from "./addPayments";
import { askWorkingHours } from "./askWorkingHours";
import { thank } from "./thank";
import { rollback } from "./rollback";
import { removeProducts } from "./removeProducts";
import { MsgIntentFunc } from "types";
import { observations } from "./observations";
import { askTotal } from "./askTotal";

// continueOrder,
export const intents: { [key: string]: MsgIntentFunc } = {
  askDelivery,
  addProducts,
  addPayments,
  greeting,
  askPaymentMethods,
  askWaitTime,
  askWorkingHours,
  askRestaurantAddress,
  askTotal,
  reviewOrder,
  observations,
  removeProducts,
  confirm,
  thank,
  rollback,
  deny,
  askMenu,
  askPix,
};
