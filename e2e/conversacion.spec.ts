import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: test.info().project.name === "celular" ? 360 : 1280, height: 900 });
  await page.addInitScript(() => {
    const datos = { lecturas: [] as string[], micros: 0, cancelaciones: 0, fin: null as (() => void) | null };
    Object.assign(window, { pruebaVoz: datos });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: class { constructor(public text: string) {} } });
    Object.defineProperty(window.speechSynthesis, "getVoices", { value: () => [{ name: "Google natural", lang: "es-MX", voiceURI: "natural" }] });
    Object.defineProperty(window.speechSynthesis, "cancel", { value: () => { datos.cancelaciones++; } });
    Object.defineProperty(window.speechSynthesis, "speak", { value: (u: SpeechSynthesisUtterance) => {
      datos.lecturas.push(u.text);
      document.documentElement.dataset.lectura = datos.lecturas.join("|");
      document.documentElement.dataset.voz = `${u.voice?.voiceURI}:${u.rate}`;
      u.onstart?.({} as SpeechSynthesisEvent);
      datos.fin = () => u.onend?.({} as SpeechSynthesisEvent);
    } });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async () => {
      datos.micros++;
      document.documentElement.dataset.micros = String(datos.micros);
      return { getTracks: () => [{ stop() {} }] };
    } });
    class Contexto {
      reloj: ReturnType<typeof setInterval> | undefined;
      sampleRate = 24000; currentTime = 0; destination = {};
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
      createOscillator() { return { frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; }
      createScriptProcessor() {
        const p = { onaudioprocess: null as ((e: unknown) => void) | null, connect() {}, disconnect() {} };
        const inicio = performance.now();
        const reloj = setInterval(() => {
          if (!p.onaudioprocess) return;
          const ms = performance.now() - inicio;
          const bloque = new Float32Array(4096).fill(ms > 500 && ms < 1000 ? .1 : .001);
          p.onaudioprocess({ inputBuffer: { getChannelData: () => bloque } });
        }, 85);
        this.reloj = reloj;
        return p;
      }
      async resume() {}
      async close() { clearInterval(this.reloj); }
    }
    Object.defineProperty(window, "AudioContext", { value: Contexto });
  });
  await page.goto("/es/estudiante/tarea/00000000-0000-4000-8000-000000000201/conversar");
});

test("lee durante el streaming, conserva la cola y vuelve a escuchar", async ({ page }) => {
  await page.getByRole("button", { name: "Empezar a conversar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lectura", "Buena pregunta.");
  // El mock entrega una palabra cada 60 ms: la segunda frase aún no llegó completa.
  await expect(page.getByText(/Buena pregunta\. Antes/)).toBeVisible();
  await expect(page.getByText(/acompaña a la x\?/)).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-voz", "natural:1");
  await page.waitForTimeout(1600);
  await page.evaluate(() => (window as unknown as { pruebaVoz: { fin: () => void } }).pruebaVoz.fin());
  await expect(page.locator("html")).toHaveAttribute("data-lectura", /\|/);
  await page.evaluate(() => (window as unknown as { pruebaVoz: { fin: () => void } }).pruebaVoz.fin());
  await expect(page.locator("html")).toHaveAttribute("data-micros", "2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/conversacion-${test.info().project.name}.png`, fullPage: true });
});

test("tocar el orbe interrumpe y descarta callbacks anteriores", async ({ page }) => {
  await page.getByRole("button", { name: "Empezar a conversar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lectura", "Buena pregunta.");
  await page.getByRole("button", { name: "Hablando · toca para interrumpir", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-micros", "2");
  await page.evaluate(() => (window as unknown as { pruebaVoz: { fin: () => void } }).pruebaVoz.fin());
  await expect(page.locator("html")).toHaveAttribute("data-micros", "2");
  await expect(page.locator("html")).toHaveAttribute("data-lectura", "Buena pregunta.");
});


test("recupera la cola sin onend y respeta movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Empezar a conversar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lectura", "Buena pregunta.");
  await expect(page.locator("html")).toHaveAttribute("data-lectura", /\|/, { timeout: 6500 });
  const orbe = page.locator(".orbe");
  expect(await orbe.evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  await page.evaluate(() => (window as unknown as { pruebaVoz: { fin: () => void } }).pruebaVoz.fin());
  await expect(page.locator("html")).toHaveAttribute("data-micros", "2");
});
