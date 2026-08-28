import { GUID, UserActionKey } from "../types/lib.js";
import { DOM } from "../DOM/index.js";
import { Statistics } from "../Statistics.js";
import {
  NotificationAttrImageHeaderWithMessage,
  InAppNotificationSmall,
  NotificationAttrCallToAction,
  NotificationAttrText,
} from "../types/notification.type.js";

export class InAppSmall {
  constructor(
    private userAlias: GUID,
    private clientKey: GUID,
    private errorHandler: (error: any) => void
  ) {}

  public showInapp(
    notification: InAppNotificationSmall,
    append: boolean = true
  ) {
    let inapp = this.createInappSmall(
      notification.front,
      notification.campaign_guid
    );

    const markup = DOM.createModal(inapp);

    this.attachEventListeners(markup);
    this.attachDismissEventListeners(notification.campaign_guid, markup);

    this.saveStatistics("in_app_delivery", notification.campaign_guid);
    this.saveStatistics("in_app_impression", notification.campaign_guid);

    if (append) {
      DOM.appendModal(markup);
    }

    return markup;
  }

  private saveStatistics(key: UserActionKey, campaignGuid: GUID) {
    Statistics.save(
      this.userAlias,
      this.clientKey,
      campaignGuid,
      key,
      this.errorHandler
    );
  }

  private attachEventListeners(elem?: HTMLDivElement) {
    const anchor = elem || document;
    const card = anchor.querySelector(".pws-card");
    if (card) {
      card.addEventListener("click", () => {
        if (card instanceof HTMLElement) {
          this.saveStatistics(
            "in_app_button_click_one",
            card.closest("[data-cg]")?.getAttribute("data-cg") as GUID
          );
        }
      });
    }
  }

  private attachDismissEventListeners(
    campaignGuid: GUID,
    elem?: HTMLDivElement
  ) {
    const anchor = elem || document;
    const closeBtn = anchor.querySelectorAll(".pws-dismiss");

    if (closeBtn.length > 0) {
      closeBtn[0].addEventListener("click", () => {
        this.saveStatistics("in_app_dismiss", campaignGuid);
      });
    }
  }

  private createInappSmall(
    content: (
      | NotificationAttrImageHeaderWithMessage
      | NotificationAttrText
      | NotificationAttrCallToAction
    )[],
    campaignGuid: GUID
  ): string {
    const imageHeaderWithMessage = content.find(
      (f) => f.type === "image_header_with_message"
    ) as NotificationAttrImageHeaderWithMessage | undefined;
    const cta = content.find(
      (f) => f.type === "call_to_action"
    ) as NotificationAttrCallToAction;
    let markup = `
      <div class="pws-preview">
        <div class="pws-card pws-flex">
          <div class="pws-img-box">
            <img src="${imageHeaderWithMessage?.attrs[0].image_url}" alt="" class="pws-img">
        </div>
    `;
    markup += `
      <div class="pws-flex pws-flex-col pws-content-box">
      <div class="pws-text">${imageHeaderWithMessage?.attrs[0].message}</div>
    `;

    markup += `</div></div>`;

    return this.createCardWrapperWithCta(cta, campaignGuid, markup);
  }

  private createCardWrapperWithCta(
    item: NotificationAttrCallToAction,
    campaignGuid: GUID,
    content: string
  ): string {
    const attr = item.attrs[0];
    let tag = "a";
    if (attr.destination_type === "dismiss") {
      tag = "div";
    }
    return `<${tag}            
            ${
              tag === "a"
                ? `href="${
                    attr.destination_url_web || attr.destination_url
                  }" target="${
                    attr.destination_type === "url" || attr.destination_url_web
                      ? "_blank"
                      : "_top"
                  }"`
                : ""
            }
            data-cg="${campaignGuid}"
            data-destination="${attr.destination_type}"
            data-events="${
              attr.in_app_events
                ? attr.in_app_events.map((i) => i.value).join(",")
                : ""
            }"
            class="pws-close-modal"
            >
             ${content || ""}
            </${tag}>`;
  }
}
