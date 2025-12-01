import { defineConfig } from "vitest/config";
import { vitePlugin as remix } from "@remix-run/dev";
import path from "path";

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
    }),
  ],
  test: {
    globals: true,
    environment: "node", // Use node environment for server-side tests
    setupFiles: ["./app/test-setup.ts"],
    pool: "forks", // Use forks pool for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Run in single fork for server tests
      },
    },
    include: [
      "app/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/.git/**",
      "tests/e2e/**", // E2E tests run with Playwright
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "app/test-setup.ts",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
        "**/*.test.{js,ts,tsx}",
        "**/*.spec.{js,ts,tsx}",
        "prisma/",
        "build/",
        "public/",
        "scripts/",
      ],
      include: [
        "app/**/*.{js,jsx,ts,tsx}",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
      "~/": path.resolve(__dirname, "./app"),
    },
  },
});

