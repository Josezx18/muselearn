import { expect, test } from "@playwright/test";

// Pantallas de acceso: entrar con Google (si NEXT_PUBLIC_ENTRAR_CON_GOOGLE=true) y recuperar la contraseña.
// Solo se comprueba que se muestran: enviar los formularios llamaría a Google o mandaría correos de verdad.
const conGoogle = process.env.NEXT_PUBLIC_ENTRAR_CON_GOOGLE === "true";

test("iniciar sesión lleva a recuperar la contraseña", async ({ page }) => {
  await page.goto("/es/login");
  if (conGoogle) await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Recuperar tu contraseña" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar enlace" })).toBeVisible();
});

test("un enlace vencido explica qué hacer", async ({ page }) => {
  await page.goto("/es/recuperar?error=enlace");
  await expect(page.getByRole("alert")).toContainText("venció");
});

test("crear cuenta con Google no exige los demás campos", async ({ page }) => {
  test.skip(!conGoogle, "Google no está activado");
  await page.goto("/es/registro");
  const boton = page.getByRole("button", { name: "Continuar con Google" });
  await expect(boton).toBeVisible();
  await expect(boton).toHaveAttribute("formnovalidate", "");
});
