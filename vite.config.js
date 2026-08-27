import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/main.ts"),
      name: "PulsateWebSDK",
      // the proper extensions will be added
      fileName: "web-sdk",
      formats: ["umd"],
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "web-sdk.css";
          return assetInfo.name;
        },
      },
    },
  },
});
