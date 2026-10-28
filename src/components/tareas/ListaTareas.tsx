"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, Badge, Skeleton } from "@/components/ui";
import { crearTarea, listarTareas, subirAdjuntoTarea, type NuevaTarea } from "@/lib/api-cliente";
import type { Tarea } from "@/types/contratos";
import { FormularioTarea } from "./FormularioTarea";

interface ListaTareasProps {
  claseId: string;
}

export function ListaTareas({ claseId }: ListaTareasProps) {
  const t = useTranslations("tareas");
  const router = useRouter();
  const formato = useFormatter();
  const [tareas, setTareas] = useState<Tarea[] | null>(null);
  const [error, setError] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await listarTareas(claseId);
      setTareas(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, [claseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    cargar();
  }, [cargar]);

  // Crea la tarea y luego sube sus adjuntos a Storage. Si falla, FormularioTarea muestra el error y queda abierto.
  async function guardarTarea(datos: NuevaTarea, archivos: File[]) {
    const tarea = await crearTarea(datos);
    for (const archivo of archivos) await subirAdjuntoTarea(tarea.id, archivo);
    setFormularioAbierto(false);
    await cargar();
  }

  function verEntregas(tareaId: string) {
    router.push(`/docente/tareas/${tareaId}`);
  }

  const obtenerNivelAyudaTexto = (nivel: string) => {
    switch (nivel) {
      case "pistas":
        return t("estados.pistas");
      case "ejemplos":
        return t("estados.ejemplos");
      case "explicacion":
        return t("estados.explicacion");
      default:
        return nivel;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("titulo")}</h2>
        <Button tamano="sm" onClick={() => setFormularioAbierto(true)}>
          {t("nueva.boton")}
        </Button>
      </div>

      {formularioAbierto && (
        <FormularioTarea
          claseId={claseId}
          alGuardar={guardarTarea}
          alCancelar={() => setFormularioAbierto(false)}
        />
      )}

      {error && <p role="alert" className="text-sm font-medium text-peligro">{t("lista.error")}</p>}

      {!tareas && !error && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {tareas?.length === 0 && !error && (
        <Card className="text-center text-tinta-suave">{t("lista.vacio")}</Card>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {tareas?.map((tarea) => (
          <li key={tarea.id}>
            <Card className="flex h-full flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold">{tarea.titulo}</h3>
                <p className="text-sm text-tinta-suave">
                  {t("detalle.fechaEntrega")} {formato.dateTime(new Date(tarea.fecha_entrega), { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              {tarea.competencias.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tarea.competencias.map((c, i) => (
                    <Badge key={i} tono="neutro">{c}</Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Badge tono="primario">{obtenerNivelAyudaTexto(tarea.nivel_ayuda)}</Badge>
                <Button variante="primario" tamano="sm" onClick={() => verEntregas(tarea.id)}>
                  {t("lista.verEntregas")}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}