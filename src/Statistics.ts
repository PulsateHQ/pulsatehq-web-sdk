import { InappEventPayload } from "./types/notification.type.js";
import { GUID, UserActionKey } from "./types/lib.js";
import { getTimestampInSeconds } from "./service.js";
import { saveInappEvent, saveStatistic } from "./api.js";

export class Statistics {
  static #sentMap: Map<GUID, UserActionKey[]> = new Map();

  static async save(
    alias: GUID,
    clientKey: GUID,
    campaignGuid: GUID,
    key: UserActionKey,
    errorHandler: (error: any) => void
  ) {
    const guid = this.#sentMap.get(campaignGuid) || [];
    if (guid.includes(key)) {
      return;
    }

    this.#sentMap.set(campaignGuid, [...guid, key]);
    try {
      await saveStatistic(
        {
          alias,
          campaignGuid,
          key,
        },
        clientKey
      );
    } catch (error) {
      errorHandler(error);
      this.#sentMap.delete(campaignGuid);
    }
  }

  static async saveInappEvents(
    alias: GUID,
    events: string[],
    clientKey: GUID,
    errorHandler: (error: any) => void
  ) {
    const in_app_events: InappEventPayload["in_app_events"] = events.map(
      (e) => ({
        name: e,
        occurred_at: getTimestampInSeconds(),
      })
    );

    try {
      await saveInappEvent(
        {
          alias,
          in_app_events,
        },
        clientKey
      );
    } catch (error) {
      errorHandler(error);
    }
  }
}
