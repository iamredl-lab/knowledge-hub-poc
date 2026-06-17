import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@collab-docs/vitest-base/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
    },
  }),
);
