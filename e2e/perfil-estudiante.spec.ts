import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const clase = "00000000-0000-4000-8000-000000000101";
const estudiante = "00000000-0000-4000-8000-000000000011";
test("clase a perfil: resumen, conceptos e historial a 360 px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/es/docente/clases/${clase}`);
    await page.getByRole("tab", { name: "Estudiantes" }).click();
    await page.getByRole("link", { name: /Camila Pérez/ }).click();
    await expect(page).toHaveURL(new RegExp(`/estudiantes/${estudiante}$`));
    await expect(page.getByRole("heading", { name: "Camila Pérez" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resumen del estudiante" })).toBeVisible();
    await expect(page.getByText("Tareas entregadas / total", { exact: true })).toBeVisible();
    await expect(page.getByText("3 / 4", { exact: true })).toBeVisible();
    await expect(page.getByText("25 %", { exact: true })).toBeVisible();
    await expect(page.getByText("88", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Semáforo con Arduino" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Comprensión por concepto" })).toBeVisible();
    await expect(page.getByText("Operaciones inversas", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial de tareas" })).toBeVisible();
    const tarea = page.getByRole("link", { name: "Práctica: ecuaciones de primer grado" });
    await expect(tarea).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accesibilidad = await new AxeBuilder({ page }).include("main").analyze();
    expect(accesibilidad.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
    await page.screenshot({ path: "test-results/perfil-360.png", fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: "test-results/perfil-1280.png", fullPage: true });
    await tarea.click();
    await expect(page).toHaveURL(/docente\/tareas\//);
});

test("historial de devolución y clase sin informes", async ({ page }) => {
    await page.goto(`/es/docente/clases/${clase}/estudiantes/00000000-0000-4000-8000-000000000020`);
    await expect(page.getByText(/^Devuelta para corregir/)).toBeVisible();
    await expect(page.getByText("40", { exact: true })).toBeVisible();
    await page.goto(`/es/docente/clases/00000000-0000-4000-8000-000000000102/estudiantes/${estudiante}`);
    await expect(page.getByText("Sin informe de comprensión", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Sin dato", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Práctica: ecuaciones de primer grado" })).toHaveCount(0);
});
test("perfil inglés y rutas desconocidas", async ({ page }) => {
    await page.goto(`/en/docente/clases/${clase}/estudiantes/${estudiante}`);
    await expect(page.getByRole("heading", { name: "Assignment history" })).toBeVisible();
    await page.goto(`/es/docente/clases/${clase}/estudiantes/00000000-0000-4000-8000-000000000999`);
    await expect(page.getByRole("heading", { name: "Camila Pérez" })).toHaveCount(0);
    await page.goto(`/es/docente/clases/00000000-0000-4000-8000-000000000999/estudiantes/${estudiante}`);
    await expect(page.getByRole("heading", { name: "Camila Pérez" })).toHaveCount(0);
});
