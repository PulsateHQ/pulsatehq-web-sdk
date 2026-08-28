import { Feed } from "./Feed/Feed.js";
import { InAppLarge } from "./Inapp/InAppLarge.js";
import { Statistics } from "./Statistics.js";
import {
  InAppNotificationLarge,
  NotificationAttrCallToAction,
  NotificationAttrHeadline,
  NotificationAttrImage,
  NotificationAttrText,
  NotificationAttrImageHeaderWithMessage,
  NotificationAttrAdminHeaderWithMessage,
  InAppNotificationSmall,
} from "./types/notification.type.js";
import { endSession, fetchBranding, startSession, updateSession } from "./api.js";
import { GUID, User } from "./types/lib.js";
import { DOM } from "./DOM/index.js";

export interface PulsateSDKModelOptions {
  /**
   * Whether to pull the stylesheet from the middleware at runtime.
   *
   * True for the UMD bundle, where the stylesheet is served next to the script.
   * The npm package sets this to false and ships the CSS inside the package, so
   * that a pinned version never loads styles it was not published with.
   */
  injectStylesheet?: boolean;
}

type WaitingEvents =
  | "addUser"
  | "endSession"
  | "showFeed"
  | "getUnreadCount"
  | "saveEvent"
  | "setErrorHandler"
  | "getInappNotification";

