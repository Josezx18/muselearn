import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const tarea = "00000000-0000-4000-8000-000000000201";
test("docente crea, edita, publica; estudiante repasa y escucha", async ({ page }, info) => {
  if (info.project.name === "celular") await page.setViewportSize({ width: 360, height: 780 });
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => [], addEventListener: () => {}, removeEventListener: () => {}, cancel: () => {},
      speak: (u: SpeechSynthesisUtterance) => { document.documentElement.dataset.narrado = u.text; u.onstart?.(new SpeechSynthesisEvent("start", { utterance: u })); },
    } });
  });
  await page.goto(`/es/docente/tareas/${tarea}`);
  const seccion = page.getByRole("region", { name: "Material de estudio" });
  await seccion.getByRole("button", { name: "Crear con Muse Spark" }).click();
  await expect(seccion.getByText("Borrador: solo lo ve el docente")).toBeVisible();
  await seccion.getByLabel("Título", { exact: true }).first().fill("Mi repaso revisado");
  await seccion.getByRole("button", { name: "Guardar ediciones" }).click();
  await expect(seccion.getByText("Cambios guardados.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).include('section[aria-labelledby]').analyze()).violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("material-docente.png"), fullPage: true });
  await page.goto(`/es/estudiante/tarea/${tarea}`);
  await expect(page.getByRole("heading", { name: "Instrucciones", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Material de estudio" })).toHaveCount(0);
  await page.goto(`/es/docente/tareas/${tarea}`);
  await seccion.getByRole("button", { name: "Publicar para la clase" }).click();
  await expect(seccion.getByText("Publicado para la clase", { exact: true })).toBeVisible();
  await page.goto(`/es/estudiante/tarea/${tarea}`);
  await expect(seccion.getByRole("heading", { name: "Mi repaso revisado" })).toBeVisible();
  await seccion.getByText("¿Por qué operar en ambos miembros?", { exact: true }).click();
  await expect(seccion.getByText("Para conservar la igualdad entre las dos cantidades.", { exact: true })).toBeVisible();
  await seccion.getByRole("button", { name: "Escuchar repaso" }).click();
  await expect(seccion.getByRole("button", { name: "Detener" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.narrado)).toContain("Imagina una balanza");
  await seccion.getByRole("button", { name: "Detener" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).include('section[aria-labelledby]').analyze()).violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("material.png"), fullPage: true });
  await page.goto(`/es/docente/tareas/${tarea}`);
  await seccion.getByRole("button", { name: "Ocultar", exact: true }).click();
  await expect(seccion.getByText("Borrador: solo lo ve el docente")).toBeVisible();
  await page.goto(`/es/estudiante/tarea/${tarea}`);
  await expect(page.getByRole("heading", { name: "Instrucciones", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Material de estudio" })).toHaveCount(0);
  await page.goto(`/es/docente/tareas/${tarea}`);
  await seccion.getByRole("button", { name: "Crear otro" }).click();
  await expect(seccion.getByLabel("Título", { exact: true }).first()).toHaveValue("Repaso de ecuaciones");
  await seccion.getByRole("button", { name: "Eliminar material" }).click();
  await expect(seccion.getByRole("button", { name: "Crear con Muse Spark" })).toBeEnabled();
  await page.reload();
  await expect(seccion.getByRole("button", { name: "Crear con Muse Spark" })).toBeEnabled();
});
