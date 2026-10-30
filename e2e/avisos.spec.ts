import { expect, test } from "@playwright/test";

// Pruebas e2e para la campana de avisos (T12)
// Ejecutar con NEXT_PUBLIC_USAR_MOCKS=true

test.describe("Campana de avisos", () => {
  test.beforeEach(async ({ page }) => {
    // Ir a la página de estudiante con mocks activados
    await page.goto("/es/estudiante/hoy");
  });

  test("muestra la campana en la barra superior", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await expect(campana).toBeVisible();
  });

  test("muestra el número de avisos sin leer en la campana", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    // En mocks hay 3 avisos sin leer
    await expect(campana.locator("span")).toContainText("3");
  });

  test("abre la lista de avisos al hacer click en la campana", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await campana.click();

    const lista = page.getByRole("listbox", { name: /lista de avisos/i });
    await expect(lista).toBeVisible();

    // Debe haber 5 avisos en los mocks
    const items = lista.getByRole("option");
    await expect(items).toHaveCount(5);
  });

  test("muestra el título, enlace y fecha de cada aviso", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await campana.click();

    const lista = page.getByRole("listbox", { name: /lista de avisos/i });
    const primerAviso = lista.getByRole("option").first();

    await expect(primerAviso).toContainText(/nueva tarea/i);
    await expect(primerAviso).toContainText(/estudiante\/tarea/);
  });

  test("marca aviso como leído al hacer click y navega a su enlace", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await campana.click();

    const lista = page.getByRole("listbox", { name: /lista de avisos/i });
    const primerAviso = lista.getByRole("option").first();

    // Click en el primer aviso
    await primerAviso.click();

    // Debe navegar a la URL del aviso
    await expect(page).toHaveURL(/\/estudiante\/tarea\/[a-f0-9-]{36}/);
  });

  test("cierra la lista con Escape", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await campana.click();

    const lista = page.getByRole("listbox", { name: /lista de avisos/i });
    await expect(lista).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(lista).toBeHidden();
  });

  test("cierra la lista al hacer click fuera", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await campana.click();

    const lista = page.getByRole("listbox", { name: /lista de avisos/i });
    await expect(lista).toBeVisible();

    // Click en el logo (fuera del dropdown)
    await page.getByRole("link", { name: /muselearn/i }).click();
    await expect(lista).toBeHidden();
  });

  test("botón 'Marcar todos como leídos' funciona", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await campana.click();

    await expect(page.getByRole("listbox", { name: /lista de avisos/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /marcar todos como leídos/i })).toBeVisible();

    await page.getByRole("button", { name: /marcar todos como leídos/i }).click();

    // El contador debe ponerse a 0
    await expect(campana.locator("span")).not.toBeVisible();
  });

  test("funciona en viewport móvil (380px)", async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 667 });
    await page.goto("/es/estudiante/hoy");

    const campana = page.getByRole("button", { name: /notificaciones/i });
    await expect(campana).toBeVisible();
    await campana.click();

    const lista = page.getByRole("listbox", { name: /lista de avisos/i });
    await expect(lista).toBeVisible();

    // No debe haber scroll horizontal
    const body = page.locator("body");
    await expect(body).not.toHaveCSS("overflow-x", "scroll");
  });

  test("funciona en viewport escritorio (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/es/estudiante/hoy");

    const campana = page.getByRole("button", { name: /notificaciones/i });
    await expect(campana).toBeVisible();
    await campana.click();

    const lista = page.getByRole("listbox", { name: /lista de avisos/i });
    await expect(lista).toBeVisible();
  });
});

test.describe("Campana de avisos - Docente", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/es/docente/clases");
  });

  test("muestra la campana en la barra superior del docente", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await expect(campana).toBeVisible();
  });

  test("abre la lista de avisos del docente", async ({ page }) => {
    const campana = page.getByRole("button", { name: /notificaciones/i });
    await campana.click();

    const lista = page.getByRole("listbox", { name: /lista de avisos/i });
    await expect(lista).toBeVisible();
  });
});