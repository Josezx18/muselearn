// Requiere el servidor iniciado con NEXT_PUBLIC_USAR_MOCKS=true en localhost:3015.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const carpeta = join(tmpdir(), "muselearn-t15-capturas");
await mkdir(carpeta, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [380, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, locale: "es-DO" });
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    for (const [nombre, ruta] of [
      ["hoy", "/es/estudiante/hoy"], ["semana", "/es/estudiante/semana"],
      ["general", "/es/docente/comprension?clase_id=00000000-0000-4000-8000-000000000101"],
    ]) {
      await page.goto(`http://localhost:3015${ruta}`);
      await page.getByRole("heading", { level: 1 }).waitFor();
      await page.waitForTimeout(1500);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${nombre} desborda a ${width}px`);
      if (nombre === "general") {
        assert.ok((await page.locator("body").innerText()).includes("Camila"));
        assert.ok((await page.locator("body").innerText()).includes("Sofía"));
      }
      await page.screenshot({ path: join(carpeta, `${nombre}-${width}.png`), fullPage: true });
    }
    assert.deepEqual(errores, []);
    await page.close();
  }
} finally { await browser.close(); }
console.log(`OK: Hoy, Semana y General a 380/1280 px. Capturas: ${carpeta}`);
