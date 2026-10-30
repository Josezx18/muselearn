import { test, expect } from "@playwright/test";

for (const locale of ["es", "en"] as const) {
  test(`voz guarda preferencias y usa la voz elegida (${locale})`, async ({page}) => {
    await page.setViewportSize({width: test.info().project.name === "celular" ? 380 : 1280, height: 900});
    await page.addInitScript(() => {
      Object.defineProperty(window, "SpeechSynthesisUtterance", {value: class { constructor(public text: string) {} }});
      const voces = [
        {name: "Español natural", lang: "es-MX", voiceURI: "es-natural"},
        {name: "Español local", lang: "es-ES", voiceURI: "es-local"},
        {name: "English natural", lang: "en-US", voiceURI: "en-natural"},
        {name: "English local", lang: "en-GB", voiceURI: "en-local"},
      ];
      Object.defineProperty(window.speechSynthesis, "getVoices", {value: () => voces});
      Object.defineProperty(window.speechSynthesis, "speak", {value: (u: SpeechSynthesisUtterance) => {
        document.documentElement.dataset.voz = `${u.voice?.voiceURI}:${u.rate}`;
      }});
    });
    await page.goto(`/${locale}/estudiante/configuracion`);
    const select = page.getByLabel(locale === "es" ? "Voz del navegador" : "Browser voice");
    await expect(select.locator("option")).toHaveCount(3);
    await select.selectOption(`${locale}-local`);
    const velocidad = page.getByRole("slider", {name: locale === "es" ? "Velocidad de lectura" : "Reading speed"});
    await velocidad.fill("1.2");
    const pausa = page.getByRole("slider", {name: locale === "es" ? "Hablo despacio" : "I speak slowly"});
    await pausa.fill("1800");
    await page.reload();
    await expect(select).toHaveValue(`${locale}-local`);
    await expect(velocidad).toHaveValue("1.2");
    await expect(pausa).toHaveValue("1800");
    await page.getByRole("button", {name: locale === "es" ? "Probar" : "Try voice", exact:true}).click();
    await expect(page.locator("html")).toHaveAttribute("data-voz", `${locale}-local:1.2`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path: `test-results/voz-${locale}-${test.info().project.name}.png`, fullPage:true});
  });
}

test("permiso denegado ofrece instrucciones y permite escribir", async ({page}) => {
  await page.setViewportSize({width:380,height:900});
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {value: async () => { throw new DOMException("denegado", "NotAllowedError"); }});
  });
  await page.goto("/es/estudiante/tarea/00000000-0000-4000-8000-000000000201/conversar");
  await page.getByRole("button", {name:"Empezar a conversar"}).click();
  await expect(page.getByText(/Chrome Android:/)).toBeVisible();
  await expect(page.getByText(/Safari iOS:/)).toBeVisible();
  await expect(page.getByRole("link", {name:"Prefiero escribir"})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/voz-permiso-${test.info().project.name}.png`,fullPage:true});
});
