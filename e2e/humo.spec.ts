import { expect, test } from "@playwright/test";

// Prueba de humo (T00). T07 agrega el flujo completo de la demo.
test("la portada carga en español y cambia a inglés", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Entregar no es aprender");
  await page.getByRole("button", { name: "en" }).first().click();
  await expect(page).toHaveURL(/\/en$/);
});

test("el estudiante llega a Hoy sin scroll horizontal", async ({ page }) => {
  await page.goto("/es/estudiante");
  await expect(page).toHaveURL(/\/es\/estudiante\/hoy$/);
  const sobrante = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sobrante).toBeLessThanOrEqual(0);
});
