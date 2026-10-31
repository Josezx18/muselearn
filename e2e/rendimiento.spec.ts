import { execSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import type { Flags } from "lighthouse";

// Lighthouse móvil ≥ 85 en Hoy, Tarea y Comprensión (T20).
//
// Mide SIEMPRE un build de producción con mocks, nunca el servidor `next dev`:
//   npx playwright test --config=playwright.lighthouse.config.ts
//
// El spec levanta `npm run build` y `npm run start -p 3100` con NEXT_PUBLIC_USAR_MOCKS=true.
// Si defines LH_URL (p. ej. una instancia de producción ya desplegada), mide esa URL y no levanta nada.
// Respeta el Chrome instalado vía chrome-launcher (o CHROME_PATH). Sin dependencias nuevas.

const PUERTO = 3100;
const URL_BASE = process.env.LH_URL ?? `http://localhost:${PUERTO}`;
const AUTOGESTION = !process.env.LH_URL && process.env.LH_SELF_HOST === "1";
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

const entornoMocks = { ...process.env, NEXT_PUBLIC_USAR_MOCKS: "true" };

async function esperarServidor(url: string, timeoutMs = 90_000) {
  const fin = Date.now() + timeoutMs;
  while (Date.now() < fin) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // aún arrancando
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`El servidor de producción no respondió en ${url}`);
}

async function medirLighthouse(url: string, puerto: number) {
  const resultado = await lighthouse(url, { ...lighthouseFlags, port: puerto });
  if (!resultado?.lhr) {
    throw new Error("Lighthouse no devolvió resultados");
  }
  const p = resultado.lhr.categories.performance?.score ?? 0;
  const a = resultado.lhr.categories.accessibility?.score ?? 0;
  return { performance: Math.round(p * 100), accessibility: Math.round(a * 100), reporte: resultado.lhr };
}

test.describe("Lighthouse móvil (T20)", () => {
  test.skip(
    !AUTOGESTION && !process.env.LH_URL,
    "Ejecuta con --config=playwright.lighthouse.config.ts (build+start con mocks) o define LH_URL.",
  );

  let chrome: Awaited<ReturnType<typeof launch>>;
  let servidor: ChildProcess | null = null;

  test.beforeAll(async () => {
    if (AUTOGESTION) {
      // Build de producción con mocks (explícito, no `next dev`).
      execSync("npm run build", { stdio: "inherit", env: entornoMocks });
      const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
      servidor = spawn(process.execPath, [nextBin, "start", "-p", String(PUERTO)], {
        stdio: "ignore",
        env: entornoMocks,
      });
      await esperarServidor(`${URL_BASE}/es`);
    }

    chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] });
  });

  test.afterAll(async () => {
    await chrome?.kill();
    if (servidor?.pid) {
      try {
        if (process.platform === "win32") execSync(`taskkill /PID ${servidor.pid} /T /F`);
        else process.kill(servidor.pid, "SIGTERM");
      } catch {
        // el proceso ya terminó
      }
    }
  });

  for (const { nombre, ruta, umbral } of RUTAS) {
    test(`${nombre} ≥ ${umbral} Performance, Accessibility 100`, async () => {
      const url = `${URL_BASE}${ruta}`;
      // La mediana de cinco ejecuciones reduce la variabilidad de CPU sin cambiar el umbral.
      // https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md
      const muestras: Awaited<ReturnType<typeof medirLighthouse>>[] = [];
      for (let i = 0; i < 5; i++) {
        const muestra = await medirLighthouse(url, chrome.port!);
        muestras.push(muestra);
        console.log(`[${nombre} ${i + 1}/5] Performance: ${muestra.performance}, Accessibility: ${muestra.accessibility}, CPU: ${muestra.reporte.environment.benchmarkIndex}`);
      }
      const performance = muestras.map((m) => m.performance).sort((a, b) => a - b)[2];
      const accessibility = Math.min(...muestras.map((m) => m.accessibility));
      console.log(`[${nombre}] Mediana Performance: ${performance}, Accessibility mínima: ${accessibility}`);

      // Evidencia: guarda las puntuaciones medidas.
      const carpeta = join(process.cwd(), "test-results", "lighthouse");
      mkdirSync(carpeta, { recursive: true });
      writeFileSync(
        join(carpeta, `${nombre}.json`),
        JSON.stringify({ nombre, url, performance, accessibility, metodo: "mediana de 5 ejecuciones; accesibilidad mínima de las 5", fecha: new Date().toISOString(), muestras }, null, 2),
      );

      expect(performance).toBeGreaterThanOrEqual(umbral);
      expect(accessibility).toBe(100);
    });
  }
});
