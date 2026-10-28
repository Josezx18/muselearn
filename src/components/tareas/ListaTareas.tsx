"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, Badge, Skeleton } from "@/components/ui";
import { listarTareas } from "@/lib/api-cliente";
import type { Tarea } from "@/types/contratos";
import { FormularioTarea } from "./FormularioTarea";

interface ListaTareasProps {
  claseId: string;
}

export function ListaTareas({ claseId }: ListaTareasProps) {
  const t = useTranslations("tareas");
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[] | null>(null);
  const [error, setError] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | undefined>(undefined);

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

  async function guardarTarea() {
    setFormularioAbierto(false);
    setTareaEditando(undefined);
    await cargar();
  }

  function editar(tarea: Tarea) {
    setTareaEditando(tarea);
    setFormularioAbierto(true);
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
        <Button tamano="sm" onClick={() => { setTareaEditando(undefined); setFormularioAbierto(true); }}>
          {t("nueva.boton")}
        </Button>
      </div>

      {formularioAbierto && (
        <FormularioTarea
          claseId={claseId}
          tareaExistente={tareaEditando}
          alGuardar={guardarTarea}
          alCancelar={() => { setFormularioAbierto(false); setTareaEditando(undefined); }}
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
                  {t("detalle.fechaEntrega")} {new Date(tarea.fecha_entrega).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                <div className="flex gap-2">
                  <Button variante="secundario" tamano="sm" onClick={() => editar(tarea)}>
                    {t("lista.editar")}
                  </Button>
                  <Button variante="primario" tamano="sm" onClick={() => verEntregas(tarea.id)}>
                    {t("lista.verEntregas")}
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}