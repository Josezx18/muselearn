import { defineConfig, devices } from "@playwright/test";

// Pruebas de extremo a extremo. Antes de la primera vez: npx playwright install chromium
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/es",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
});
