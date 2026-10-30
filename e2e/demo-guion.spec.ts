import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Ejecutar con NEXT_PUBLIC_USAR_MOCKS=true. No llama a proveedores ni a Classroom.
// La captura de audio es sintética; ASR, tutor e informes son los mocks de la app.
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
test.use({ actionTimeout: 15_000 });

async function pantalla(page: Page, info: TestInfo, nombre: string) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (process.env.DEMO_CAPTURAS === "true") {
    await mkdir("docs/capturas", { recursive: true });
    await page.screenshot({ path: `docs/capturas/demo-${nombre}-${info.project.name === "celular" ? 390 : 1440}.png`, fullPage: nombre !== "10-comentario", animations: "disabled", scale: "css" });
  }
}

test("guion: crear con IA → organizar → voz → evidencia Classroom → explicar → panel → comentario", async ({ page }, info) => {
  test.setTimeout(180_000);
  expect(process.env.NEXT_PUBLIC_USAR_MOCKS, "Este ensayo solo debe ejecutar datos ficticios").toBe("true");
  await page.setViewportSize({ width: info.project.name === "celular" ? 390 : 1440, height: 900 });
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });

  // Señal audible seguida de silencio: ejercita captura WAV y detección de pausa.
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      const destino = audio.createMediaStreamDestination();
      const tono = audio.createOscillator();
      const volumen = audio.createGain();
      // El detector calibra el ruido durante los primeros 400 ms.
      volumen.gain.setValueAtTime(0, audio.currentTime);
      volumen.gain.setValueAtTime(0.2, audio.currentTime + 0.8);
      volumen.gain.setValueAtTime(0, audio.currentTime + 2);
      tono.connect(volumen).connect(destino);
      tono.start();
      destino.stream.getTracks().forEach((track) => track.addEventListener("ended", () => void audio.close()));
      await audio.resume();
      return destino.stream;
    };
  });

  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await pantalla(page, info, "00-portada");

  await test.step("Docente: proponer, revisar y guardar una tarea", async () => {
    await page.goto(`/es/docente/clases/${id(101)}`);
    await page.getByRole("button", { name: "Nueva tarea", exact: true }).click();
    await page.getByRole("button", { name: "Crear la tarea con IA" }).click();
    await page.getByRole("textbox", { name: "¿Qué quieres que practiquen?" }).fill("Ecuaciones de primer grado");
    await page.getByRole("button", { name: "Proponer tarea", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Título de la tarea", exact: true })).not.toHaveValue("");
    await expect(page.getByRole("textbox", { name: "Instrucciones", exact: true })).not.toHaveValue("");
    await page.getByLabel("Fecha y hora de entrega").fill("2030-11-03T18:00");
    await page.getByText("En Classroom", { exact: true }).click();
    await page.getByLabel("Enlace a la tarea (opcional)").fill("https://classroom.google.com/");
    await pantalla(page, info, "01-crear-ia");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByText("Tarea creada correctamente", { exact: true })).toBeVisible();
  });

  await test.step("Estudiante: Hoy y conversación al tocar la mascota", async () => {
    await page.goto("/es/estudiante/hoy");
    await expect(page.getByRole("heading", { name: "Lo próximo que te toca" })).toBeVisible();
    await page.locator("summary").first().click();
    await pantalla(page, info, "02-hoy");
    await page.getByRole("button", { name: "Tócame para hablar conmigo", exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByRole("heading", { name: "Conversación con tu tutor" })).toBeVisible();
    await page.getByRole("button", { name: "Empezar a conversar", exact: true }).click();
    await expect(page.getByText("Porque está sumando, entonces resto en los dos lados.", { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Buena pregunta. Antes de seguir:", { exact: false })).toContainText("¿qué operación está haciendo el número que acompaña a la x?");
    await pantalla(page, info, "03-voz");
    await page.getByRole("link", { name: "Prefiero escribir" }).click();
    await page.getByRole("button", { name: "Necesito una pista", exact: true }).click();
    await expect(page.getByRole("log").getByText("Buena pregunta.", { exact: false })).toBeVisible();
    await pantalla(page, info, "04-tutor");
  });

  await test.step("Classroom: confirmar entrega externa y aportar evidencia escrita", async () => {
    await page.goto(`/es/estudiante/tarea/${id(203)}`);
    await expect(page.getByRole("heading", { name: "Tu evidencia", exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: "Tu respuesta (texto)" }).fill("Programé tres LED. Cada salida se enciende por turno; la pausa mantiene el color antes de pasar al siguiente.");
    await page.getByRole("checkbox", { name: "Ya la entregué en Google Classroom." }).check();
    await pantalla(page, info, "05-classroom-evidencia");
    await page.getByRole("button", { name: "Entregar", exact: true }).click();
    await expect(page.getByText("¡Tarea entregada correctamente!", { exact: true })).toBeVisible();
    // El mock de verificación contiene preguntas de ecuaciones, no de Arduino.
    // Corte explícito a la entrega de ecuaciones ya disponible; no fingir continuidad.
  });

  await test.step("Ecuaciones: tres explicaciones e informe con ruta", async () => {
    await page.goto(`/es/estudiante/tarea/${id(201)}/verificar?entrega_id=${id(301)}`);
    const caja = page.getByRole("textbox", { name: "Tu explicación", exact: true });
    // Next dev puede pintar el botón del servidor antes de hidratar su manejador.
    await expect(async () => {
      if (!(await caja.isVisible())) await page.getByRole("button", { name: "Empezar", exact: true }).click();
      await expect(caja).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    for (const [i, respuesta] of ["Resto cinco en ambos lados para mantener la igualdad.", "Divido los dos lados entre tres.", "Sustituyo x en la ecuación original para comprobar."].entries()) {
      await expect(caja).toBeVisible();
      await caja.fill(respuesta);
      if (i === 0) await pantalla(page, info, "06-verificacion");
      await page.getByRole("button", { name: "Enviar explicación", exact: true }).click();
      if (i < 2) await expect(caja).toHaveValue("");
    }
    await expect(page).toHaveURL(new RegExp(`/estudiante/informe/${id(301)}$`), { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Tu ruta de práctica" })).toBeVisible();
    await pantalla(page, info, "07-informe");
  });

  await test.step("Docente: General → Por estudiante → borrador editable", async () => {
    await page.goto("/es/docente/comprension");
    await expect(page.getByRole("heading", { name: "Cómo va la clase en cada concepto" })).toBeVisible();
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await expect(page.getByText("42%", { exact: true })).toBeVisible();
    await pantalla(page, info, "08-general");
    await page.getByRole("tab", { name: "Por estudiante", exact: true }).click();
    await page.getByRole("combobox", { name: "Estudiante", exact: true }).selectOption(id(11));
    await expect(page.getByRole("heading", { name: "Sus tareas", exact: true })).toBeVisible();
    await pantalla(page, info, "09-estudiante");
    await page.getByRole("button", { name: "Ver entrega", exact: true }).first().click();
    const comentario = page.getByRole("textbox", { name: "Comentario para el estudiante", exact: true });
    await expect(comentario).toBeVisible();
    await page.getByRole("button", { name: /Borrador con IA|Otro borrador/ }).click();
    await expect(comentario).toHaveValue(/Explicaste muy bien/);
    await comentario.fill("Buen razonamiento. Practica comprobar tu resultado en la ecuación original.");
    await comentario.scrollIntoViewIfNeeded();
    await pantalla(page, info, "10-comentario");
    await page.getByRole("button", { name: /^(Enviar comentario|Actualizar)$/ }).click();
    await expect(page.getByText("Comentario enviado.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  });
  expect(errores, "Errores de consola o excepciones durante el guion").toEqual([]);
});
