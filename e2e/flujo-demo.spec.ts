import { expect, test, type Page } from "@playwright/test";

// Flujo completo de la demo con datos de ejemplo (NEXT_PUBLIC_USAR_MOCKS=true).
// Corre en escritorio y en celular (ver playwright.config.ts). T07.

const TAREA = "00000000-0000-4000-8000-000000000201";
const ENTREGA = "00000000-0000-4000-8000-000000000301";

async function sinScrollHorizontal(page: Page) {
  const sobrante = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sobrante).toBeLessThanOrEqual(0);
}

function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  return errores;
}

test.describe("estudiante", () => {
  test("Hoy muestra lo próximo, avisos y entregas", async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto("/es/estudiante/hoy");
    await expect(page.getByRole("heading", { name: "Lo próximo que te toca" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Entregas próximas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reorganizar mi semana" })).toBeEnabled();
    await sinScrollHorizontal(page);
    expect(errores).toEqual([]);
  });

  test("tarea → tutor con pista", async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto(`/es/estudiante/tarea/${TAREA}`);
    await expect(page.getByRole("heading", { name: "Instrucciones" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Entregar tarea" })).toBeVisible();
    await page.getByRole("link", { name: "Pedir ayuda al tutor" }).click();
    await expect(page).toHaveURL(new RegExp(`/estudiante/tarea/${TAREA}/tutor$`));
    await page.getByRole("button", { name: "Necesito una pista" }).click();
    await expect(page.getByRole("log").getByText("Buena pregunta.", { exact: false })).toBeVisible();
    await sinScrollHorizontal(page);
    expect(errores).toEqual([]);
  });

  test("verificación de 3 preguntas → informe con ruta de práctica", async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto(`/es/estudiante/tarea/${TAREA}/verificar?entrega_id=${ENTREGA}`);
    await expect(page.getByRole("heading", { name: "Explícamelo" })).toBeVisible();
    await page.getByRole("button", { name: "Empezar", exact: true }).click();
    const caja = page.getByRole("textbox", { name: "Tu explicación" });
    for (const respuesta of [
      "Resto en ambos lados para mantener la igualdad.",
      "Resto cinco y divido entre tres.",
      "Sustituyo en la ecuación original y compruebo la igualdad.",
    ]) {
      await caja.fill(respuesta);
      await page.getByRole("button", { name: "Enviar explicación", exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('button[aria-busy="true"]'));
    }
    await page.waitForURL(`**/estudiante/informe/${ENTREGA}`);
    await expect(page.getByRole("heading", { name: "Tu comprensión" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tu ruta de práctica" })).toBeVisible();
    await sinScrollHorizontal(page);
    expect(errores).toEqual([]);
  });
});

test.describe("docente", () => {
  test("panel de comprensión: entregó vs. comprendió y mapa de calor", async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto("/es/docente/comprension");
    await expect(page.getByRole("heading", { name: "Comprensión de la clase" })).toBeVisible();
    await expect(page.getByText("Entregó")).toBeVisible();
    await expect(page.getByText("Demostró comprensión")).toBeVisible();
    const mapa = page.getByRole("region", { name: "Comprensión de la clase" });
    await expect(mapa.getByRole("table")).toBeVisible();
    // El detalle por estudiante aparece al tocar su nombre.
    await mapa.getByRole("rowheader").first().getByRole("button").click();
    await expect(page.getByRole("heading", { name: "Detalle por estudiante" })).toBeVisible();
    await sinScrollHorizontal(page);
    expect(errores).toEqual([]);
  });

  test("la clase muestra sus tareas y el formulario de nueva tarea", async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto("/es/docente/clases");
    await page.getByRole("link").filter({ hasText: "Matemática" }).first().click();
    await expect(page.getByRole("heading", { name: "Tareas" })).toBeVisible();
    await page.getByRole("button", { name: "Nueva tarea" }).click();
    await expect(page.getByRole("heading", { name: "Crear nueva tarea" })).toBeVisible();
    await sinScrollHorizontal(page);
    expect(errores).toEqual([]);
  });
});
