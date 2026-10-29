import { expect, test } from "@playwright/test";

// Flujo de escuela con los datos de demo: dónde se entrega la tarea, privacidad y términos, y el panel
// de comprensión por estudiante.
const ARDUINO = "/es/estudiante/tarea/00000000-0000-4000-8000-000000000203"; // se entrega en Classroom

test("la tarea que se entrega en Classroom pide evidencia y marcar que ya se entregó", async ({
  page,
}) => {
  await page.goto(ARDUINO);
  await expect(
    page.getByText("Se entrega en Google Classroom").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Abrir en Classroom/ }),
  ).toHaveAttribute("href", "https://classroom.google.com/");
  await expect(
    page.getByRole("heading", { name: "Tu evidencia" }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Ya la entregué en Google Classroom." }),
  ).toBeVisible();
});

test("el docente elige dónde se entrega la tarea", async ({ page }) => {
  await page.goto("/es/docente/clases/00000000-0000-4000-8000-000000000101");
  await page.getByRole("button", { name: "Nueva tarea" }).click();
  await page.getByText("En Classroom", { exact: true }).click();
  await expect(page.getByLabel("Enlace a la tarea (opcional)")).toBeVisible();
});

test("privacidad y términos: páginas públicas y casilla obligatoria al crear cuenta", async ({
  page,
}) => {
  await page.goto("/es/privacidad");
  await expect(
    page.getByRole("heading", { level: 1, name: "Política de privacidad" }),
  ).toBeVisible();
  await expect(page.getByText("Ley 172-13")).toBeVisible();
  await page.getByRole("link", { name: "Ver los Términos de uso" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Términos de uso" }),
  ).toBeVisible();
  await page.goto("/es/registro");
  await expect(
    page.getByRole("checkbox", { name: /acepto los Términos de uso/ }),
  ).toHaveAttribute("required", "");
});

test("configuración tiene Privacidad y datos con descarga y eliminar cuenta", async ({
  page,
}) => {
  await page.goto("/es/estudiante/configuracion");
  await expect(
    page.getByRole("heading", { name: "Privacidad y datos" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Eliminar cuenta" }).click();
  const definitivo = page.getByRole("button", {
    name: "Eliminar para siempre",
  });
  await expect(definitivo).toBeDisabled();
  await page.getByLabel("Para confirmar, escribe ELIMINAR").fill("eliminar");
  await expect(definitivo).toBeEnabled();
});

test("el panel de comprensión muestra la ficha de un estudiante", async ({
  page,
}) => {
  await page.goto("/es/docente/comprension");
  await page.getByRole("tab", { name: "Por estudiante" }).click();
  await page.locator("#comprension-estudiante").selectOption({ index: 1 });
  await expect(page.getByRole("heading", { name: "Sus tareas" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Por concepto" }),
  ).toBeVisible();
});
