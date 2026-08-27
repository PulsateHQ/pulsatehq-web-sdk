/**
 * Base URL of the Pulsate middleware.
 *
 * The UMD build passes VITE_API_URL in from the build environment, which is how
 * the stage and production bundles are produced. When nothing is supplied — the
 * npm package, or a build without the variable — production is used.
 */
export const DEFAULT_API_URL = "https://web.pulsatehq.com";

let apiUrl: string = DEFAULT_API_URL;

export function setApiUrl(url?: string | null) {
  if (url) {
    apiUrl = url.replace(/\/+$/, "");
  }
}

export function getApiUrl(): string {
  return apiUrl;
}
