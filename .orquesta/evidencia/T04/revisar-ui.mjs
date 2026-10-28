// node .orquesta/evidencia/T04/revisar-ui.mjs (Next con mocks en puerto 3004).
import { chromium, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const resultados = [];
try {
  for (const width of [380, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errores = [];
    page.on("pageerror", error => errores.push(error.message));
    const base = "http://localhost:3004/es/estudiante/tarea/00000000-0000-4000-8000-000000000201";
    await page.goto(`${base}/tutor`);
    await page.getByRole("button", { name: "Necesito una pista" }).click();
    await page.getByRole("log").getByText("Buena pregunta.", { exact: false }).waitFor();
    await expect(page.getByRole("button", { name: "Necesito una pista" })).toBeEnabled();
    await page.screenshot({ path: `src/components/verificacion/tutor-${width}.png`, fullPage: true });
    const anchoTutor = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    await page.goto(`${base}/verificar?entrega_id=00000000-0000-4000-8000-000000000301`);
    await page.getByRole("button", { name: "Empezar", exact: true }).click();
    await page.getByRole("textbox", { name: "Tu explicación" }).waitFor();
    await page.screenshot({ path: `src/components/verificacion/verificacion-${width}.png`, fullPage: true });
    const anchoVerificacion = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    for (const respuesta of ["Resto en ambos lados para mantener la igualdad.", "Resto cinco y divido entre tres.", "Sustituyo en la ecuación original y compruebo la igualdad."]) {
      await page.getByRole("textbox", { name: "Tu explicación" }).fill(respuesta);
      await page.getByRole("button", { name: "Enviar explicación", exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('button[aria-busy="true"]'));
    }
    await page.waitForURL("**/estudiante/informe/00000000-0000-4000-8000-000000000301");
    resultados.push({ width, anchoTutor, anchoVerificacion, redireccion: true, errores });
    if (!anchoTutor || !anchoVerificacion || errores.length) throw new Error(JSON.stringify(resultados));
    await page.close();
  }
} finally {
  writeFileSync(".orquesta/evidencia/T04/resultados-ui.json", JSON.stringify(resultados, null, 2));
  await browser.close();
}
