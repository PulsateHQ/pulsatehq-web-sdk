import { getApiUrl } from "../apiUrl";
import { GUID, UserActionKey } from "../types/lib";
import {
  FeedPostNotification,
  Feed as FeedType,
  NotificationAttrImage,
  NotificationAttrRichMedia,
} from "../types/notification.type";
import { deleteNotification, fetchFeed } from "../api";
import { DOM } from "../DOM";
import { isInViewport, timeSince } from "../service";
import { Statistics } from "../Statistics";
import { FeedPost } from "./FeedPost";
import { TRASH_ICON } from "./icons";

export class Feed {
  #feedPosts: null | FeedType = null;
  containerID: string = "";
  #deleteModalTrigger: HTMLElement | null = null;

  constructor(
    private userAlias: GUID,
    private clientKey: GUID,
    private errorHandler: (error: any) => void,
    containerID?: string
  ) {
    if (typeof containerID === "string") {
      this.containerID = containerID;
    }

    this.clickListener = this.clickListener.bind(this);
    this.scrollListener = this.scrollListener.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  public async getUnreadCount(): Promise<number> {
    if (!this.#feedPosts) {
      await this.fetchFeed();
    }

    if (this.#feedPosts) {
      return this.#feedPosts.total_unread;
    }

    return 0;
  }

  public async showFeed() {
    try {
      await this.fetchFeed();
    } catch (error) {
      this.errorHandler(error);
    }

    this.showFeedFront();
    this.scrollListener();
  }

  private async fetchFeed() {
    const feed = await fetchFeed(this.userAlias, this.clientKey);
    this.#feedPosts = feed;
  }

  private showFeedFront() {
    if (this.#feedPosts?.inbox_items?.length) {
      const markup = this.createFeed(this.#feedPosts.inbox_items);
      DOM.createFeed(markup, this.containerID, [
        "pws-feed",
        "pws-flex",
        "pws-wrap",
      ]);
      this.attachFeedEventListeners();
    } else {
      const markup = this.createEmptyFeed();
      DOM.createFeed(markup, this.containerID);
    }
  }

  private showFeedBack(campaignGuid: GUID, notification: FeedPostNotification) {
    const markup = this.createFeedBack(notification.back, campaignGuid);
    DOM.hideFeed();
    DOM.createFeedBack(markup, this.containerID, ["pws-feed-back"]);

    this.attachFeedEventListeners();
    this.saveStatistics("card_back_impression", campaignGuid);
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

  private saveInappEvent(events: string) {
    Statistics.saveInappEvents(
      this.userAlias,
      events.split(","),
      this.clientKey,
      this.errorHandler
    );
  }

  private createFeed(content: FeedPostNotification[]): string {
    let markup = "";

    content.forEach((item) => {
      markup += `<div class="pws-feedpost pws-fp" data-cg="${item.campaign_guid}">`;
      const img = item.front.find((f) => f.type === "image");
      const richMedia = item.front.find((f) => f.type === "rich_media");
      if (img) {
        markup += FeedPost.createImage(img as NotificationAttrImage);
      }
      if (richMedia) {
        markup += FeedPost.createRichMedia(
          richMedia as NotificationAttrRichMedia
        );
      }

      markup += `<div class="pws-flex pws-flex-col pws-between pws-content-box-feed">`;
      item.front
        .filter((f) => f.type !== "image" && f.type !== "rich_media")
        .sort((a, b) => a.position - b.position)
        .forEach((i) => {
          markup += FeedPost.createFeedContent(
            i,
            item.campaign_guid,
            "card_front"
          );
        });

      if (item.last_interaction_at) {
        const timeAgo = timeSince(new Date(item.last_interaction_at * 1000));
        markup += `<div class="pws-time">${timeAgo}</div>`;
      }
      markup += `<button type="button" class="pws-delete" data-cg="${item.campaign_guid}" data-key="card_delete" aria-label="Delete card">${TRASH_ICON}</button>`;
      markup += "</div>";
      markup += "</div>";
    });

    return markup;
  }

  private createEmptyFeed(): string {
    return `
      <div class="pws-feedpost">
        <div class="pws-flex pws-flex-col pws-items-center pws-justify-center pws-content-box-feed">
          <svg width="280" height="100" viewBox="0 0 280 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3.5" y="3.5" width="93" height="93" rx="16.5" fill="white" stroke="#ECEEF1" stroke-width="7"/>
            <path d="M19 55.5L32.0874 41.51C32.8598 40.6843 34.1626 40.6626 34.9621 41.4621L42.0858 48.5858C42.8668 49.3668 42.8668 50.6332 42.0858 51.4142L38 55.5L57.5858 35.9142C58.3668 35.1332 59.6332 35.1332 60.4142 35.9142L80 55.5" stroke="#ECEEF1" stroke-width="7" stroke-linecap="round"/>
            <rect x="113.5" y="3.5" width="163" height="93" rx="16.5" fill="white" stroke="#ECEEF1" stroke-width="7"/>
            <rect x="136" y="24" width="109" height="8" rx="4" fill="#ECEEF1"/>
            <rect x="136" y="41" width="86" height="8" rx="4" fill="#ECEEF1"/>
            <rect x="136" y="62" width="44" height="15" rx="7.5" fill="#ECEEF1"/>
          </svg>
          <p class="pws-empty-feed">No posts to show</p>
        </div>
      </div>
    `;
  }

  private createFeedBack(
    content: FeedPostNotification["back"],
    campaignGuid: GUID
  ): string {
    let markup = `<div class="pws-feedpost-back" data-cg="${campaignGuid}">`;

    content
      .sort((a, b) => {
        if (a.type === "table" && b.type === "heading") {
          return 1;
        }
        return a.position - b.position;
      })
      .forEach((i) => {
        markup += FeedPost.createFeedContent(
          i,
          campaignGuid,
          "card_back",
          "back"
        );
      });

    markup += "</div>";

    markup = `
      <button type="button" class="pws-arrow-back"></button>
      ${markup}
    `;

    return markup;
  }

  private showDeleteConfirmation(campaignGuid: GUID) {
    this.dismissDeleteConfirmation();

    const card = document.querySelector(
      `.pws-feedpost[data-cg="${campaignGuid}"]`
    );
    const primaryBtn = card?.querySelector(".pws-btn") as HTMLElement;
    const btnBg = primaryBtn?.style.backgroundColor || "";
    const btnColor = primaryBtn?.style.color || "";

    const backdrop = document.createElement("div");
    backdrop.classList.add("pws-delete-backdrop");

    const modal = document.createElement("div");
    modal.classList.add("pws-delete-modal");
    modal.setAttribute("data-cg", campaignGuid);
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "pws-delete-modal-title");
    modal.innerHTML = `
      <div class="pws-delete-modal-header">
        <h3 id="pws-delete-modal-title" class="pws-delete-modal-title">Delete card</h3>
        <button type="button" class="pws-delete-modal-close pws-delete-cancel" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="pws-delete-modal-body">Are you sure you want to permanently delete this card?</div>
      <div class="pws-delete-modal-actions">
        <button type="button" class="pws-delete-modal-btn pws-delete-cancel">Cancel</button>
        <button type="button" class="pws-delete-modal-btn pws-delete-ok"${btnBg ? ` style="background-color: ${btnBg}; color: ${btnColor};"` : ""}>Delete</button>
      </div>
    `;

    backdrop.addEventListener("click", () => {
      const okBtn = document.querySelector<HTMLButtonElement>(".pws-delete-ok");
      if (!okBtn?.disabled) {
        this.dismissDeleteConfirmation();
      }
    });

    modal.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const okBtn = target.closest(".pws-delete-ok") as HTMLButtonElement;
      if (okBtn) {
        this.confirmDelete(campaignGuid);
      } else if (target.closest(".pws-delete-cancel")) {
        this.dismissDeleteConfirmation();
      }
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    const deleteBtn = modal.querySelector(".pws-delete-ok") as HTMLElement;
    deleteBtn?.focus();

    document.addEventListener("keydown", this.handleKeyDown);
  }

  private dismissDeleteConfirmation() {
    const modal = document.querySelector(".pws-delete-modal");
    const backdrop = document.querySelector(".pws-delete-backdrop");
    if (modal) modal.remove();
    if (backdrop) backdrop.remove();
    document.removeEventListener("keydown", this.handleKeyDown);
    if (this.#deleteModalTrigger) {
      this.#deleteModalTrigger.focus();
      this.#deleteModalTrigger = null;
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      const okBtn = document.querySelector<HTMLButtonElement>(".pws-delete-ok");
      if (!okBtn?.disabled) {
        this.dismissDeleteConfirmation();
      }
      return;
    }

    if (e.key === "Tab") {
      const modal = document.querySelector(".pws-delete-modal");
      if (!modal) return;

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>("button:not([disabled])")
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  private async confirmDelete(campaignGuid: GUID) {
    if (!campaignGuid) {
      return;
    }

    const modal = document.querySelector(".pws-delete-modal") as HTMLElement;
    const allBtns = Array.from(
      modal?.querySelectorAll<HTMLButtonElement>("button") ?? []
    );
    const okBtn = modal?.querySelector<HTMLButtonElement>(".pws-delete-ok");

    // Set loading state — disable all buttons and update label
    allBtns.forEach((btn) => (btn.disabled = true));
    if (okBtn) okBtn.textContent = "Deleting…";

    try {
      await deleteNotification(this.userAlias, campaignGuid, this.clientKey);
      this.saveStatistics("card_delete", campaignGuid);
      this.dismissDeleteConfirmation();

      const card = document.querySelector(
        `.pws-feedpost[data-cg="${campaignGuid}"]`
      ) as HTMLElement;

      if (card) {
        card.style.maxHeight = card.scrollHeight + "px";
        // Force reflow so the browser registers the starting max-height
        void card.offsetHeight;
        card.classList.add("pws-fade-out");

        card.addEventListener(
          "transitionend",
          () => {
            card.remove();
            this.removeFromFeedState(campaignGuid);
          },
          { once: true }
        );

        // Fallback in case transitionend doesn't fire
        setTimeout(() => {
          if (card.parentNode) {
            card.remove();
            this.removeFromFeedState(campaignGuid);
          }
        }, 500);
      }
    } catch (error) {
      // Re-enable buttons and restore label
      allBtns.forEach((btn) => (btn.disabled = false));
      if (okBtn) okBtn.textContent = "Delete";

      // Show error message in modal body
      const body = modal?.querySelector(".pws-delete-modal-body");
      if (body) {
        body.textContent = "Failed to delete. Please try again.";
        body.classList.add("pws-delete-error");
      }

      okBtn?.focus();
      this.errorHandler(error);
    }
  }

  private removeFromFeedState(campaignGuid: GUID) {
    if (this.#feedPosts) {
      this.#feedPosts.inbox_items = this.#feedPosts.inbox_items.filter(
        (item) => item.campaign_guid !== campaignGuid
      );

      if (this.#feedPosts.inbox_items.length === 0) {
        const feed = document.querySelector(".pws-feed");
        if (feed) {
          feed.innerHTML = this.createEmptyFeed();
        }
      }
    }
  }

  private clickListener(e: Event) {
    if (e.target instanceof HTMLElement) {
      const target = e.target;

      const deleteBtn = target.closest(".pws-delete") as HTMLElement;
      if (deleteBtn?.dataset.key === "card_delete") {
        this.#deleteModalTrigger = deleteBtn;
        this.showDeleteConfirmation(deleteBtn.dataset.cg as GUID);
        return;
      }

      this.saveStatistics(
        target.dataset.key as UserActionKey,
        target.dataset.cg as GUID
      );
      if (target.dataset.events) {
        this.saveInappEvent(target.dataset.events);
      }

      if (target.dataset.destination === "card_back") {
        const notification = this.#feedPosts?.inbox_items.find(
          (ii) => ii.campaign_guid === (target.dataset.cg as GUID)
        );
        if (notification) {
          this.showFeedBack(target.dataset.cg as GUID, notification);
        }
      }

      if (target.dataset.destination === "deeplink" && target.dataset.url) {
        fetch(`${getApiUrl()}/api/v1/middleware/deeplink`, {
          method: "POST",
          body: JSON.stringify({ url: target.dataset.url }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            window.open(data.url, "_blank");
          })
          .catch((error) => {
            console.error("Error fetching SSO URL:", error);
            this.errorHandler(error);
          });
        return;
      }

      if (target.dataset.destination === "dismiss") {
        DOM.removeFeedBack();
        DOM.showFeed();
      }
    }
  }

  private scrollListener() {
    const box = document.getElementsByClassName("pws-fp");

    if (box.length === 0) return;

    Array.from(box).forEach((b) => {
      if (isInViewport(b)) {
        if (b instanceof HTMLElement) {
          this.saveStatistics("card_front_impression", b.dataset.cg as GUID);
        }
      }
    });
  }

  private detachFeedEventListeners() {
    const btns = document.querySelectorAll(".pws-event");
    btns.forEach((btn) => {
      btn.removeEventListener("click", this.clickListener);
    });

    const deleteBtns = document.querySelectorAll(".pws-delete");
    deleteBtns.forEach((btn) => {
      btn.removeEventListener("click", this.clickListener);
    });

    document.removeEventListener("scroll", this.scrollListener);
  }

  private attachFeedEventListeners() {
    this.detachFeedEventListeners();

    const btns = document.querySelectorAll(".pws-event");
    btns.forEach((btn) => {
      btn.addEventListener("click", this.clickListener);
    });

    const deleteBtns = document.querySelectorAll(".pws-delete");
    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", this.clickListener);
    });

    document.addEventListener("scroll", this.scrollListener, {
      passive: true,
    });
  }
}
