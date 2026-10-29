"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { entrarConGoogle } from "./acciones";

function Icono() {
  // Marca "G" de Google para el botón de inicio de sesión (según sus pautas de identidad para iniciar sesión).
  return (
    <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const clases =
  "flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border-2 border-borde bg-superficie px-4 font-bold text-tinta shadow-[0_3px_0_0_var(--color-borde)] hover:border-tinta-suave/40 active:translate-y-[2px] active:shadow-none disabled:opacity-60";

/** Botón dentro de un formulario ajeno (Crear cuenta): envía el rol elegido y no exige los demás campos. */
export function BotonGoogleEnFormulario() {
  const t = useTranslations("auth.google");
  const { pending } = useFormStatus();
  return (
    <button type="submit" formAction={entrarConGoogle} formNoValidate disabled={pending} className={clases}>
      <Icono /> {t("continuar")}
    </button>
  );
}

function Enviar() {
  const t = useTranslations("auth.google");
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={clases}>
      <Icono /> {t("continuar")}
    </button>
  );
}

/** Botón con su propio formulario (Iniciar sesión). */
export function BotonGoogle() {
  return (
    <form action={entrarConGoogle}>
      <Enviar />
    </form>
  );
}

export function SeparadorO() {
  const t = useTranslations("auth.google");
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase text-tinta-suave" aria-hidden>
      <span className="h-px flex-1 bg-borde" />
      {t("o")}
      <span className="h-px flex-1 bg-borde" />
    </div>
  );
}
