import { expect, test, type Page } from "@playwright/test";

// Navegación entre semanas del plan del estudiante (T20).
// Cubre la corrección de T07: avanzar/retroceder, lunes como inicio y contenido de la semana elegida.
// Corre con mocks (NEXT_PUBLIC_USAR_MOCKS=true).

const REGION = { name: "Semana" } as const;

function diasDeLaSemana(page: Page) {
  return page.getByRole("region", REGION).locator("h2 time");
}

async function fechas(page: Page): Promise<string[]> {
  return diasDeLaSemana(page).evaluateAll((els) => els.map((el) => el.getAttribute("datetime") ?? ""));
}

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function esLunes(iso: string): boolean {
  return new Date(`${iso}T12:00:00`).getDay() === 1;
}

async function irASemana(page: Page) {
  await page.goto("/es/estudiante/semana");
  await expect(page.getByRole("heading", { level: 1, name: "Semana" })).toBeVisible();
  await expect(diasDeLaSemana(page)).toHaveCount(7);
}

async function avanzar(page: Page) {
  const boton = page.getByRole("button", { name: /Semana siguiente/ });
  await expect(boton).toBeVisible();
  await boton.click();
}

async function retroceder(page: Page) {
  const boton = page.getByRole("button", { name: /Semana anterior/ });
  await expect(boton).toBeVisible();
  await boton.click();
}

test.describe("Navegación semanal", () => {
  test("la semana empieza en lunes y tiene 7 días", async ({ page }) => {
    await irASemana(page);
    const semana = await fechas(page);
    expect(semana).toHaveLength(7);
    expect(esLunes(semana[0])).toBe(true);
    for (let i = 1; i < semana.length; i++) {
      expect(semana[i]).toBe(sumarDias(semana[0], i));
    }
  });

  test("avanzar y retroceder muestra la semana elegida", async ({ page }) => {
    await irASemana(page);
    const inicial = await fechas(page);

    await avanzar(page);
    await expect.poll(async () => (await fechas(page))[0]).toBe(sumarDias(inicial[0], 7));
    const siguiente = await fechas(page);
    expect(esLunes(siguiente[0])).toBe(true);
    for (let i = 0; i < 7; i++) {
      expect(siguiente[i]).toBe(sumarDias(inicial[i], 7));
    }
    // La semana elegida trae contenido del plan (bloques o entregas).
    await expect(page.getByRole("region", REGION).getByRole("link").first()).toBeVisible();

    await retroceder(page);
    await expect.poll(async () => (await fechas(page))[0]).toBe(inicial[0]);
    expect(await fechas(page)).toEqual(inicial);
  });

  test("avanzar dos veces suma dos semanas (no se queda en la primera)", async ({ page }) => {
    await irASemana(page);
    const inicial = await fechas(page);

    await avanzar(page);
    await expect.poll(async () => (await fechas(page))[0]).toBe(sumarDias(inicial[0], 7));

    await avanzar(page);
    await expect.poll(async () => (await fechas(page))[0]).toBe(sumarDias(inicial[0], 14));
    const dosSemanas = await fechas(page);
    expect(esLunes(dosSemanas[0])).toBe(true);
  });
});

test.describe("SSR en un navegador con otra zona horaria", () => {
  test.use({ timezoneId: "UTC" });
  test("Hoy, Semana y Tarea hidratan sin diferencias de fechas", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
    for (const ruta of ["/es/estudiante/hoy", "/es/estudiante/semana", "/es/estudiante/tarea/00000000-0000-4000-8000-000000000201"]) {
      await page.goto(ruta);
      // Abrir la campana confirma la hidratación sin introducir navegación entre idiomas.
      await page.getByRole("button", { name: /^Notificaciones,/ }).click();
      await expect(page.getByText("Avisos", { exact: true })).toBeVisible();
    }
    expect(errores).toEqual([]);
  });
});