export default class PulsateSDKModel {
  user: User;
  #clientKey: GUID;
  #inApp: InAppNotificationLarge | InAppNotificationSmall | null = null;
  #feed: Feed | null = null;
  #errorHandler: (error: any) => void = (error) => {
    console.error("PulsateSDK", error.message, error.status);
  };

  waitingEvents: { c: WaitingEvents; args?: any[] }[] = [];

  #session: "active" | "inactive" = "inactive";

  constructor(...args: any[]) {
    const options: PulsateSDKModelOptions = args[1] || {};

    this.#clientKey = args[0].find((a: any) => a.key)?.key || null;
    this.user = args[0].find((a: any) => a.alias) || null;

    this.waitingEvents = args[0].filter((a: any) => a.c) || [];

    const showInappSetting = args[0].find((a: any) => "showInapp" in a);
    let showInapp = true;
    if (showInappSetting) {
      showInapp = showInappSetting.showInapp;
    }

    //exception for error handler
    const handler = this.waitingEvents.find(
      (a: any) => a.c === "setErrorHandler"
    );

    if (handler?.args) {
      this.setErrorHandler(handler.args[0]);
    }

    this.addUser = this.addUser.bind(this);
    this.endSession = this.endSession.bind(this);
    this.showFeed = this.showFeed.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
    this.setErrorHandler = this.setErrorHandler.bind(this);
    this.getInappNotification = this.getInappNotification.bind(this);

    if (options.injectStylesheet !== false) {
      DOM.attachStylesheet();
    }

    if (this.isActiveIntegration) {
      this.startUserSession(showInapp)
        .then(() => this.addUserDetails())
        .catch((error) => this.#errorHandler(error));
    }

    const session = sessionStorage.getItem("pws");
    if (session && !this.userAlias) {
      const user = JSON.parse(session);
      this.user = user;

      this.storeSession();
    }
  }

  /**
   * Private
   */

  get userAlias(): GUID {
    return this.user?.alias || "";
  }

  get isActiveSession(): boolean {
    return this.#session === "active";
  }

  get isActiveIntegration(): boolean {
    return Boolean(this.userAlias && this.#clientKey);
  }

  private async triggerWaitingEvents() {
    this.waitingEvents.forEach((event) => {
      if (event.c === "endSession") {
        this[event.c]();
      } else if (
        event.c === "showFeed" ||
        event.c === "saveEvent" ||
        event.c === "getUnreadCount" ||
        event.c === "setErrorHandler" ||
        event.c === "getInappNotification"
      ) {
        this[event.c](event.args?.[0]);
      }
    });
    this.waitingEvents = [];
  }

  private async startUserSession(showInapp: boolean = true) {
    if (this.#session === "active") return;

    if (!this.isActiveIntegration) {
      throw new Error("PulsateSDK: User Alias and Client Key are required");
    }

    const response = await startSession(this.userAlias, this.#clientKey);

    if (response.in_app_notification) {
      this.#inApp = response.in_app_notification;
    }

    this.storeSession();

    // Fetch branding in parallel and show inApp after branding completes
    if (response.in_app_notification && showInapp) {
      fetchBranding(this.userAlias, this.#clientKey)
        .then((branding) => {
          if (branding.enabled && branding.feed_web_url && this.#inApp?.front) {
            this.#inApp.front = this.#inApp.front.map(
              (
                item:
                  | NotificationAttrImageHeaderWithMessage
                  | NotificationAttrAdminHeaderWithMessage
                  | NotificationAttrHeadline
                  | NotificationAttrText
                  | NotificationAttrImage
                  | NotificationAttrCallToAction
              ) => {
                const isCallToAction = item.type === "call_to_action";
                const isFeedDestination =
                  isCallToAction &&
                  (item.attrs[0]?.destination_type === "openfeed" ||
                    item.attrs[0]?.destination_type === "card");

                if (isFeedDestination) {
                  item.attrs[0].destination_url = branding.feed_web_url;
                }

                return item;
              }
            ) as (InAppNotificationLarge | InAppNotificationSmall)["front"];
          }
          this.showInapp();
        })
        .catch((error) => {
          console.error("Failed to fetch branding:", error);
          this.showInapp();
        });
    } else if (showInapp) {
      this.showInapp();
    }
  }

  private storeSession() {
    this.#session = "active";
    sessionStorage.setItem("pws", JSON.stringify(this.user));
    this.triggerWaitingEvents();
  }

  private clearSession() {
    this.#session = "inactive";
    sessionStorage.removeItem("pws");
  }

  private async addUserDetails() {
    if (!this.isActiveIntegration) {
      throw new Error("User Alias and Client Key are required");
    }

    await updateSession(this.user, this.#clientKey);
    //TODO: check if needed
    // try {
    // } catch (error) {
    //   this.#errorHandler(error);
    // }
  }

  private async endUserSession() {
    if (!this.isActiveIntegration) {
      throw new Error("User Alias and Client Key are required");
    }

    try {
      this.clearSession();
      await endSession(this.userAlias, this.#clientKey);
    } catch (error) {
      this.#errorHandler(error);
    }
  }

  private async showInapp() {
    if (!this.#inApp || !this.isActiveIntegration) {
      return;
    }
    // PUL-2051: Small in-apps are not supported on Web SDK; mirror the Q2 web
    // plugin which drops them (see q2/pulsate/PulsateMain/frontend/public/render_inapp.js).
    if (this.#inApp.size !== "large") {
      return;
    }
    this.showInappLarge();
  }

  private async showInappLarge() {
    if (!this.#inApp || !this.isActiveIntegration) {
      return;
    }

    const inApp = new InAppLarge(
      this.userAlias,
      this.#clientKey,
      this.#errorHandler
    );

    inApp.showInapp(this.#inApp as InAppNotificationLarge);
  }

  private async onShowFeedEvent(cId?: string) {
    if (this.isActiveIntegration) {
      this.#feed = new Feed(
        this.userAlias,
        this.#clientKey,
        this.#errorHandler,
        cId
      );
      this.#feed.showFeed();
    }
  }

  private saveInappEvents(events: string[]) {
    if (this.isActiveIntegration) {
      Statistics.saveInappEvents(
        this.userAlias,
        events,
        this.#clientKey,
        this.#errorHandler
      );
    }
  }

  private async onGetUnreadCount(): Promise<number> {
    if (!this.#feed) {
      if (this.isActiveIntegration) {
        this.#feed = new Feed(
          this.userAlias,
          this.#clientKey,
          this.#errorHandler
        );
      }
    }

    let unreadCount = 0;
    if (this.#feed) {
      unreadCount = await this.#feed.getUnreadCount();
    }

    return unreadCount;
  }

  /**
   * Public API
   */

  public addUser(
    user: User,
    { showInapp }: { showInapp: boolean } = { showInapp: true }
  ): void {
    this.user = user;
    this.startUserSession(showInapp)
      .then(() => this.addUserDetails())
      .catch((error) => this.#errorHandler(error));
  }

  public async getInappNotification(
    callback: (markup: any | null) => void
  ): Promise<void> {
    if (!this.isActiveSession) {
      this.waitingEvents.push({ c: "getInappNotification", args: [callback] });
      return;
    }

    // PUL-2051: Small in-apps are not supported on Web SDK (see showInapp above).
    if (this.#inApp && this.#inApp.size === "large") {
      callback(this.showInappLarge());
    } else {
      callback(null);
    }
  }

  public endSession(): void {
    this.endUserSession();
  }

  public showFeed(cId?: string): void {
    this.onShowFeedEvent(cId);
  }

  public async getUnreadCount(
    callback: ({ unreadCount }: { unreadCount: number }) => void
  ): Promise<void> {
    if (!this.isActiveSession) {
      this.waitingEvents.push({ c: "getUnreadCount", args: [callback] });
      return;
    }

    try {
      const response = await this.onGetUnreadCount();
      callback({ unreadCount: response });
    } catch (error) {
      this.#errorHandler(error);
    }
  }

  public saveEvent(events?: string[]): void {
    if (events && events.length > 0) {
      this.saveInappEvents(events);
    }
  }

  public setErrorHandler(handler: (error: any) => void) {
    this.#errorHandler = handler;
  }
}
