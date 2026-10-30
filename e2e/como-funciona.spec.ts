import { expect, test } from "@playwright/test";

test.use({ actionTimeout: 20_000 });
test.setTimeout(90_000);

for (const locale of ["es", "en"] as const) {
  test(`${locale}: página pública, capturas y navegación`, async ({ page }, info) => {
    await page.setViewportSize({ width: info.project.name === "celular" ? 380 : 1280, height: 900 });
    const titulo = locale === "es" ? "Cómo funciona" : "How it works";
    await page.goto(`/${locale}`);
    const enlaces = page.getByRole("link", { name: titulo, exact: true });
    await expect(enlaces).toHaveCount(2);
    await enlaces.first().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/como-funciona$`), { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
    await expect(page.locator("article section")).toHaveCount(7);
    const imagenes = page.locator("article img");
    await expect(imagenes).toHaveCount(5);
    for (const imagen of await imagenes.all()) {
      await imagen.scrollIntoViewIfNeeded();
      await expect.poll(() => imagen.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await imagen.getAttribute("alt")).toBeTruthy();
      expect(Number(await imagen.getAttribute("width"))).toBeGreaterThan(0);
      expect(Number(await imagen.getAttribute("height"))).toBeGreaterThan(0);
    }
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(5);
    for (const modelo of ["Muse Spark 1.3", "Muse Voice Transcribe 1.0", "Muse Spark Open", "Muse Glimmer 30B"]) {
      await expect(page.getByRole("cell", { name: modelo, exact: true })).toBeVisible();
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: test.info().outputPath(`como-funciona-${locale}.png`), fullPage: true });
    await page.getByRole("link", { name: locale === "es" ? "Leer la política de privacidad" : "Read the privacy policy" }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/privacidad$`), { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}
