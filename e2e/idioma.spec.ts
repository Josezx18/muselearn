import { expect, test } from "@playwright/test";

// Requiere NEXT_PUBLIC_USAR_MOCKS=true y datos estructurados en mocks/avisos.ts.
test("el selector cambia ES/EN y los avisos no muestran rutas internas", async ({page}) => {
 await page.goto("/es/estudiante/hoy");
 await page.getByRole("button", {name: /notificaciones/i}).click();
 await expect(page.getByRole("listbox")).toContainText("Nueva tarea: Ecuaciones lineales");
 await expect(page.getByRole("listbox")).not.toContainText("/estudiante/");
 await page.keyboard.press("Escape");
 await page.getByRole("button", {name: "en", exact: true}).first().click();
 await expect(page).toHaveURL(/\/en\/estudiante\/hoy/);
 await page.getByRole("button", {name: /notifications/i}).click();
 await expect(page.getByRole("listbox")).toContainText("New task: Ecuaciones lineales");
 await expect(page.getByRole("listbox")).not.toContainText("/estudiante/");
 await page.keyboard.press("Escape");
 await page.getByRole("button", {name: "es", exact: true}).first().click();
 await expect(page).toHaveURL(/\/es\/estudiante\/hoy/);
 await page.getByRole("button", {name: /notificaciones/i}).click();
 await expect(page.getByRole("listbox")).toContainText("Nueva tarea: Ecuaciones lineales");
});
