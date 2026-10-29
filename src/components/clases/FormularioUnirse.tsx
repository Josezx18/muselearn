"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, Input } from "@/components/ui";
import { ErrorApi, unirseAClase } from "@/lib/api-cliente";
import type { Clase } from "@/types/contratos";

const ERRORES_CONOCIDOS = ["codigo_invalido", "no_existe", "ya_inscrito", "es_docente", "no_autenticado"];

/**
 * Pantalla "Unirme a una clase": el estudiante escribe el código de 6 caracteres.
 * `compacto` lo muestra dentro de otra pantalla (Mi perfil) y avisa con `alUnirse` en vez de mandar a Hoy.
 */
export function FormularioUnirse({ compacto = false, alUnirse }: { compacto?: boolean; alUnirse?: (clase: Clase) => void } = {}) {
  const t = useTranslations("clases.unirse");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unida, setUnida] = useState<Clase | null>(null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const codigo = String(new FormData(e.currentTarget).get("codigo") ?? "");
    setCargando(true);
    setError(null);
    try {
      const clase = await unirseAClase(codigo);
      setUnida(clase);
      alUnirse?.(clase);
    } catch (fallo) {
      const clave = fallo instanceof ErrorApi && ERRORES_CONOCIDOS.includes(fallo.codigo) ? fallo.codigo : "error";
      setError(clave);
    } finally {
      setCargando(false);
    }
  }

  if (unida && compacto) {
    return (
      <p role="status" className="rounded-xl bg-primario-claro p-3 font-bold">
        {t("exito", { nombre: unida.nombre })}
      </p>
    );
  }

  if (unida) {
    return (
      <Card className="text-center">
        <p role="status" className="text-lg font-semibold">
          {t("exito", { nombre: unida.nombre })}
        </p>
        <Link
          href="/estudiante/hoy"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primario px-4 font-semibold text-white hover:bg-primario-fuerte"
        >
          {t("irAHoy")}
        </Link>
      </Card>
    );
  }

  const Contenedor = compacto ? "div" : Card;
  return (
    <Contenedor>
      {!compacto && <h1 className="text-2xl font-extrabold tracking-tight">{t("titulo")}</h1>}
      <p className="mt-1 text-sm text-tinta-suave">{t("ayuda")}</p>
      <form onSubmit={enviar} className="mt-5 flex flex-col gap-4">
        <Input
          name="codigo"
          etiqueta={t("codigo")}
          error={error ? t(`errores.${error}`) : undefined}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={9}
          required
          className="text-center font-mono text-xl uppercase tracking-[0.3em]"
        />
        <Button type="submit" cargando={cargando}>
          {t("unirme")}
        </Button>
      </form>
    </Contenedor>
  );
}
