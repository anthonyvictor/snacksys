import { IAddress } from "./address";
import { IChat, IChatPlatform, IChatStatus, IMessage } from "./chat";
import { Entities, IntentResult } from "./intent";
import { IOrderStatus } from "./order";

export interface ReceivedMessageDTO {
  title?: string;
  imageUrl?: string;
  body: string;
  from: string;
  platform: IChatPlatform;
}

export interface GetOrdersDTO {
  customers?: string[];
  ids?: string[];
  status?: IOrderStatus[];
}
export interface DeleteOrdersDTO {
  customers?: string[];
  ids?: string[];
}

export interface FindAddressesDTO {
  street?: string | null;
  zipCode?: string | null;
  coords?: [number, number] | null;
  neighborhood?: string | null;
}

export interface GetChatsDTO {
  from?: string[];
  platforms?: IChatPlatform[];
  ids?: string[];
  status?: IChatStatus[];
}

export interface GetAddressesDTO {
  zipCodes?: string[];
  streets?: string[];
  neighborhoods?: string[];
  ids?: string[];
}
export interface SaveAddressesDTO {
  newAddress: IAddress;
}
export interface DeleteChatsDTO {
  from?: string[];
  ids?: string[];
}

export interface GetCustomersDTO {
  phone?: string[];
  query?: string;
  ids?: string[];
}

export interface GetProductsDTO {
  categorized?: boolean;
  categories?: string[];
  ids?: string[];
  query?: string;
  onlyActive?: boolean;
}

export interface DetectIntentDTO {
  chat: IChat;
  msg: string;
}
export interface MessageReplyDTO {
  chat: IChat;
  msg: string;
  entities?: Entities;
}
export type MsgReplyFunc = ({
  chat,
}: MessageReplyDTO) => Promise<(IMessage | undefined)[]>;

export interface MessageIntentDTO {
  normalized: string;
  original: string;
  chat: IChat;
}
export type MsgIntentFunc = ({
  chat,
}: MessageIntentDTO) => Promise<boolean | IntentResult>;
