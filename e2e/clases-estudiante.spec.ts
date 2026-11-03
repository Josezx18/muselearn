import { expect, test, type Page } from "@playwright/test";

// Mis clases del estudiante: abrir Clases, entrar a una clase y abrir una tarea (T23).
// Corre con mocks (NEXT_PUBLIC_USAR_MOCKS=true).

const ID_TECNOLOGIA = "00000000-0000-4000-8000-000000000102";

async function irAClases(page: Page) {
  await page.goto("/es/estudiante/clases");
  await expect(page.getByRole("heading", { level: 1, name: "Mis clases" })).toBeVisible();
}

test.describe("Mis clases (estudiante)", () => {
  test("muestra las clases inscritas con docente y conteo de pendientes", async ({ page }) => {
    await irAClases(page);
    await expect(page.getByRole("link", { name: /Matemática 4to A/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tecnología 4to B/ })).toBeVisible();
    await expect(page.getByText(/Prof\. Ana Rodríguez/)).toBeVisible();
    await expect(page.getByText(/1 tareas pendientes/)).toBeVisible();
    await expect(page.getByText(/2 tareas pendientes/)).toBeVisible();
  });

  test("Matemática: vectores pendiente, ecuaciones y fracciones entregadas", async ({ page }) => {
    await irAClases(page);
    await page.getByRole("link", { name: /Matemática 4to A/ }).click();
    await expect(page).toHaveURL(/\/es\/estudiante\/clases\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { level: 1, name: "Matemática 4to A" })).toBeVisible();
    await expect(page.getByText(/Prof\. Ana Rodríguez/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Pendientes" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Funciones lineales: tabla y gráfica/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Práctica: ecuaciones de primer grado/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Repaso de fracciones/ })).toBeVisible();
  });

  test("Tecnología: Semáforo con Arduino vencido y ensayo 3D pendiente", async ({ page }) => {
    await page.goto(`/es/estudiante/clases/${ID_TECNOLOGIA}`);
    await expect(page.getByRole("heading", { level: 1, name: "Tecnología 4to B" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Vencidas" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Semáforo con Arduino/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Pendientes" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Diseño 3D de un llavero/ })).toBeVisible();
    await page.getByRole("link", { name: /Semáforo con Arduino/ }).click();
    await expect(page).toHaveURL(/\/es\/estudiante\/tarea\/[0-9a-f-]+$/);
  });

  test("volver al listado de clases desde el detalle", async ({ page }) => {
    await irAClases(page);
    await page.getByRole("link", { name: /Matemática 4to A/ }).click();
    await page.getByRole("link", { name: /Volver a clases/ }).click();
    await expect(page).toHaveURL("/es/estudiante/clases");
    await expect(page.getByRole("heading", { level: 1, name: "Mis clases" })).toBeVisible();
  });
});
