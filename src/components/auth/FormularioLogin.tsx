"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, Input } from "@/components/ui";
import { iniciarSesion, type EstadoForm } from "./acciones";
import { BotonGoogle, SeparadorO } from "./BotonGoogle";

export function FormularioLogin({ conGoogle = false, errorGoogle = false }: { conGoogle?: boolean; errorGoogle?: boolean }) {
  const t = useTranslations("auth");
  const [estado, accion, cargando] = useActionState<EstadoForm, FormData>(iniciarSesion, {});

  return (
    <Card>
      <h1 className="text-2xl font-extrabold tracking-tight">{t("login.titulo")}</h1>
      <p className="mt-1 text-sm text-tinta-suave">{t("login.subtitulo")}</p>
      {errorGoogle && (
        <p role="alert" className="mt-4 rounded-xl bg-peligro-claro p-3 text-sm font-medium text-peligro">
          {t("google.error")}
        </p>
      )}
      {conGoogle && (
        <div className="mt-5 grid gap-4">
          <BotonGoogle />
          <SeparadorO />
        </div>
      )}
      <form action={accion} className="mt-5 flex flex-col gap-4">
        <Input name="correo" type="email" etiqueta={t("campos.correo")} autoComplete="email" required />
        <Input name="contrasena" type="password" etiqueta={t("campos.contrasena")} autoComplete="current-password" required />
        <Link href="/recuperar" className="-mt-2 self-end text-sm font-semibold text-primario">
          {t("login.olvide")}
        </Link>
        {estado.error && (
          <p role="alert" className="text-sm font-medium text-peligro">
            {t(`errores.${estado.error}`)}
          </p>
        )}
        <Button type="submit" cargando={cargando}>
          {t("login.entrar")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-tinta-suave">
        {t("login.sinCuenta")}{" "}
        <Link href="/registro" className="font-semibold text-primario">
          {t("login.crearCuenta")}
        </Link>
      </p>
    </Card>
  );
}
