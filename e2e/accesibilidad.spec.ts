import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Accesibilidad y tamaño de pantalla (T14). Todo corre con mocks (NEXT_PUBLIC_USAR_MOCKS=true).
// Regla: cero violaciones axe de impacto "serious" o "critical", y ninguna pantalla con scroll horizontal a 360 px.

const TAREA = "00000000-0000-4000-8000-000000000201";
const ENTREGA = "00000000-0000-4000-8000-000000000301";
const CLASE = "00000000-0000-4000-8000-000000000101";

type Pantalla = {
  nombre: string;
  ruta: string;
  listo?: (page: Page) => Promise<unknown>;
  accion?: (page: Page) => Promise<unknown>;
};

const pantallas: Pantalla[] = [
  { nombre: "portada", ruta: "/es", listo: (p) => p.getByRole("heading", { level: 1 }).first().waitFor() },
  { nombre: "login", ruta: "/es/login", listo: (p) => p.getByRole("heading", { level: 1 }).first().waitFor() },
  { nombre: "registro", ruta: "/es/registro", listo: (p) => p.getByRole("heading", { level: 1 }).first().waitFor() },
  {
    nombre: "Hoy",
    ruta: "/es/estudiante/hoy",
    listo: (p) => p.getByRole("heading", { name: "Lo próximo que te toca" }).waitFor(),
  },
  {
    nombre: "tarea",
    ruta: `/es/estudiante/tarea/${TAREA}`,
    listo: (p) => p.getByRole("heading", { name: "Instrucciones" }).waitFor(),
  },
  {
    nombre: "tutor",
    ruta: `/es/estudiante/tarea/${TAREA}/tutor`,
    listo: (p) => p.getByRole("heading", { level: 1 }).first().waitFor(),
  },
  {
    nombre: "verificación",
    ruta: `/es/estudiante/tarea/${TAREA}/verificar?entrega_id=${ENTREGA}`,
    listo: (p) => p.getByRole("heading", { name: "Explícamelo" }).waitFor(),
  },
  {
    nombre: "informe",
    ruta: `/es/estudiante/informe/${ENTREGA}`,
    listo: (p) => p.getByRole("heading", { name: "Tu comprensión" }).waitFor(),
  },
  {
    nombre: "clase del docente",
    ruta: `/es/docente/clases/${CLASE}`,
    listo: (p) => p.getByRole("heading", { name: "Tareas" }).waitFor(),
  },
  {
    nombre: "panel de comprensión",
    ruta: "/es/docente/comprension",
    listo: (p) => p.getByRole("heading", { name: "Comprensión de la clase" }).waitFor(),
  },
  {
    nombre: "configuración",
    ruta: "/es/estudiante/configuracion",
    listo: (p) => p.getByRole("heading", { level: 1 }).first().waitFor(),
  },
  {
    nombre: "privacidad",
    ruta: "/es/privacidad",
    listo: (p) => p.getByRole("heading", { level: 1 }).first().waitFor(),
  },
];

async function violaciones(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return resultado.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test.describe("axe: cero violaciones graves", () => {
  for (const pantalla of pantallas) {
    test(`${pantalla.nombre}`, async ({ page }) => {
      await page.setViewportSize({ width: test.info().project.name === "celular" ? 360 : 1280, height: 900 });
      await page.goto(pantalla.ruta);
      await pantalla.listo?.(page);
      await pantalla.accion?.(page);
      expect(await violaciones(page)).toEqual([]);
    });
  }

  test("panel de comprensión: las 3 pestañas", async ({ page }) => {
    await page.setViewportSize({ width: test.info().project.name === "celular" ? 360 : 1280, height: 900 });
    await page.goto("/es/docente/comprension");
    await page.getByRole("heading", { name: "Comprensión de la clase" }).waitFor();
    for (const pestana of ["General", "Por estudiante", "Mapa"]) {
      await page.getByRole("tab", { name: pestana, exact: true }).click();
      expect(await violaciones(page), pestana).toEqual([]);
    }
  });
});

test.describe("contraste AA en los 3 temas", () => {
  const rutas = pantallas.filter((p) => ["portada", "Hoy", "tarea", "informe", "panel de comprensión"].includes(p.nombre));
  for (const tema of ["cuaderno", "meta", "muse"]) {
    test(`tema ${tema}`, async ({ page }) => {
      await page.context().addCookies([{ name: "tema", value: tema, url: "http://localhost:3000" }]);
      for (const pantalla of rutas) {
        await page.goto(pantalla.ruta);
        await pantalla.listo?.(page);
        expect(await violaciones(page), `${tema} · ${pantalla.nombre}`).toEqual([]);
      }
    });
  }
});

test.describe("teclado y lector de pantalla", () => {
  test("el foco se ve al navegar con teclado", async ({ page }) => {
    await page.goto("/es/estudiante/hoy");
    await page.getByRole("heading", { name: "Lo próximo que te toca" }).waitFor();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const foco = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const s = getComputedStyle(el);
        return { etiqueta: el.tagName, outline: s.outlineStyle, ancho: parseFloat(s.outlineWidth), sombra: s.boxShadow };
      });
      expect(foco).not.toBeNull();
      expect(
        foco!.outline !== "none" && foco!.ancho >= 2 || foco!.sombra !== "none",
        `sin foco visible en ${foco!.etiqueta}`,
      ).toBe(true);
    }
  });

  test("el diálogo atrapa el foco y Escape lo cierra", async ({ page }) => {
    await page.goto(`/es/docente/clases/${CLASE}`);
    await page.getByRole("heading", { name: "Tareas" }).waitFor();
    await page.getByRole("button", { name: "Editar clase", exact: true }).click();
    const dialogo = page.locator("dialog[open]");
    await expect(dialogo).toBeVisible();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("dialog[open]"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("los mensajes de estado viven en regiones aria-live", async ({ page }) => {
    await page.goto("/es/estudiante/hoy");
    await page.getByRole("heading", { name: "Lo próximo que te toca" }).waitFor();
    expect(await page.locator('[aria-live="polite"]').count()).toBeGreaterThan(0);
    await page.goto(`/es/estudiante/tarea/${TAREA}/tutor`);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expect(page.locator('[role="log"][aria-live="polite"]')).toBeVisible();
  });
});

test.describe("360 px sin scroll horizontal", () => {
  for (const pantalla of pantallas) {
    test(`${pantalla.nombre}`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(pantalla.ruta);
      await pantalla.listo?.(page);
      await pantalla.accion?.(page);
      const sobrante = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(sobrante).toBeLessThanOrEqual(0);
    });
  }

  test("panel de comprensión: las 3 pestañas", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/es/docente/comprension");
    await page.getByRole("heading", { name: "Comprensión de la clase" }).waitFor();
    for (const pestana of ["General", "Por estudiante", "Mapa"]) {
      await page.getByRole("tab", { name: pestana, exact: true }).click();
      const sobrante = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(sobrante, pestana).toBeLessThanOrEqual(0);
    }
  });
});
