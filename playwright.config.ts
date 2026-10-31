import { defineConfig, devices } from "@playwright/test";

// Un puerto propio impide reutilizar por accidente el servidor de otro worktree.
const puerto = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
if (!Number.isInteger(puerto) || puerto < 1024 || puerto > 65535) throw new Error("PLAYWRIGHT_PORT invalido");
const urlBase = `http://localhost:${puerto}`;

// Pruebas de extremo a extremo. Antes de la primera vez: npx playwright install chromium
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: urlBase,
    trace: "on-first-retry",
    locale: "es-DO", // la app detecta el idioma del navegador; las pruebas esperan español
    // Opcional: usar un Chromium ya instalado en vez del que descarga Playwright.
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: `npm run dev -- --port ${puerto}`,
    url: `${urlBase}/es`,
    reuseExistingServer: !process.env.PLAYWRIGHT_PORT,
    timeout: 120_000,
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
});
