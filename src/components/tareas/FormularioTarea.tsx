"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Textarea, Card, Badge, useToast } from "@/components/ui";
import { Adjunto, Tarea, NivelAyuda } from "@/types/contratos";

type NuevaTarea = Omit<Tarea, "id" | "creada_en">;

interface FormularioTareaProps {
  claseId: string;
  tareaExistente?: Tarea;
  alGuardar: (datos: NuevaTarea, adjuntos: File[]) => Promise<void>;
  alCancelar: () => void;
}

const TIPOS_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_TAMANO = 10 * 1024 * 1024; // 10 MB

export function FormularioTarea({ claseId, tareaExistente, alGuardar, alCancelar }: FormularioTareaProps) {
  const t = useTranslations("tareas");
  const avisar = useToast();
  const [cargando, setCargando] = useState(false);
  const [titulo, setTitulo] = useState(tareaExistente?.titulo ?? "");
  const [instrucciones, setInstrucciones] = useState(tareaExistente?.instrucciones ?? "");
  const [fechaEntrega, setFechaEntrega] = useState(
    tareaExistente?.fecha_entrega ? new Date(tareaExistente.fecha_entrega).toISOString().slice(0, 16) : ""
  );
  const [competencias, setCompetencias] = useState<string[]>(tareaExistente?.competencias ?? []);
  const [nuevaCompetencia, setNuevaCompetencia] = useState("");
  const [nivelAyuda, setNivelAyuda] = useState<NivelAyuda>(tareaExistente?.nivel_ayuda ?? "pistas");
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [adjuntosExistentes, setAdjuntosExistentes] = useState<Adjunto[]>(tareaExistente?.adjuntos ?? []);

  const agregarCompetencia = useCallback(() => {
    const c = nuevaCompetencia.trim();
    if (c && !competencias.includes(c)) {
      setCompetencias([...competencias, c]);
      setNuevaCompetencia("");
    }
  }, [competencias, nuevaCompetencia]);

  const quitarCompetencia = useCallback((idx: number) => {
    setCompetencias(competencias.filter((_, i) => i !== idx));
  }, [competencias]);

  const manejarArchivos = useCallback((archivos: FileList | File[]) => {
    const validos: File[] = [];
    for (const archivo of Array.from(archivos)) {
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        avisar(t("formulario.adjuntosErrorTipo"), "error");
        continue;
      }
      if (archivo.size > MAX_TAMANO) {
        avisar(t("formulario.adjuntosErrorTamano"), "error");
        continue;
      }
      validos.push(archivo);
    }
    setAdjuntos((a) => [...a, ...validos]);
  }, [avisar, t]);

  const quitarAdjunto = useCallback((idx: number) => {
    setAdjuntos((a) => a.filter((_, i) => i !== idx));
  }, []);

  const quitarAdjuntoExistente = useCallback((idx: number) => {
    setAdjuntosExistentes((a) => a.filter((_, i) => i !== idx));
  }, []);

  const validar = useCallback(() => {
    if (!titulo.trim()) {
      avisar(t("errores.tituloRequerido"), "error");
      return false;
    }
    if (!fechaEntrega) {
      avisar(t("errores.fechaRequerida"), "error");
      return false;
    }
    if (new Date(fechaEntrega) <= new Date()) {
      avisar(t("errores.fechaPasado"), "error");
      return false;
    }
    return true;
  }, [titulo, fechaEntrega, avisar, t]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    try {
      const datos: NuevaTarea = {
        clase_id: claseId,
        titulo: titulo.trim(),
        instrucciones: instrucciones.trim(),
        fecha_entrega: new Date(fechaEntrega).toISOString(),
        competencias,
        nivel_ayuda: nivelAyuda,
        adjuntos: adjuntosExistentes,
      };
      await alGuardar(datos, adjuntos);
      avisar(t("nueva.exito"), "exito");
    } catch {
      avisar(t("nueva.error"), "error");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">{tareaExistente ? t("formulario.titulo") : t("nueva.titulo")}</h2>

      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium mb-1">
            {t("formulario.titulo")}
          </label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={t("formulario.tituloPlaceholder")}
            required
          />
        </div>

        <div>
          <label htmlFor="instrucciones" className="block text-sm font-medium mb-1">
            {t("formulario.instrucciones")}
          </label>
          <Textarea
            id="instrucciones"
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            placeholder={t("formulario.instruccionesPlaceholder")}
            rows={5}
          />
        </div>

        <div>
          <label htmlFor="fechaEntrega" className="block text-sm font-medium mb-1">
            {t("formulario.fechaEntrega")}
          </label>
          <Input
            id="fechaEntrega"
            type="datetime-local"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("formulario.competencias")}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {competencias.map((c, i) => (
              <Badge key={i} tono="primario" className="gap-1" onClick={() => quitarCompetencia(i)}>
                {c}
                <button type="button" className="ml-1 hover:text-tinta" aria-label={t("formulario.competenciasPlaceholder")}>
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={nuevaCompetencia}
              onChange={(e) => setNuevaCompetencia(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarCompetencia())}
              placeholder={t("formulario.competenciasPlaceholder")}
              className="flex-1"
            />
            <Button variante="secundario" tamano="sm" onClick={agregarCompetencia}>
              +
            </Button>
          </div>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">{t("formulario.nivelAyuda")}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["pistas", t("formulario.nivelAyudaPistas"), t("formulario.nivelAyudaPistasDesc")],
              ["ejemplos", t("formulario.nivelAyudaEjemplos"), t("formulario.nivelAyudaEjemplosDesc")],
              ["explicacion", t("formulario.nivelAyudaExplicacion"), t("formulario.nivelAyudaExplicacionDesc")],
            ] as const).map(([valor, label, desc]) => (
              <label key={valor} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="nivelAyuda"
                  value={valor}
                  checked={nivelAyuda === valor}
                  onChange={() => setNivelAyuda(valor as NivelAyuda)}
                  className="sr-only"
                />
                <div
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    nivelAyuda === valor
                      ? "border-primario bg-primario-claro"
                      : "border-borde hover:border-primario"
                  }`}
                >
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-tinta-suave mt-1">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium mb-1">{t("formulario.adjuntos")}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {adjuntos.map((a, i) => (
              <Badge key={i} tono="neutro" className="gap-1" onClick={() => quitarAdjunto(i)}>
                {a.name} ({(a.size / 1024).toFixed(1)} KB)
                <button type="button" className="ml-1 hover:text-tinta" aria-label={t("formulario.adjuntosAgregar")}>
                  ×
                </button>
              </Badge>
            ))}
            {adjuntosExistentes.map((a, i) => (
              <Badge key={a.ruta} tono="neutro" className="gap-1" onClick={() => quitarAdjuntoExistente(i)}>
                {a.nombre}
                <button type="button" className="ml-1 hover:text-tinta">×</button>
              </Badge>
            ))}
          </div>
          <input
            type="file"
            accept="application/pdf,image/*"
            multiple
            onChange={(e) => e.target.files && manejarArchivos(e.target.files)}
            className="sr-only"
            id="inputAdjuntos"
          />
          <Button variante="secundario" tamano="sm" onClick={() => document.getElementById("inputAdjuntos")?.click()}>
            {t("formulario.adjuntosAgregar")}
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variante="secundario" onClick={alCancelar} disabled={cargando}>
            {t("nueva.cancelar")}
          </Button>
          <Button disabled={cargando} cargando={cargando}>
            {cargando ? t("nueva.guardando") : t("nueva.guardar")}
          </Button>
        </div>
      </form>
    </Card>
  );
}