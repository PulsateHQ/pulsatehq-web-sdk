import { FeedActionKey, GUID } from "../types/lib";
import {
  FeedPostNotification,
  NotificationAttrCallToAction,
  NotificationAttrHeading,
  NotificationAttrHeadline,
  NotificationAttrImage,
  NotificationAttrRichMedia,
  NotificationAttrTable,
  NotificationAttrText,
} from "../types/notification.type";

export class FeedPost {
  static createFeedContent(
    item:
      | FeedPostNotification["front"][number]
      | FeedPostNotification["back"][number],
    campaignGuid: GUID,
    eventPrefix: "card_front" | "card_back",
    classSuffix?: string
  ): string {
    switch (item.type) {
      case "image":
        return this.createImage(item, classSuffix);
      case "rich_media":
        return this.createRichMedia(item, classSuffix);
      case "headline":
        return this.createHeadline(item, classSuffix);
      case "text":
        return this.createText(item, classSuffix);
      case "heading":
        return this.createHeading(item);
      case "table":
        return this.createTable(item);
      case "call_to_action":
        return this.createCTA(item, campaignGuid, eventPrefix, classSuffix);
      default:
        return "";
    }
  }

  static createImage(
    item: NotificationAttrImage,
    classSuffix?: string
  ): string {
    const isFeedBack = classSuffix === "back";
    const width = item.attrs[0].width;
    const height = item.attrs[0].height;
    const aspectRatio =
      isFeedBack && height && width ? (height / width) * 100 : 56.25; // Default to 16:9 ratio if dimensions missing

    if (isFeedBack) {
      // Use padding-bottom for aspect ratio
      return `
        <div class="pws-img-box-feed ${
          classSuffix ? `pws-img-box-feed-${classSuffix}` : ""
        }" style="padding-bottom: ${aspectRatio}%;">
          <img src="${item.attrs[0].image_url}" alt="" class="pws-img-feed ${
        classSuffix ? `pws-img-feed-${classSuffix}` : ""
      }">
        </div>
      `;
    }

    return `
      <div class="pws-img-box-feed ${
        classSuffix ? `pws-img-box-feed-${classSuffix}` : ""
      }">
        <img src="${item.attrs[0].image_url}" alt="" class="pws-img-feed ${
      classSuffix ? `pws-img-feed-${classSuffix}` : ""
    }">
      </div>
    `;
  }

  static createRichMedia(
    item: NotificationAttrRichMedia,
    classSuffix?: string
  ): string {
    return `
      <div class="pws-richmedia-box-feed ${
        classSuffix ? `pws-richmedia-box-feed-${classSuffix}` : ""
      }">
      ${
        item.attrs[0].custom_data.type === "mp4"
          ? `
        <video src="${
          item.attrs[0].rich_media_url
        }" controls muted class="pws-video-feed ${
              classSuffix ? `pws-video-feed-${classSuffix}` : ""
            }">
          <source src="${item.attrs[0].rich_media_url}"  type="video/mp4">
        </video>
      `
          : `
      <img src="${item.attrs[0].rich_media_url}" class="pws-img-feed ${
              classSuffix ? `pws-img-feed-${classSuffix}` : ""
            }">
      `
      }
      </div>
    `;
  }

  static createHeadline(
    item: NotificationAttrHeadline,
    classSuffix?: string
  ): string {
    return `
       <div class="pws-headline pws-headline-feed ${
         classSuffix ? `pws-headline-${classSuffix}` : ""
       }">${item.attrs[0].text}</div>
    `;
  }

  static createText(item: NotificationAttrText, classSuffix?: string): string {
    return `
    <div  class="pws-text pws-text-feed ${
      classSuffix ? `pws-text-${classSuffix}` : ""
    }">${item.attrs[0].text}</div>
    `;
  }

  static createHeading(item: NotificationAttrHeading): string {
    return `
       <div class="pws-headline pws-heading">${item.attrs[0].text}</div>
    `;
  }

  static createTable(item: NotificationAttrTable): string {
    return `
      <div class="pws-table">
      ${item.attrs[0].rows
        .map(
          (r) => `
            <div class="pws-flex pws-table-row">
              <div class="pws-table-row-label">${r.label}</div>
              <div class="pws-table-row-value">${r.value}</div>
            </div>
          `
        )
        .join("")}
      </div>`;
  }

  static createCTA(
    item: NotificationAttrCallToAction,
    campaignGuid: GUID,
    eventPrefix: "card_front" | "card_back",
    classSuffix?: string
  ): string {
    return `
      <div class="pws-flex pws-mt-auto pws-btns ${
        classSuffix ? `pws-btns-${classSuffix}` : ""
      }">
        ${item.attrs
          .map((attr, idx) => {
            let key: FeedActionKey = `${eventPrefix}_button_click_one`;
            if (idx === 1) {
              key = `${eventPrefix}_button_click_two`;
            }

            const destinationUrl =
              attr.destination_url_web ||
              (attr.destination_url ??
              (attr as { destination?: string }).destination ??
              "");
            const isSso =
              typeof destinationUrl === "string" &&
              destinationUrl.includes("Sso/SignOn.aspx");

            let tag = "a";
            if (
              attr.destination_type === "card_back" ||
              attr.destination_type === "dismiss" ||
              isSso
            ) {
              tag = "button";
            }

            return `<${tag}
            ${tag === "button" ? "type='button'" : ""}
            ${
              tag === "a"
                ? `href="${destinationUrl}" target="${
                    attr.destination_type === "url" || attr.destination_url_web ? "_blank" : "_top"
                  }"`
                : ""
            } 
            data-key="${key}"
            data-cg="${campaignGuid}"
            data-destination="${attr.destination_type}"
            data-url="${isSso ? destinationUrl : ""}"
            ${
              attr.in_app_events
                ? `data-events="${attr.in_app_events
                    ?.map((i) => i.value)
                    .join(",")}"`
                : ""
            }
            class="pws-event pws-btn ${
              classSuffix ? `pws-btn-${classSuffix}` : ""
            }"
            style="${
              attr.btn_color &&
              `background-color: ${attr.btn_color}; border: 0;`
            }${attr.txt_color && `color: ${attr.txt_color};`}"
            >
              ${attr.label}
            </${tag}>`;
          })
          .join("")}
      </div>
    `;
  }
}
