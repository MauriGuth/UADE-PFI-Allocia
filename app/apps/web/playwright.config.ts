import { defineConfig } from "@playwright/test";

// Las pruebas e2e corren contra un `next start` real y la API real del
// producto (API_URL). Requieren la cuenta demo sembrada con `seed.ts`.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : undefined,
  },
});
