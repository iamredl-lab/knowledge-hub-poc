import { defineConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
