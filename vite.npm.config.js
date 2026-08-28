import { resolve } from "path";
import { defineConfig } from "vite";

// Package build (ESM only). The UMD bundle for script-tag integrations is
// built by vite.config.js, from the same source, and its output is unchanged.
//
// The stylesheet is a separate entry so that src/index.ts stays free of the
// CSS side-effect import: tsc copies import specifiers verbatim into the
// emitted .d.ts, and a CSS import there does not resolve for consumers. Vite's
// lib mode wants a JS entry, so src/styles.ts is a one-line shim whose empty
// JS chunk is discarded below; only styles.css survives.
export default defineConfig({
  build: {
    outDir: "dist-npm",
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        styles: resolve(__dirname, "src/styles.ts"),
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === "style.css" ? "styles.css" : assetInfo.name,
      },
    },
  },
  plugins: [
    {
      name: "drop-styles-shim-chunk",
      enforce: "post",
      generateBundle(_options, bundle) {
        delete bundle["styles.js"];
      },
    },
  ],
});
