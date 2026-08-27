import {GUID, InappActionKey, UserActionKey} from "../types/lib";
import {DOM} from "../DOM";
import {Statistics} from "../Statistics";
import {
    InAppNotificationLarge,
    NotificationAttrCallToAction,
    NotificationAttrHeadline,
    NotificationAttrImage,
    NotificationAttrText,
} from "../types/notification.type";

export class InAppLarge {
    constructor(
        private userAlias: GUID,
        private clientKey: GUID,
        private errorHandler: (error: any) => void
    ) {
    }

    public showInapp(
        notification: InAppNotificationLarge,
        append: boolean = true
    ) {
        let inapp = this.createInapp(notification.front, notification.campaign_guid);


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
        const btns = anchor.querySelectorAll(".pws-ievent");

        btns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                if (e.target instanceof HTMLElement) {
                    const target = e.target;
                    this.saveStatistics(
                        target.dataset.key as InappActionKey,
                        target.dataset.cg as GUID
                    );
                }
            });
        });
    }

    private attachDismissEventListeners(
        campaignGuid: GUID,
        elem?: HTMLDivElement
    ) {
        const anchor = elem || document;
        const closeBtn = anchor.querySelectorAll(".pws-dismiss");

        closeBtn[0].addEventListener("click", () => {
            this.saveStatistics("in_app_dismiss", campaignGuid);
        });
    }

    private createInapp(
        content: InAppNotificationLarge["front"],
        campaignGuid: GUID
    ): string {
        let markup = `
      <div class="pws-preview">
        <div class="pws-card pws-flex">
    `;

        const img = content.find((f) => f.type === "image" );
        if (img) {
            markup += this.createImage(img as NotificationAttrImage);
        }

        markup += `
      <div class="pws-flex pws-flex-col pws-content-box">
        <div class="pws-text-box">
    `;

        content
            .filter((f) => f.type !== "image" && f.type !== "call_to_action")
            .sort((a, b) => a.position - b.position)
            .forEach((item) => {
                markup += this.createInappContent(item, campaignGuid);
            });

        markup += `</div>`;

        const cta = content.find((f) => f.type === "call_to_action");
        if (cta) {
            markup += this.createCTA(
                cta as NotificationAttrCallToAction,
                campaignGuid
            );
        }

        markup += `
          </div>
        </div>
      </div>
    `;

        return markup;
    }

    private createInappContent(
        item: InAppNotificationLarge["front"][number],
        campaignGuid: GUID
    ): string {
        switch (item.type) {
            case "image":
                return this.createImage(item);
            case "headline":
                return this.createHeadline(item);
            case "text":
                return this.createText(item);
            case "call_to_action":
                return this.createCTA(item, campaignGuid);
            default:
                return "";
        }
    }

    private createImage(item: NotificationAttrImage): string {
        return `
      <div class="pws-img-box">
        <img src="${item.attrs[0].image_url}" alt="" class="pws-img">
      </div>
    `;
    }

    private createHeadline(item: NotificationAttrHeadline): string {
        return `
       <div class="pws-headline">${item.attrs[0].text}</div>
    `;
    }

    private createText(item: NotificationAttrText): string {
        return `
      <div class="pws-text">${item.attrs[0].text}</div>
    `;
    }

    private createCTA(
        item: NotificationAttrCallToAction,
        campaignGuid: GUID
    ): string {
        return `
      <div class="pws-cta">
        ${item.attrs
            .map((attr, idx) => {
                let key: InappActionKey = "in_app_button_click_one";
                if (idx === 1) {
                    key = "in_app_button_click_two";
                }

                let tag = "a";
                if (attr.destination_type === "dismiss") {
                    tag = "button";
                }

                return `<${tag}
            ${tag === "button" ? "type='button'" : ""}
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
            data-key="${key}"
            data-cg="${campaignGuid}"
            data-destination="${attr.destination_type}"
            data-events="${
                    attr.in_app_events
                        ? attr.in_app_events.map((i) => i.value).join(",")
                        : ""
                }"
            class="pws-ievent pws-cta-item pws-block pws-rounded-3xl pws-close-modal"
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
