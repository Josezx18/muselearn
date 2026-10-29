"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card } from "@/components/ui";
import { aceptarTerminos, cerrarSesion, type EstadoForm } from "./acciones";
import { CasillaTerminos } from "./CasillaTerminos";

/** Puerta de entrada: se muestra si la cuenta aún no aceptó la versión vigente (cuenta nueva con Google o cambio de versión). */
export function FormularioAceptarTerminos({
  yaHabiaAceptado,
}: {
  yaHabiaAceptado: boolean;
}) {
  const t = useTranslations("legal.aceptar");
  const [estado, accion, cargando] = useActionState<EstadoForm, FormData>(
    aceptarTerminos,
    {},
  );
  return (
    <Card>
      <h1 className="text-2xl font-extrabold tracking-tight">{t("titulo")}</h1>
      <p className="mt-1 text-sm text-tinta-suave">
        {yaHabiaAceptado ? t("actualizados") : t("intro")}
      </p>
      <form action={accion} className="mt-5 flex flex-col gap-4">
        <CasillaTerminos />
        {estado.error && (
          <p role="alert" className="text-sm font-medium text-peligro">
            {estado.error === "terminos" ? t("falta") : t("error")}
          </p>
        )}
        <Button type="submit" cargando={cargando}>
          {t("continuar")}
        </Button>
      </form>
      <form action={cerrarSesion} className="mt-3 text-center">
        <button
          type="submit"
          className="text-sm font-semibold text-tinta-suave underline-offset-4 hover:underline"
        >
          {t("salir")}
        </button>
      </form>
    </Card>
  );
}
