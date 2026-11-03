import { expect, test } from "@playwright/test";

// IA para el docente con los datos de demo (NEXT_PUBLIC_USAR_MOCKS=true): proponer una tarea,
// sugerir un repaso y escribir el comentario de una entrega.
const CLASE = "/es/docente/clases/00000000-0000-4000-8000-000000000101";
const TAREA = "/es/docente/tareas/00000000-0000-4000-8000-000000000201";

test("la IA propone una tarea y llena el formulario", async ({ page }) => {
  await page.goto(CLASE);
  await page.getByRole("button", { name: "Nueva tarea" }).click();
  await page.getByRole("button", { name: "Crear la tarea con IA" }).click();
  await page.getByLabel("¿Qué quieres que practiquen?").fill("ecuaciones con fracciones");
  await page.getByRole("button", { name: "Proponer tarea" }).click();
  await expect(page.getByText(/Listo: llené el formulario/)).toBeVisible();
  await expect(page.locator("#titulo")).toHaveValue(/ecuaciones con fracciones/);
  await expect(page.locator("#instrucciones")).toHaveValue(/cuaderno/);
  await page.getByRole("button", { name: /Revisar y guardar/ }).click();
  await expect(page.locator("#guardarTarea")).toBeFocused();
});

test("la IA sugiere un repaso desde el panel de comprensión", async ({ page }) => {
  await page.goto("/es/docente/comprension");
  const boton = page.getByRole("button", { name: "Sugerir repaso" });
  await expect(boton).toBeEnabled();
  await boton.click();
  await expect(page.getByText("Es una sugerencia: adáptala a tu grupo.")).toBeVisible();
  await expect(page.getByText("En grupos").first()).toBeVisible();
  await page.getByRole("button", { name: "Asignar como tarea" }).first().click();
  await page.getByRole("button", { name: "Asignar", exact: true }).click();
  await expect(page.getByText("Tarea asignada a la clase.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver tarea" })).toBeVisible();
});

test("el docente pide un borrador de comentario, lo edita y lo envía", async ({ page }) => {
  await page.goto(TAREA);
  await page.getByRole("button", { name: "Ver entrega" }).first().click();
  await page.getByRole("button", { name: "Otro borrador", exact: true }).click();
  const campo = page.getByRole("textbox", { name: "Comentario para el estudiante" });
  await expect(campo).toHaveValue(/Explicaste/);
  await campo.fill("¡Buen trabajo! Revisa el paso 3.");
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  await expect(page.getByText("Comentario enviado.", { exact: true })).toBeVisible();
});

test("las tareas se filtran por clase y muestran cuáles se hicieron con IA", async ({ page }) => {
  await page.goto("/es/docente/tareas");
  const selector = page.getByLabel("Clase");
  await selector.selectOption({ label: "Tecnología 4to B" });
  await expect(page.getByRole("heading", { name: "Semáforo con Arduino" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Repaso de fracciones" })).toHaveCount(0);
  await selector.selectOption({ label: "Matemática 4to A" });
  await expect(page.getByText("Creada con IA")).toBeVisible();
});
