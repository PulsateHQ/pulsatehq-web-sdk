import { resolve } from "path";
import { defineConfig } from "vite";

// Package build. The UMD bundle for script-tag integrations is built by
// vite.config.js, from the same source, and its output is unchanged.
export default defineConfig({
  build: {
    outDir: "dist-npm",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === "style.css" ? "styles.css" : assetInfo.name,
      },
    },
  },
});
