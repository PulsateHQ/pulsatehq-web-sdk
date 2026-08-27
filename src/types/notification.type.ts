import { GUID, UTCTimestamp, DestinationType } from "./lib";

export interface InAppNotificationLarge {
  allow_reply: boolean;
  campaign_guid: GUID;
  created_at: string;
  guid: GUID;
  position: "top";
  size: "large";
  type: "personal";
  front: (
    | NotificationAttrAdminHeaderWithMessage
    | NotificationAttrHeadline
    | NotificationAttrText
    | NotificationAttrImage
    | NotificationAttrCallToAction
  )[];
}

export interface InAppNotificationSmall {
  allow_reply: boolean;
  campaign_guid: GUID;
  created_at: string;
  guid: GUID;
  position: "top" | "bottom";
  size: "small";
  type: "personal";
  front: (
    | NotificationAttrImageHeaderWithMessage
    | NotificationAttrText
    | NotificationAttrCallToAction
  )[];
}

export interface FeedPostNotification {
  guid: GUID;
  is_campaign_unread: boolean;
  type: "card";
  campaign_guid: GUID;
  allow_reply: boolean;
  front: (
    | NotificationAttrAdminHeaderWithMessage
    | NotificationAttrHeadline
    | NotificationAttrText
    | NotificationAttrImage
    | NotificationAttrRichMedia
    | NotificationAttrCallToAction
  )[];
  back: (
    | NotificationAttrAdminHeaderWithMessage
    | NotificationAttrText
    | NotificationAttrImage
    | NotificationAttrRichMedia
    | NotificationAttrHeadline
    | NotificationAttrCallToAction
    | NotificationAttrHeading
    | NotificationAttrTable
  )[];
  inbox_item_guid: GUID;
  last_interaction_at: number;
  expiry_at: number;
}

export interface Feed {
  categories: unknown[];
  inbox_items: FeedPostNotification[];
  total_unread: number;
}

interface NotificationAttrBase {
  active: boolean;
  position: number;
}

export interface NotificationAttrAdminHeaderWithMessage
  extends NotificationAttrBase {
  type: "admin_header_with_message";
  attrs: {
    message: string;
    admin: {
      avatar_url: string;
      job_title: string;
      name: string;
      s_id: GUID;
    };
  }[];
}

export interface NotificationAttrHeadline extends NotificationAttrBase {
  type: "headline";
  attrs: {
    text: string;
  }[];
}

export interface NotificationAttrHeading extends NotificationAttrBase {
  type: "heading";
  attrs: {
    text: string;
  }[];
}
export interface NotificationAttrText extends NotificationAttrBase {
  type: "text";
  attrs: {
    text: string;
  }[];
}

export interface NotificationAttrImage extends NotificationAttrBase {
  type: "image";
  attrs: {
    height: number;
    width: number;
    image_url: string;
    name: string;
    message?: string;
  }[];
}

export interface NotificationAttrImageHeaderWithMessage extends NotificationAttrBase {
  type: "image_header_with_message";
  attrs: {
    height: number;
    width: number;
    image_url: string;
    name: string;
    message: string;
  }[];
}



export interface NotificationAttrRichMedia extends NotificationAttrBase {
  type: "rich_media";
  attrs: {
    name: string;
    provider: "s3" | "giphy" | "external";
    rich_media_url: string;
    rich_media_compressed_url: string;
    custom_data: {
      type: "mp4" | "gif" | "image";
      name: string;
      s3Key: string;
    };
  }[];
}

export interface NotificationAttrCallToAction extends NotificationAttrBase {
  type: "call_to_action";
  attrs: {
    btn_color: string;
    destination: string;
    destination_type: DestinationType;
    destination_url: string;
    destination_url_web?: string;
    in_app_events: { value: string }[] | null;
    label: string;
    order_number: number;
    show_in_app: boolean;
    show_btn: boolean;
    txt_color: string;
  }[];
}

export interface NotificationAttrTable extends NotificationAttrBase {
  type: "table";
  attrs: {
    rows: { label: string; value: string }[];
  }[];
}

export interface InappEventPayload {
  alias: GUID; //Banno user ID
  in_app_events: InappEvent[];
}

interface InappEvent {
  name: string;
  occurred_at: UTCTimestamp;
}
