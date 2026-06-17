import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@collab-docs/vitest-base/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: ["@collab-docs/vitest-base/setup"],
    },
  }),
);
