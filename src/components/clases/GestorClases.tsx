"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Card, Skeleton, useToast } from "@/components/ui";
import { listarClases, listarEstudiantes } from "@/lib/api-cliente";
import type { Clase } from "@/types/contratos";
import { FormularioClase } from "./FormularioClase";

type Fila = Clase & { estudiantes: number | null };

/** Pantalla del docente: formulario "Nueva clase" + lista de sus clases con código copiable y nº de estudiantes. */
export function GestorClases() {
  const t = useTranslations("clases");
  const avisar = useToast();
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [error, setError] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const clases = await listarClases();
      const conteos = await Promise.all(clases.map((c) => listarEstudiantes(c.id).then((e) => e.length, () => null)));
      setFilas(clases.map((c, i) => ({ ...c, estudiantes: conteos[i] })));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    void cargar();
  }, [cargar]);

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      avisar(t("lista.copiado"), "exito");
    } catch {
      avisar(codigo, "info"); // sin permiso de portapapeles: al menos se muestra el código
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("titulo")}</h1>
        <Button tamano="sm" onClick={() => setFormularioAbierto((a) => !a)} aria-expanded={formularioAbierto}>
          {t("nueva.boton")}
        </Button>
      </div>

      {formularioAbierto && (
        <FormularioClase
          alCrear={() => {
            setFormularioAbierto(false);
            void cargar();
          }}
        />
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-peligro">
          {t("lista.error")}
        </p>
      )}

      {!filas && !error && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {filas?.length === 0 && <Card className="text-center text-tinta-suave">{t("lista.vacio")}</Card>}

      <ul className="grid gap-3 sm:grid-cols-2">
        {filas?.map((c) => (
          <li key={c.id}>
            <Card className="flex h-full flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold">{c.nombre}</h2>
                <p className="text-sm text-tinta-suave">
                  {c.materia} · {c.grado}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-tinta-suave">{t("lista.codigo")}</span>
                  <code className="rounded-lg bg-primario-claro px-2.5 py-1 font-mono text-lg font-bold tracking-widest text-primario-fuerte">
                    {c.codigo_inscripcion}
                  </code>
                </div>
                <Button variante="secundario" tamano="sm" onClick={() => copiar(c.codigo_inscripcion)}>
                  {t("lista.copiar")}
                </Button>
              </div>
              {c.estudiantes !== null && <Badge className="self-start">{t("lista.estudiantes", { cantidad: c.estudiantes })}</Badge>}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
