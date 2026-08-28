import { getApiUrl } from "./apiUrl.js";
import { GUID, User, UserActionKey } from "./types/lib.js";
import { Feed, InappEventPayload } from "./types/notification.type.js";
import PWSError from "./PWSError.js";

function get(url: string, data: Record<string, string>, key: GUID) {
  return fetch(`${url}?${new URLSearchParams(data)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Key": key,
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      if (response.status === 500) {
        const error = new PWSError("Internal server error");
        error.status = response.status;
        throw error;
      }

      return response.json().then((body) => {
        const error = new PWSError(body.error);
        error.status = response.status;
        throw error;
      });
    })
    .then((data) => {
      return data;
    });
}

function put(url: string, data: unknown, key: GUID) {
  return fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Key": key,
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      if (response.status === 500) {
        const error = new PWSError("Internal server error");
        error.status = response.status;
        throw error;
      }

      return response.json().then((body) => {
        const error = new PWSError(body.error);
        error.status = response.status;
        throw error;
      });
    })
    .then((data) => {
      return data;
    });
}

function post(url: string, data: unknown, key: GUID) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Key": key,
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      if (response.status === 500) {
        const error = new PWSError("Internal server error");
        error.status = response.status;
        throw error;
      }

      return response.json().then((body) => {
        const error = new PWSError(body.error);
        error.status = response.status;
        throw error;
      });
    })
    .then((data) => {
      return data;
    });
}

export function startSession(userAlias: GUID, key: GUID) {
  const body = {
    alias: userAlias,
    guid: userAlias,
    device: {
      type: "web",
      location_permission: false,
      push_permission: false,
    },
  };

  return post(
    `${getApiUrl()}/api/v1/session/start`,
    body,
    key
  );
}

export function endSession(userAlias: GUID, key: GUID) {
  const body = {
    alias: userAlias,
    guid: userAlias,
    user: {
      device: {
        type: "web",
        location_permission: false,
        push_permission: false,
      },
    },
    occurredAt: Date.now().toString(),
  };

  return post(`${getApiUrl()}/api/v1/session/end`, body, key);
}

export function updateSession(
  user: User,
  key: GUID,
  customTags?: {
    key: string;
    value: string | number | boolean;
    type: "string" | "number" | "boolean" | "date";
    action: "update";
  }[]
) {
    const body = {
        alias: user.alias,
        user,
        custom_tags: customTags || undefined,
    };

  return post(
    `${getApiUrl()}/api/v1/session/update`,
    body,
    key
  );
}
export function getInapp(userAlias: GUID, campaignGuid: GUID, key: GUID) {
  const query = {
    alias: userAlias,
    guid: campaignGuid,
  };

  return get(
    `${getApiUrl()}/api/v1/notification/inapp`,
    query,
    key
  );
}

export function fetchFeed(userAlias: GUID, key: GUID): Promise<Feed> {
  const query = {
    alias: userAlias,
  };

  return get(
    `${getApiUrl()}/api/v1/notification/feed`,
    query,
    key
  );
}

export function fetchBranding(userAlias: GUID, key: GUID) {
  const query = {
    alias: userAlias,
  };

  return get(`${getApiUrl()}/api/v1/branding`, query, key);
}

export async function saveStatistic(
  data: {
    alias: GUID;
    campaignGuid: GUID;
    key: UserActionKey;
  },
  key: GUID
) {
  return post(`${getApiUrl()}/api/v1/statistics`, data, key);
}

export async function deleteNotification(
  userAlias: GUID,
  campaignGuid: GUID,
  key: GUID
) {
  return put(
    `${getApiUrl()}/api/v1/delete_notification`,
    {
      guid: userAlias,
      alias: userAlias,
      campaigns_guids: [campaignGuid],
    },
    key
  );
}

export async function saveInappEvent(data: InappEventPayload, key: GUID) {
  return post(
    `${getApiUrl()}/api/v1/notification/inapp_events`,
    data,
    key
  );
}
