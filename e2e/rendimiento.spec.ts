import { test, expect } from "@playwright/test";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import type { Flags } from "lighthouse";

// Lighthouse móvil ≥ 85 en Hoy, Tarea y Comprensión (T20).
// Ejecuta con: npx playwright test e2e/rendimiento.spec.ts

const URL_BASE = process.env.LH_URL ?? "http://localhost:3000";
const RUTAS = [
  { nombre: "Hoy", ruta: "/es/estudiante/hoy", umbral: 85 },
  { nombre: "Tarea", ruta: "/es/estudiante/tarea/00000000-0000-4000-8000-000000000201", umbral: 85 },
  { nombre: "Comprensión", ruta: "/es/docente/comprension", umbral: 85 },
];

const lighthouseFlags: Flags = {
  output: "json",
  onlyCategories: ["performance", "accessibility"],
  formFactor: "mobile",
  screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleFactor: 2, disabled: false },
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
    requestLatencyMs: 150,
    downloadThroughputKbps: 1638.4,
    uploadThroughputKbps: 675,
  },
};

async function medirLighthouse(url: string, puerto: number) {
  const resultado = await lighthouse(url, {
    ...lighthouseFlags,
    port: puerto,
  });
  if (!resultado?.lhr) {
    throw new Error("Lighthouse no devolvió resultados");
  }
  const p = resultado.lhr.categories.performance?.score ?? 0;
  const a = resultado.lhr.categories.accessibility?.score ?? 0;
  return { performance: Math.round(p * 100), accessibility: Math.round(a * 100) };
}

test.describe("Lighthouse móvil (T20)", () => {
  let chrome: Awaited<ReturnType<typeof launch>>;

  test.beforeAll(async () => {
    chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] });
  });

  test.afterAll(async () => {
    await chrome.kill();
  });

  for (const { nombre, ruta, umbral } of RUTAS) {
    test(`${nombre} ≥ ${umbral} Performance, Accessibility 100`, async () => {
      const url = `${URL_BASE}${ruta}`;
      const { performance, accessibility } = await medirLighthouse(url, chrome.port!);
      console.log(`[${nombre}] Performance: ${performance}, Accessibility: ${accessibility}`);
      expect(performance).toBeGreaterThanOrEqual(umbral);
      expect(accessibility).toBe(100);
    });
  }
});