import PulsateSDKModel from "./PulsateSDK";
import { setApiUrl } from "./apiUrl";
import { User } from "./types/lib";

// Bundled into the package as "@pulsatehq/web-sdk/styles.css" rather than
// fetched at runtime, so a pinned version never renders with styles it was
// not published with.
import "./styles/preview.css";

export interface PulsateOptions {
  /** Web SDK key, from App settings → Web SDK Credentials. */
  key: string;
  /** Middleware base URL. Defaults to production. */
  apiUrl?: string;
  /** Show an in-app notification when the session starts. Defaults to true. */
  showInapp?: boolean;
}

/**
 * Pulsate Web SDK.
 *
 * Touches `document` and `sessionStorage` on construction, so in a
 * server-rendered application it must be instantiated on the client only.
 */
export default class PulsateSDK {
  readonly #sdk: PulsateSDKModel;

  constructor({ key, apiUrl, showInapp }: PulsateOptions) {
    setApiUrl(apiUrl);

    const queue: Record<string, unknown>[] = [{ key }];
    if (showInapp !== undefined) {
      queue.push({ showInapp });
    }

    this.#sdk = new PulsateSDKModel(queue, { injectStylesheet: false });
  }

  init(user: User, options?: { showInapp: boolean }): void {
    this.#sdk.addUser(user, options);
  }

  addUser(user: User, options?: { showInapp: boolean }): void {
    this.#sdk.addUser(user, options);
  }

  showFeed(containerId?: string): void {
    this.#sdk.showFeed(containerId);
  }

  getUnreadCount(
    callback: ({ unreadCount }: { unreadCount: number }) => void
  ): Promise<void> {
    return this.#sdk.getUnreadCount(callback);
  }

  getInappNotification(
    callback: (markup: any | null) => void
  ): Promise<void> {
    return this.#sdk.getInappNotification(callback);
  }

  saveEvent(events?: string[]): void {
    this.#sdk.saveEvent(events);
  }

  setErrorHandler(handler: (error: any) => void): void {
    this.#sdk.setErrorHandler(handler);
  }

  endSession(): void {
    this.#sdk.endSession();
  }
}

export { DEFAULT_API_URL } from "./apiUrl";
export * from "./types/lib";
export * from "./types/notification.type";
