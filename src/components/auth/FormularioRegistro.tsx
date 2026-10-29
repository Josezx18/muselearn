"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, Input } from "@/components/ui";
import { registrarse, type EstadoForm } from "./acciones";
import { BotonGoogleEnFormulario, SeparadorO } from "./BotonGoogle";

const ROLES = ["estudiante", "docente"] as const;

export function FormularioRegistro({ conGoogle = false }: { conGoogle?: boolean }) {
  const t = useTranslations("auth");
  const [estado, accion, cargando] = useActionState<EstadoForm, FormData>(registrarse, {});

  return (
    <Card>
      <h1 className="text-2xl font-extrabold tracking-tight">{t("registro.titulo")}</h1>
      <p className="mt-1 text-sm text-tinta-suave">{t("registro.subtitulo")}</p>
      <form action={accion} className="mt-5 flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">{t("campos.rol")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((rol, i) => (
              <label
                key={rol}
                className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-borde bg-superficie text-sm font-semibold has-[:checked]:border-primario has-[:checked]:bg-primario-claro has-[:checked]:text-primario-fuerte"
              >
                <input type="radio" name="rol" value={rol} defaultChecked={i === 0} className="sr-only" />
                {t(`roles.${rol}`)}
              </label>
            ))}
          </div>
        </fieldset>
        {conGoogle && (
          <>
            <BotonGoogleEnFormulario />
            <SeparadorO />
          </>
        )}
        <Input name="nombre" etiqueta={t("campos.nombre")} autoComplete="name" required minLength={2} maxLength={80} />
        <Input name="correo" type="email" etiqueta={t("campos.correo")} autoComplete="email" required />
        <Input
          name="contrasena"
          type="password"
          etiqueta={t("campos.contrasena")}
          ayuda={t("campos.contrasenaAyuda")}
          autoComplete="new-password"
          required
          minLength={8}
        />
        {estado.error && (
          <p role="alert" className="text-sm font-medium text-peligro">
            {t(`errores.${estado.error}`)}
          </p>
        )}
        <Button type="submit" cargando={cargando}>
          {t("registro.crear")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-tinta-suave">
        {t("registro.conCuenta")}{" "}
        <Link href="/login" className="font-semibold text-primario">
          {t("registro.entrar")}
        </Link>
      </p>
    </Card>
  );
}
