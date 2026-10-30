"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button, Card, Badge, Dialog, Skeleton, useToast } from "@/components/ui";
import { borrarTarea, editarTarea, listarEntregasCalificadas, listarEstudiantes, subirAdjuntoTarea } from "@/lib/api-cliente";
import { useRouter } from "@/i18n/navigation";
import { enlaceArchivo } from "@/lib/archivos";
import { CalificacionEntrega } from "@/components/gestion/CalificacionEntrega";
import { DialogoEntrega } from "@/components/gestion/DialogoEntrega";
import { FormularioTarea } from "./FormularioTarea";
import type { Tarea, Entrega, Usuario } from "@/types/contratos";

interface DetalleTareaDocenteProps {
  tarea: Tarea;
}

const ESTADO_ORDEN: Record<string, number> = { pendiente: 0, entregada: 1, verificando: 2, verificada: 3 };

export function DetalleTareaDocente({ tarea: inicial }: DetalleTareaDocenteProps) {
  const t = useTranslations("tareas");
  const tg = useTranslations("gestion.tarea");
  const avisar = useToast();
  const router = useRouter();
  const [tarea, setTarea] = useState(inicial);
  const [editando, setEditando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [abierta, setAbierta] = useState<{ id: string; nombre: string } | null>(null);
  const formato = useFormatter();
  const [entregas, setEntregas] = useState<Entrega[] | null>(null);
  const [estudiantes, setEstudiantes] = useState<Usuario[] | null>(null);
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [ents, ests] = await Promise.all([listarEntregasCalificadas(tarea.id), listarEstudiantes(tarea.clase_id)]);
      setEntregas(ents);
      setEstudiantes(ests);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, [tarea.id, tarea.clase_id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error)
    return (
      <p role="alert" className="text-sm font-medium text-peligro">
        {t("lista.error")}
      </p>
    );

  const entregasPorEstudiante = new Map(entregas?.map((e) => [e.estudiante_id, e]) ?? []);
  const filas =
    estudiantes?.map((est) => ({
      estudiante: est,
      entrega: entregasPorEstudiante.get(est.id) ?? null,
    })) ?? [];

  filas.sort((a, b) => {
    const ea = a.entrega ? ESTADO_ORDEN[a.entrega.estado] : -1;
    const eb = b.entrega ? ESTADO_ORDEN[b.entrega.estado] : -1;
    return eb - ea;
  });

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

  const obtenerEstadoTexto = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return t("estados.pendiente");
      case "entregada":
        return t("estados.entregada");
      case "verificando":
        return t("estados.verificando");
      case "verificada":
        return t("estados.verificada");
      default:
        return estado;
    }
  };

  const obtenerTonoEstado = (estado: string): "neutro" | "primario" | "acento" | "peligro" => {
    switch (estado) {
      case "verificada":
        return "acento";
      case "verificando":
        return "peligro";
      case "entregada":
        return "primario";
      default:
        return "neutro";
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{tarea.titulo}</h1>
          <p className="text-tinta-suave">
            {t("detalle.fechaEntrega")} {formato.dateTime(new Date(tarea.fecha_entrega), { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tono="primario">{obtenerNivelAyudaTexto(tarea.nivel_ayuda)}</Badge>
          <Badge tono="neutro">{t(`modalidad.${tarea.modalidad}`)}</Badge>
          <Button variante="secundario" tamano="sm" onClick={() => setEditando(true)}>
            {tg("editar")}
          </Button>
          <Button variante="fantasma" tamano="sm" className="text-peligro" onClick={() => setBorrando(true)}>
            {tg("borrar")}
          </Button>
        </div>
      </div>

      {editando && (
        <FormularioTarea
          claseId={tarea.clase_id}
          tareaExistente={tarea}
          alCancelar={() => setEditando(false)}
          alGuardar={async (datos, archivos) => {
            const nuevos = await Promise.all(archivos.map((a) => subirAdjuntoTarea(tarea.id, a)));
            const editada = await editarTarea(tarea.id, {
              titulo: datos.titulo,
              instrucciones: datos.instrucciones,
              fecha_entrega: datos.fecha_entrega,
              competencias: datos.competencias,
              nivel_ayuda: datos.nivel_ayuda,
              modalidad: datos.modalidad,
              enlace_externo: datos.enlace_externo,
            });
            setTarea({
              ...editada,
              adjuntos: [...editada.adjuntos, ...nuevos.filter((n) => !editada.adjuntos.some((a) => a.ruta === n.ruta))],
            });
            setEditando(false);
            avisar(tg("guardada"), "exito");
          }}
        />
      )}

      <Dialog abierto={borrando} alCerrar={() => setBorrando(false)} titulo={tg("borrar")}>
        <p>{tg("confirmarBorrar")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setBorrando(false)}>
            {tg("cancelar")}
          </Button>
          <Button
            variante="peligro"
            cargando={ocupado}
            onClick={async () => {
              setOcupado(true);
              try {
                await borrarTarea(tarea.id);
                avisar(tg("borrada"), "exito");
                router.push(`/docente/clases/${tarea.clase_id}`);
              } catch {
                avisar(t("lista.error"), "error");
                setOcupado(false);
              }
            }}
          >
            {tg("borrar")}
          </Button>
        </div>
      </Dialog>

      <Card className="prose prose-sm max-w-none">
        <h3 className="font-semibold mb-2">{t("detalle.instrucciones")}</h3>
        <div className="whitespace-pre-wrap text-tinta">{tarea.instrucciones}</div>
      </Card>

      {tarea.competencias.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">{t("detalle.competencias")}</h3>
          <div className="flex flex-wrap gap-1">
            {tarea.competencias.map((c, i) => (
              <Badge key={i} tono="neutro">
                {c}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {tarea.adjuntos.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">{t("detalle.adjuntos")}</h3>
          <ul className="flex flex-wrap gap-2">
            {tarea.adjuntos.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <a href={enlaceArchivo(a.ruta)} target="_blank" rel="noopener noreferrer" className="text-primario hover:underline">
                  {a.nombre}
                </a>
                <span className="text-tinta-suave">({a.tipo_mime})</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold mb-3">
          {t("detalle.estudiantes")} ({filas.length})
        </h2>
        {filas.length === 0 ? (
          <Card className="text-center text-tinta-suave">{t("lista.sinEntregas")}</Card>
        ) : (
          <ul className="grid gap-2">
            {filas.map(({ estudiante, entrega }) => (
              <li key={estudiante.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-borde bg-superficie p-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-bold">{estudiante.nombre}</span>
                  <Badge tono={entrega ? obtenerTonoEstado(entrega.estado) : "neutro"}>{obtenerEstadoTexto(entrega?.estado ?? "pendiente")}</Badge>
                </div>
                {entrega && <CalificacionEntrega key={`${entrega.id}-${entrega.estado}-${abierta?.id ?? "cerrada"}`} entregaId={entrega.id} resumen />}
                {entrega ? (
                  <Button variante="secundario" tamano="sm" onClick={() => setAbierta({ id: entrega.id, nombre: estudiante.nombre })}>
                    {t("detalle.verEntrega")}
                  </Button>
                ) : (
                  <span className="text-sm text-tinta-suave">{t("detalle.sinEntrega")}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <DialogoEntrega entregaId={abierta?.id ?? null} nombre={abierta?.nombre ?? ""} alCerrar={() => { setAbierta(null); void cargar(); }} />
    </div>
  );
}
