import { expect, test, type Page } from "@playwright/test";

const tarea = "00000000-0000-4000-8000-000000000201";
async function sinDesborde(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
}
test("docente califica y devuelve; estudiante corrige y vuelve a entregar", async ({ page }, testInfo) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.addInitScript(() => {
    const clave = "muselearn-t09-calificaciones-entregas";
    if (localStorage.getItem(clave)) return;
    localStorage.setItem(clave, JSON.stringify([{
      id: "00000000-0000-4000-8000-000000000301",
      tarea_id: "00000000-0000-4000-8000-000000000201",
      estudiante_id: "00000000-0000-4000-8000-000000000011",
      contenido_texto: "3x + 5 = 20; x = 5", estado: "verificada",
      entregada_en: "2026-10-27T19:30:00Z", entregada_externamente: false,
      adjuntos: [{ nombre: "solucion.pdf", ruta: "entregas/ejemplo/solucion.pdf", tipo_mime: "application/pdf" }],
    }]));
  });
  await page.goto(`/es/docente/tareas/${tarea}`);
  await page.getByRole("button", { name: "Ver entrega", exact: true }).first().click();
  const dialogo = page.getByRole("dialog");
  const nota = dialogo.getByRole("spinbutton", { name: "Nota (0–100, opcional)" });
  await expect(nota).toBeEnabled();
  await nota.fill("101");
  await expect(dialogo.getByRole("button", { name: "Guardar nota", exact: true })).toBeDisabled();
  await nota.fill("87.25");
  await dialogo.getByRole("button", { name: "Guardar nota", exact: true }).click();
  await expect(dialogo.getByText("Cambios guardados.", { exact: true })).toBeVisible();
  await expect(dialogo.getByRole("button", { name: "Devolver para corregir" })).toBeDisabled();
  await dialogo.getByRole("textbox", { name: "Motivo de la devolución" }).fill("Explica por qué divides ambos lados entre tres.");
  await dialogo.getByRole("button", { name: "Devolver para corregir" }).click();
  await expect(dialogo.getByText("Devuelta", { exact: true })).toBeVisible();
  await sinDesborde(page);
  await page.screenshot({ path: testInfo.outputPath("docente.png"), fullPage: true });
  await dialogo.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(page.getByText("Devuelta", { exact: true })).toBeVisible();
  await page.goto(`/es/estudiante/tarea/${tarea}`);
  await expect(page.getByText(/Tu docente te pidió corregir: Explica/)).toBeVisible();
  await expect(page.getByText("Nota: 87,25/100", { exact: true })).toBeVisible();
  const texto = page.getByRole("textbox").first();
  await expect(texto).toBeEditable();
  await expect(texto).not.toHaveValue("");
  await expect(page.getByText("solucion.pdf", { exact: true })).toBeVisible();
  await texto.fill("Divido ambos lados entre tres para mantener la igualdad.");
  await sinDesborde(page);
  await page.screenshot({ path: testInfo.outputPath("estudiante.png"), fullPage: true });
  await page.getByRole("button", { name: "Entregar", exact: true }).click();
  await expect(page.getByText(/Tu docente te pidió corregir:/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Comprobar lo que aprendí", exact: true })).toBeVisible();
  await expect(page.getByText("Nota: 87,25/100", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Tu respuesta (texto)" })).toHaveValue("Divido ambos lados entre tres para mantener la igualdad.");
  await expect(page.getByText("solucion.pdf", { exact: true })).toBeVisible();
  await expect(page.getByText(/Tu docente te pidió corregir:/)).toHaveCount(0);
  await page.goto(`/es/docente/tareas/${tarea}`);
  await expect(page.getByText("Nota: 87,25/100", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ver entrega", exact: true }).first().click();
  await expect(page.getByRole("dialog").getByText("Divido ambos lados entre tres para mantener la igualdad.", { exact: true })).toBeVisible();
  await sinDesborde(page);
  expect(errores).toEqual([]);
});

test("nota opcional y traducciones en inglés", async ({ page }) => {
  await page.goto(`/en/docente/tareas/${tarea}`);
  await page.getByRole("button", { name: "View submission", exact: true }).first().click();
  const dialogo = page.getByRole("dialog");
  const nota = dialogo.getByRole("spinbutton", { name: "Grade (0–100, optional)" });
  await expect(nota).toBeEnabled();
  await nota.fill("0");
  await dialogo.getByRole("button", { name: "Save grade", exact: true }).click();
  await expect(dialogo.getByText("Changes saved.", { exact: true })).toBeVisible();
  await nota.fill("");
  await dialogo.getByRole("button", { name: "Save grade", exact: true }).click();
  await expect(dialogo.getByText("Changes saved.", { exact: true })).toBeVisible();
  await sinDesborde(page);
});
