"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, Badge, Skeleton } from "@/components/ui";
import { listarEntregas, listarEstudiantes } from "@/lib/api-cliente";
import type { Tarea, Entrega, Usuario } from "@/types/contratos";

interface DetalleTareaDocenteProps {
  tarea: Tarea;
}

const ESTADO_ORDEN: Record<string, number> = { pendiente: 0, entregada: 1, verificando: 2, verificada: 3 };

export function DetalleTareaDocente({ tarea }: DetalleTareaDocenteProps) {
  const t = useTranslations("tareas");
  const [entregas, setEntregas] = useState<Entrega[] | null>(null);
  const [estudiantes, setEstudiantes] = useState<Usuario[] | null>(null);
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [ents, ests] = await Promise.all([
        listarEntregas(tarea.id),
        listarEstudiantes(tarea.clase_id),
      ]);
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

  if (error) return <p role="alert" className="text-sm font-medium text-peligro">{t("lista.error")}</p>;

  const entregasPorEstudiante = new Map(entregas?.map((e) => [e.estudiante_id, e]) ?? []);
  const filas = estudiantes?.map((est) => ({
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
          <p className="text-tinta-suave">{t("detalle.fechaEntrega")} {new Date(tarea.fecha_entrega).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <Badge tono="primario">{obtenerNivelAyudaTexto(tarea.nivel_ayuda)}</Badge>
      </div>

      <Card className="prose prose-sm max-w-none">
        <h3 className="font-semibold mb-2">{t("detalle.instrucciones")}</h3>
        <div className="whitespace-pre-wrap text-tinta">{tarea.instrucciones}</div>
      </Card>

      {tarea.competencias.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">{t("detalle.competencias")}</h3>
          <div className="flex flex-wrap gap-1">
            {tarea.competencias.map((c, i) => (
              <Badge key={i} tono="neutro">{c}</Badge>
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
                <a href={a.ruta} target="_blank" rel="noopener noreferrer" className="text-primario hover:underline">
                  {a.nombre}
                </a>
                <span className="text-tinta-suave">({a.tipo_mime})</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold mb-3">{t("detalle.estudiantes")} ({filas.length})</h2>
        {filas.length === 0 ? (
          <Card className="text-center text-tinta-suave">{t("lista.sinEntregas")}</Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-borde">
                  <th className="text-left p-2 font-medium">{t("detalle.estudiante")}</th>
                  <th className="text-left p-2 font-medium">{t("detalle.estado")}</th>
                  <th className="text-left p-2 font-medium">{t("detalle.entrega")}</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(({ estudiante, entrega }) => (
                  <tr key={estudiante.id} className="border-b border-borde/50">
                    <td className="p-2 font-medium">{estudiante.nombre}</td>
                    <td className="p-2">
                      {entrega ? (
                        <Badge tono={obtenerTonoEstado(entrega.estado)}>
                          {obtenerEstadoTexto(entrega.estado)}
                        </Badge>
                      ) : (
                        <Badge tono="neutro">{obtenerEstadoTexto("pendiente")}</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      {entrega ? (
                        <Button variante="secundario" tamano="sm" onClick={() => {}}>
                          {t("detalle.verEntrega")}
                        </Button>
                      ) : (
                        <span className="text-tinta-suave">{t("detalle.sinEntrega")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}