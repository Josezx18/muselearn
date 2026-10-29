"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, Input } from "@/components/ui";
import { solicitarRecuperacion, type EstadoForm } from "./acciones";

/** "¿Olvidaste tu contraseña?": envía un enlace al correo para crear una nueva. */
export function FormularioRecuperar({ enlaceVencido = false }: { enlaceVencido?: boolean }) {
  const t = useTranslations("auth");
  const [estado, accion, cargando] = useActionState<EstadoForm, FormData>(solicitarRecuperacion, {});

  return (
    <Card>
      <h1 className="text-2xl font-extrabold tracking-tight">{t("recuperar.titulo")}</h1>
      <p className="mt-1 text-sm text-tinta-suave">{t("recuperar.subtitulo")}</p>
      {enlaceVencido && !estado.enviado && (
        <p role="alert" className="mt-4 rounded-xl bg-peligro-claro p-3 text-sm font-medium text-peligro">
          {t("recuperar.enlaceVencido")}
        </p>
      )}
      {estado.enviado ? (
        <div role="status" className="mt-5 rounded-xl bg-primario-claro p-4">
          <p className="font-bold">{t("recuperar.enviadoTitulo")}</p>
          <p className="mt-1 text-sm">{t("recuperar.enviado")}</p>
        </div>
      ) : (
        <form action={accion} className="mt-5 flex flex-col gap-4">
          <Input name="correo" type="email" etiqueta={t("campos.correo")} autoComplete="email" required />
          {estado.error && (
            <p role="alert" className="text-sm font-medium text-peligro">
              {t(`errores.${estado.error}`)}
            </p>
          )}
          <Button type="submit" cargando={cargando}>
            {t("recuperar.enviar")}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-tinta-suave">
        <Link href="/login" className="font-semibold text-primario">
          {t("recuperar.volver")}
        </Link>
      </p>
    </Card>
  );
}
