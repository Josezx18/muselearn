import { expect, test } from "@playwright/test";

// Al final de la verificación, el informe tiene "Terminar": vuelve a Hoy sin agregar práctica (T24). Con mocks.
const INFORME = "/es/estudiante/informe/00000000-0000-4000-8000-000000000301";

test("Terminar en el informe vuelve a Hoy y avisa que la tarea quedó completada", async ({ page }) => {
  await page.goto(INFORME);
  const terminar = page.getByRole("button", { name: "Terminar", exact: true });
  await expect(terminar).toBeVisible();
  await terminar.click();
  await expect(page).toHaveURL(/\/es\/estudiante\/hoy$/);
  await expect(page.getByText("¡Tarea completada!")).toBeVisible();
});
