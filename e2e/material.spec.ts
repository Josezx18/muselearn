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
  for (const formato of ["Diapositivas", "Mapa conceptual", "Infografía"]) {
    await seccion.getByRole("button", {name: `✦ ${formato}`, exact:true}).click();
    await expect(seccion.getByRole("heading", {name:formato, exact:true})).toBeVisible();
    await expect(seccion.getByText("Borrador: solo lo ve el docente")).toBeVisible();
  }
  await seccion.getByText("Editar Diapositivas", {exact:true}).click();
  const editor = seccion.getByRole("region",{name:"Diapositivas",exact:true});
  await editor.getByRole("textbox",{name:"Título",exact:true}).first().fill("La igualdad revisada");
  await seccion.getByRole("button",{name:"Guardar ediciones"}).click();
  await expect(editor.getByRole("heading",{name:"La igualdad revisada"})).toBeVisible();
  await seccion.getByText("Editar Diapositivas", {exact:true}).click();
  await page.screenshot({path:test.info().outputPath("formatos-docente.png"),fullPage:true});
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
  const diapositivas = seccion.getByRole("region",{name:"Diapositivas",exact:true});
  await expect(diapositivas.getByText("1 / 5",{exact:true})).toBeVisible();
  await diapositivas.getByRole("button",{name:"Siguiente",exact:true}).click();
  await expect(diapositivas.getByText("2 / 5",{exact:true})).toBeVisible();
  await diapositivas.getByRole("group").focus();
  await page.keyboard.press("ArrowRight");
  await expect(diapositivas.getByText("3 / 5",{exact:true})).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await diapositivas.getByRole("button",{name:"Anterior",exact:true}).click();
  await expect(diapositivas.getByText("1 / 5",{exact:true})).toBeVisible();
  await diapositivas.getByRole("button",{name:"Pantalla completa",exact:true}).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.evaluate(() => document.exitFullscreen());
  await expect(seccion.getByRole("region",{name:"Mapa conceptual",exact:true})).toBeVisible();
  await expect(seccion.getByRole("region",{name:"Infografía",exact:true})).toBeVisible();
  await page.evaluate(() => { window.print = () => { document.documentElement.setAttribute("data-print-tested",String(document.querySelectorAll('[data-imprimiendo]').length)); }; });
  for (const formato of ["Diapositivas", "Mapa conceptual", "Infografía"]) {
    await seccion.getByRole("region",{name:formato,exact:true}).getByRole("button",{name:"Imprimir / Guardar PDF"}).click();
    await expect(page.locator("html")).toHaveAttribute("data-print-tested","1");
    await expect(page.locator("[data-imprimiendo]")).toHaveCount(0);
  }
  await page.emulateMedia({media:"print"});
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-material-imprimir", "prueba");
    document.querySelector('[data-material-formato$="-diapositivas"]')?.setAttribute("data-imprimiendo", "");
  });
  // Al imprimir, todas las diapositivas se muestran (una por página), no solo la actual.
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll(".material-diapositiva")].every((e) => getComputedStyle(e).display !== "none"))).toBe(true);
  await expect(seccion.getByRole("button",{name:"Siguiente",exact:true})).toBeHidden();
  await expect(page.getByRole("heading",{name:"Instrucciones",exact:true})).toBeHidden();
  await page.screenshot({path:test.info().outputPath("diapositivas-impresion.png"),fullPage:true});
  await page.evaluate(() => {
    document.documentElement.removeAttribute("data-material-imprimir");
    document.querySelector("[data-imprimiendo]")?.removeAttribute("data-imprimiendo");
  });
  await page.emulateMedia({media:"screen"});
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
