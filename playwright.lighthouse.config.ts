import { defineConfig, devices } from "@playwright/test";

// Config dedicada a Lighthouse (T20): mide un build de producción con mocks, no `next dev`.
// Uso: npx playwright test --config=playwright.lighthouse.config.ts
// El propio spec hace `npm run build` y `npm run start -p 3100` (ver e2e/rendimiento.spec.ts).
process.env.LH_SELF_HOST = "1";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /rendimiento\.spec\.ts/,
  timeout: 300_000,
  workers: 1,
  reporter: "line",
  use: {
    ...devices["Pixel 7"],
    locale: "es-DO",
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [{ name: "celular", use: { ...devices["Pixel 7"] } }],
});
