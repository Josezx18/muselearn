import { test, expect } from "@playwright/test";
const ruta = "/es/docente/tareas/00000000-0000-4000-8000-000000000201";
test("revisión amplia, navegación, visor y borradores IA sin guardado automático", async ({ page }, info) => {
  if (info.project.name === "celular") await page.setViewportSize({ width: 360, height: 800 });
  const errores: string[] = []; page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(ruta);
  await page.getByRole("button", { name: "Ver entrega", exact: true }).first().click();
  let dialogo = page.getByRole("dialog");
  await expect(dialogo.getByRole("spinbutton")).toBeEnabled();
  if (info.project.name === "escritorio") expect((await dialogo.boundingBox())!.width).toBeGreaterThan(1000);
  const inicial = await dialogo.getByRole("heading", { level: 2 }).innerText();
  await dialogo.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(dialogo.getByRole("heading", { level: 2 })).not.toHaveText(inicial);
  await page.keyboard.press("ArrowLeft");
  await expect(dialogo.getByRole("heading", { level: 2 })).toHaveText(inicial);
  await dialogo.getByRole("button", { name: "cuaderno-demo.svg", exact: true }).click();
  const visor = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Visor de imagen" }) });
  await expect(visor).toBeVisible();
  await visor.getByRole("button", { name: "Ajustar / tamaño real", exact: true }).first().click();
  await page.keyboard.press("Escape"); await expect(visor).not.toBeVisible();
  dialogo = page.getByRole("dialog"); await expect(dialogo).toBeVisible();
  const nota = dialogo.getByRole("spinbutton"); await expect(nota).toBeEnabled();
  const anterior = await nota.inputValue();
  await dialogo.getByRole("button", { name: "Revisar con IA", exact: true }).click();
  await expect(dialogo.getByText("Cumple parcialmente", { exact: true }).first()).toBeVisible();
  await expect(nota).toHaveValue(anterior);
  await dialogo.getByRole("button", { name: "Usar la nota sugerida", exact: true }).click();
  await expect(nota).toHaveValue("75");
  await dialogo.getByRole("button", { name: "Pasar sugerencias al comentario", exact: true }).click();
  await expect(dialogo.getByRole("textbox", { name: "Comentario para el estudiante" })).toHaveValue(/Explica por qué/);
  await dialogo.getByRole("button", { name: "Actualizar entregas", exact: true }).click();
  await expect(nota).toHaveValue("75");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await dialogo.evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(true);
  await expect(dialogo.getByRole("heading", { level: 2 })).toBeInViewport();
  await page.screenshot({ path: info.outputPath("revision.png") });
  await dialogo.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.getByRole("button", { name: "Ver entrega", exact: true }).first().click();
  await expect(page.getByRole("dialog").getByRole("spinbutton")).toHaveValue(anterior);
  expect(errores).toEqual([]);
});


test("refresca al volver y cada treinta segundos conservando entrega y borrador", async ({ page }) => {
  await page.clock.install();
  await page.goto(ruta);
  await page.getByRole("button", { name: "Ver entrega", exact: true }).first().click();
  const dialogo = page.getByRole("dialog");
  const nota = dialogo.getByRole("spinbutton"); await expect(nota).toBeEnabled(); await nota.fill("63");
  const titulo = await dialogo.getByRole("heading", { level: 2 }).innerText();
  await nota.press("ArrowLeft");
  await expect(dialogo.getByRole("heading", { level: 2 })).toHaveText(titulo);
  const actualizar = async (estado: "entregada" | "verificada") => page.evaluate((estado) => {
    localStorage.setItem("muselearn-t09-calificaciones-entregas", JSON.stringify([{
      id: "00000000-0000-4000-8000-000000000301", tarea_id: "00000000-0000-4000-8000-000000000201",
      estudiante_id: "00000000-0000-4000-8000-000000000011", contenido_texto: "Trabajo actualizado", adjuntos: [],
      estado, entregada_en: "2026-11-03T18:00:00Z", entregada_externamente: false,
    }]));
    localStorage.setItem("muselearn-t09-calificaciones", JSON.stringify(Array.from({ length: 12 }, (_, i) => ({
      entrega_id: `00000000-0000-4000-8000-${String(i === 0 ? 301 : 310 + i).padStart(12, "0")}`,
      docente_id: "00000000-0000-4000-8000-000000000001", nota: i === 0 ? null : 90,
      devuelta: false, motivo_devolucion: null, actualizado_en: "2026-11-03T18:00:00Z",
    }))));
  }, estado);
  await actualizar("entregada");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(dialogo.getByRole("button", { name: /Camila.*Estado: Entregada/ })).toBeVisible();
  await expect(nota).toHaveValue("63");
  await actualizar("verificada"); await page.clock.runFor(31_000);
  await expect(dialogo.getByRole("button", { name: /Camila.*Estado: Verificada/ })).toBeVisible();
  await expect(nota).toHaveValue("63"); await expect(dialogo.getByRole("heading", { level: 2 })).toHaveText(titulo);
  await dialogo.getByRole("button", { name: "Siguiente", exact: true }).click();
  await dialogo.getByRole("button", { name: "Siguiente sin calificar", exact: true }).click();
  await expect(dialogo.getByRole("heading", { level: 2 })).toHaveText(titulo);
});
