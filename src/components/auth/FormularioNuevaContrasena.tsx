"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, Input } from "@/components/ui";
import { guardarNuevaContrasena, type EstadoForm } from "./acciones";

/** Se llega desde el enlace del correo de recuperación (que ya abrió la sesión). */
export function FormularioNuevaContrasena({ conSesion }: { conSesion: boolean }) {
  const t = useTranslations("auth");
  const [estado, accion, cargando] = useActionState<EstadoForm, FormData>(guardarNuevaContrasena, {});
  const vencido = !conSesion || estado.error === "enlace_vencido";

  return (
    <Card>
      <h1 className="text-2xl font-extrabold tracking-tight">{t("nueva.titulo")}</h1>
      {vencido ? (
        <>
          <p role="alert" className="mt-4 rounded-xl bg-peligro-claro p-3 text-sm font-medium text-peligro">
            {t("errores.enlace_vencido")}
          </p>
          <p className="mt-4 text-center text-sm">
            <Link href="/recuperar" className="font-semibold text-primario">
              {t("nueva.pedirOtro")}
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-tinta-suave">{t("nueva.subtitulo")}</p>
          <form action={accion} className="mt-5 flex flex-col gap-4">
            <Input
              name="contrasena"
              type="password"
              etiqueta={t("nueva.campo")}
              ayuda={t("campos.contrasenaAyuda")}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
            />
            {estado.error && (
              <p role="alert" className="text-sm font-medium text-peligro">
                {t(`errores.${estado.error}`)}
              </p>
            )}
            <Button type="submit" cargando={cargando}>
              {t("nueva.guardar")}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
