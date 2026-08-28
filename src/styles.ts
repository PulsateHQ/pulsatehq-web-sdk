// Build-only entry for vite.npm.config.js: pulls the stylesheet through Vite
// so it is published as "@pulsatehq/web-sdk/styles.css". Never imported by
// the SDK itself and not part of the published types.
import "./styles/preview.css";
