"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, Skeleton, useToast } from "@/components/ui";
import { ErrorApi, desconectarClassroom, importarCursoClassroom, listarCursosClassroom } from "@/lib/api-cliente";
import { Mascota } from "@/components/comun/mascotas/Mascota";
import type { z } from "zod";
import type { CursoClassroom, ResultadoImportacion } from "@/lib/api-cliente";

type Curso = z.infer<typeof CursoClassroom>;
type Resultado = z.infer<typeof ResultadoImportacion>;

/** Importar cursos de Google Classroom (modo de prueba): conectar, elegir curso, ver a quién se inscribió. */
export function ImportarClassroom({ errorInicial }: { errorInicial?: string }) {
  const t = useTranslations("docente.classroom");
  const locale = useLocale();
  const avisar = useToast();
  const [cursos, setCursos] = useState<Curso[] | null>(null);
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(errorInicial ?? null);
  const [importando, setImportando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCursos(await listarCursosClassroom());
      setConectado(true);
    } catch (e) {
      if (e instanceof ErrorApi && e.codigo === "sin_conexion") setConectado(false);
      else {
        setConectado(false);
        setError(e instanceof ErrorApi ? e.codigo : "error");
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    void cargar();
  }, [cargar]);

  async function importar(c: Curso) {
    setImportando(c.id);
    setError(null);
    try {
      const r = await importarCursoClassroom(c.id);
      setResultado(r);
      setCursos((lista) => lista?.map((x) => (x.id === c.id ? { ...x, clase_id: r.clase.id } : x)) ?? null);
    } catch (e) {
      const codigo = e instanceof ErrorApi ? e.codigo : "error";
      if (codigo === "sin_conexion") setConectado(false);
      setError(codigo);
    } finally {
      setImportando(null);
    }
  }

  const mensajeError = (c: string) =>
    ["sin_configurar", "denegado", "estado_invalido", "google", "sin_sesion", "no_tu_curso"].includes(c)
      ? t(`errores.${c}`)
      : t("errores.error");

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-3xl gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">{t("titulo")}</h1>
          <p className="mt-2 max-w-prose text-lg text-tinta-suave">{t("intro")}</p>
        </div>
        <Mascota expresion={importando ? "pensando" : resultado ? "lograste" : "hola"} viva className="hidden size-24 sm:block" />
      </header>

      <p className="rounded-2xl border-2 border-acento bg-acento-claro p-3 text-sm">{t("prueba")}</p>

      {error && (
        <p role="alert" className="rounded-2xl border-2 border-peligro bg-peligro-claro p-3 font-bold text-peligro">
          {mensajeError(error)}
        </p>
      )}

      {resultado && (
        <Card className="border-primario">
          <p className="text-lg font-bold">
            {t(resultado.nueva ? "resultado.nueva" : "resultado.actualizada", { nombre: resultado.clase.nombre })}
          </p>
          <p className="mt-1">
            {t("resultado.inscritos", { n: resultado.inscritos.length })} {t("resultado.yaEstaban", { n: resultado.yaEstaban })}
          </p>
          {resultado.inscritos.length > 0 && <p className="mt-1 text-sm text-tinta-suave">{resultado.inscritos.join(", ")}</p>}
          {resultado.sinCuenta.length > 0 && (
            <div className="mt-3 rounded-xl bg-fondo p-3">
              <p>{t("resultado.sinCuenta", { n: resultado.sinCuenta.length })}</p>
              <p className="mt-1 font-mono text-2xl font-extrabold tracking-[0.25em]">{resultado.clase.codigo_inscripcion}</p>
              <ul className="mt-2 grid gap-0.5 text-sm text-tinta-suave">
                {resultado.sinCuenta.map((a, i) => (
                  <li key={i}>
                    {a.nombre}
                    {a.correo ? ` · ${a.correo}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href={`/docente/clases/${resultado.clase.id}`}
            className="mt-3 inline-flex font-bold text-primario-fuerte underline-offset-4 hover:underline"
          >
            {t("irClase")} →
          </Link>
        </Card>
      )}

      {conectado === null ? (
        <Skeleton className="h-40" />
      ) : !conectado ? (
        <Card className="flex flex-col items-start gap-3">
          {/* Enlace normal (no fetch): Google necesita una navegación completa para pedir el permiso. */}
          <a
            href={`/api/integraciones/classroom/conectar?locale=${locale}`}
            className="inline-flex min-h-12 items-center gap-3 rounded-xl border-2 border-tinta bg-superficie px-5 font-bold shadow-[0_3px_0_0_var(--color-tinta)] active:translate-y-[2px] active:shadow-none"
          >
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-[#1e8e3e] text-sm font-extrabold text-white">
              GC
            </span>
            {t("conectar")}
          </a>
        </Card>
      ) : (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-primario-fuerte">✓ {t("conectado")}</p>
            <Button
              variante="fantasma"
              tamano="sm"
              onClick={async () => {
                await desconectarClassroom().catch(() => undefined);
                setConectado(false);
                setCursos(null);
                avisar(t("desconectar"), "info");
              }}
            >
              {t("desconectar")}
            </Button>
          </div>
          {!cursos ? (
            <p role="status">{t("cargando")}</p>
          ) : cursos.length === 0 ? (
            <Card className="text-tinta-suave">{t("sinCursos")}</Card>
          ) : (
            <ul className="grid gap-2">
              {cursos.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-borde bg-superficie p-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold">{c.nombre}</p>
                    {c.seccion && <p className="text-sm text-tinta-suave">{c.seccion}</p>}
                    {c.clase_id && <p className="text-xs font-bold text-primario-fuerte">{t("yaImportado")}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.clase_id && (
                      <Link
                        href={`/docente/clases/${c.clase_id}`}
                        className="inline-flex min-h-9 items-center px-2 text-sm font-bold text-primario-fuerte"
                      >
                        {t("irClase")}
                      </Link>
                    )}
                    <Button
                      tamano="sm"
                      variante={c.clase_id ? "secundario" : "primario"}
                      cargando={importando === c.id}
                      disabled={!!importando}
                      onClick={() => void importar(c)}
                    >
                      {c.clase_id ? t("actualizar") : t("importar")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Link href="/docente/integraciones" className="font-bold text-primario-fuerte underline-offset-4 hover:underline">
        ← {t("volver")}
      </Link>
    </div>
  );
}
