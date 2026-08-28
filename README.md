# @pulsatehq/web-sdk

In-app notifications, message feed and event tracking for websites.

## Install

```bash
npm install @pulsatehq/web-sdk
```

## Usage

```js
import Pulsate from "@pulsatehq/web-sdk";
import "@pulsatehq/web-sdk/styles.css";

const pulsate = new Pulsate({ key: "your-web-sdk-key" });

pulsate.addUser({
  alias: "5ae07b2a4753364695030000",
  guid: "5ae07b2a4753364695030000",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
});
```

The stylesheet is a separate import and is **required**. Without it the feed and
in-app notifications render unstyled, with no error.

Get a key from **App settings → Web SDK Credentials**.

## Constructor

```ts
new Pulsate({ key, apiUrl?, showInapp? })
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `key` | `string` | — | Web SDK key. Required. |
| `apiUrl` | `string` | production | Middleware base URL. Set it if you target a staging environment. |
| `showInapp` | `boolean` | `true` | Show an in-app notification when the session starts. |

The constructor touches `document` and `sessionStorage`, so in a server-rendered
application it must run on the client only:

```jsx
useEffect(() => {
  const pulsate = new Pulsate({ key: "your-web-sdk-key" });
  pulsate.addUser(user);
  return () => pulsate.endSession();
}, []);
```

## Methods

### `addUser(user, options?)`

Starts a session for a user. `alias` and `guid` are required; `firstName`,
`lastName`, `email`, `phone`, `age` and `gender` are optional. Pass
`{ showInapp: false }` to suppress the in-app notification for this call.

`init(user, options?)` is an alias of `addUser`.

### `showFeed(containerId?)`

Renders the message feed. With `containerId`, the feed is appended to the
element with that id; if no such element exists, or the argument is omitted, it
is appended to `document.body`.

```js
pulsate.showFeed("pulsate-feed");
```

### `getUnreadCount(callback)`

```js
pulsate.getUnreadCount(({ unreadCount }) => {
  console.log(unreadCount);
});
```

### `getInappNotification(callback)`

Hands you the notification markup instead of rendering it, so you can place it
yourself. The callback receives `null` when there is nothing to show.

```js
pulsate.getInappNotification((markup) => {
  if (!markup) return;
  document.body.appendChild(markup);
});
```

### `saveEvent(events)`

Records in-app events against the current user. Called with an empty or missing
array it does nothing.

```js
pulsate.saveEvent(["in_app_impression"]);
```

### `setErrorHandler(handler)`

Replaces the default error handler. Network and API failures are reported here
rather than thrown, so nothing in the SDK breaks the host page.

```js
pulsate.setErrorHandler((error) => {
  console.error(error.message, error.status);
});
```

Errors carry a `message` and an optional `status` holding the HTTP status code
when the failure came from the API. The default handler logs both to the
console.

### `endSession()`

Ends the current session.

## Ordering

`addUser` sets the user synchronously and then starts the session in the
background. What that means per method:

| | requires | if called too early |
| --- | --- | --- |
| `showFeed`, `saveEvent` | a user to be set — so, `addUser` to have been *called* | **nothing happens, silently** |
| `getUnreadCount`, `getInappNotification` | the session to be *active* | queued, then replayed automatically |

In practice: call `addUser` first and everything else works on the next line.

```js
pulsate.addUser(user);
pulsate.showFeed("pulsate-feed"); // fine — addUser set the user synchronously
```

Calling `showFeed` or `saveEvent` *before* `addUser` is the one case to avoid:
they return without doing anything and without reporting an error.

## TypeScript

Types ship with the package; nothing to install. `User`, `PulsateOptions`,
`GUID`, `UserActionKey` and the notification types are exported from the
package root.

```ts
import Pulsate, { type User, type PulsateOptions } from "@pulsatehq/web-sdk";
```

Both ESM and CommonJS are provided, and the declarations resolve under `node16`,
`nodenext`, `bundler` and legacy `node10` module resolution.

## Development

```
npm install
npm run dev
```

Opens the demo pages in `demo/` (Home and Feed), which load the SDK straight from `src/` with hot reload. Replace `<YOUR-WEB-SDK-KEY-HERE>` in the demo HTML with a real key before testing.

## License

MIT — see [LICENSE](LICENSE).
