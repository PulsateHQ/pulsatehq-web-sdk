export type GUID = string;
export type Phone = string;
export type Email = string;
export type DateTime = string;
export type UTCTimestamp = string;

export type DestinationType = "card_back" | "deeplink" | "url" | "dismiss" | "openfeed" | "card";

export interface User {
  alias: GUID;
  guid: GUID;
  firstName?: string;
  lastName?: string;
  email?: Email;
  phone?: Phone;
  age?: number;
  gender?: "man" | "woman";
}

export type UserActionKey = (FeedActionKey | InappActionKey) & string;

export const feedActionKey = [
  "card_send",
  "card_delivery",
  "card_delete",
  "card_front_impression",
  "card_front_button_click_one",
  "card_front_button_click_two",
  "card_back_impression",
  "card_back_button_click_one",
  "card_back_button_click_two",
] as const;

export type FeedActionKey = (typeof feedActionKey)[number];

export const inappActionKey = [
  "in_app_delivery",
  "in_app_error",
  "in_app_bounce",
  "in_app_impression",
  "in_app_dismiss",
  "in_app_button_click_one",
  "in_app_button_click_two",
  "in_app_time_out",
] as const;

export type InappActionKey = (typeof inappActionKey)[number];

export interface UserAction {
  guid: GUID;
  key: UserActionKey;
  type: "campaign";
  occurred_at_array: UTCTimestamp[];
}
