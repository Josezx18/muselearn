import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const tipo of ["entregas", "comprension"] as const) {
  test(`descarga ${tipo} en CSV`, async ({ page }) => {
    await page.setViewportSize({ width: test.info().project.name === "celular" ? 380 : 1280, height: 850 });
    await page.goto(tipo === "entregas" ? "/es/docente/clases/00000000-0000-4000-8000-000000000101" : "/es/docente/comprension");
    const boton = page.getByRole("button", { name: tipo === "entregas" ? "Descargar entregas (CSV)" : "Descargar comprensión (CSV)", exact: true });
    await expect(boton).toBeEnabled();
    const descarga = page.waitForEvent("download");
    await boton.click();
    const archivo = await descarga;
    expect(archivo.suggestedFilename()).toMatch(new RegExp(`^muselearn-[a-z0-9-]+-${tipo}-\\d{4}-\\d{2}-\\d{2}\\.csv$`));
    const contenido = await readFile((await archivo.path())!);
    expect([...contenido.subarray(0, 3)]).toEqual([239, 187, 191]);
    expect(contenido.toString("utf8")).toContain(tipo === "entregas" ? '"Fecha de entrega"' : '"Promedio"');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
