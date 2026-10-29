import { expect, test } from "@playwright/test";

// Cuenta (menú, perfil, configuración) y gestión del docente, con los datos de demo (NEXT_PUBLIC_USAR_MOCKS=true).
const CLASE = "/es/docente/clases/00000000-0000-4000-8000-000000000101";
const TAREA = "/es/docente/tareas/00000000-0000-4000-8000-000000000201";

test.describe("cuenta", () => {
  test("el menú de la cuenta lleva a Mi perfil y a Configuración", async ({ page }) => {
    await page.goto("/es/estudiante/hoy");
    await page.getByRole("button", { name: "Menú de la cuenta" }).click();
    await page.getByRole("menuitem", { name: "Mi perfil" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Mi perfil" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mis clases" })).toBeVisible();
    await page.getByRole("button", { name: "Menú de la cuenta" }).click();
    await page.getByRole("menuitem", { name: "Configuración" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Configuración" })).toBeVisible();
  });

  test("elegir mascota y colores cambia la app al momento", async ({ page }) => {
    await page.goto("/es/estudiante/configuracion");
    await page.getByRole("radio", { name: /Orbi/ }).click();
    await page.getByRole("radio", { name: /Azul Meta/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mascota", "orbi");
    await expect(page.locator("html")).toHaveAttribute("data-tema", "meta");
    await expect(page.getByRole("heading", { name: "Mis horas de estudio" })).toBeVisible();
  });
});

test.describe("gestión del docente", () => {
  test("la clase muestra el código y sus estudiantes; borrar pide escribir el nombre", async ({ page }) => {
    await page.goto(CLASE);
    await expect(page.getByText("Código para unirse")).toBeVisible();
    await page.getByRole("tab", { name: "Estudiantes" }).click();
    await expect(page.getByRole("button", { name: "Quitar" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Borrar clase" }).click();
    const definitivo = page.getByRole("button", { name: "Borrar para siempre" });
    await expect(definitivo).toBeDisabled();
    await page.getByLabel("Para confirmar, escribe el nombre de la clase:").fill("Matemática 4to A");
    await expect(definitivo).toBeEnabled();
  });

  test("la tarea se puede editar y el docente ve la entrega completa", async ({ page }) => {
    await page.goto(TAREA);
    await expect(page.getByRole("button", { name: "Editar tarea" })).toBeVisible();
    await page.getByRole("button", { name: "Ver entrega" }).first().click();
    await expect(page.getByRole("heading", { name: "Lo que escribió" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Verificación" })).toBeVisible();
  });
});
