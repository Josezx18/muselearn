"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Textarea, Card, Badge, useToast } from "@/components/ui";
import { entregar } from "@/lib/api-cliente";
import { Adjunto } from "@/types/contratos";

const MAX_FOTOS = 4;
const MAX_DIMENSION = 1600;
const CALIDAD_JPEG = 0.8;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_TAMANO = 10 * 1024 * 1024; // 10 MB

interface FormularioEntregaProps {
  tareaId: string;
  entregaExistente?: { estado: string; adjuntos: Adjunto[]; contenido_texto: string } | null;
  alEntregar: (entrega: { id: string; estado: string }) => void;
}

export function FormularioEntrega({ tareaId, entregaExistente, alEntregar }: FormularioEntregaProps) {
  const t = useTranslations("tareas");
  const avisar = useToast();
  const [contenido, setContenido] = useState(entregaExistente?.contenido_texto ?? "");
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [fotosPrevias, setFotosPrevias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [comprimiendo, setComprimiendo] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const camaraRef = useRef<HTMLInputElement>(null);

  const yaEntregada = entregaExistente?.estado === "entregada" || entregaExistente?.estado === "verificando" || entregaExistente?.estado === "verificada";

  const comprimirImagen = useCallback(async (archivo: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(archivo);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo crear contexto"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Error al comprimir"));
            const nombre = archivo.name.replace(/\.[^.]+$/, ".jpg");
            resolve(new File([blob], nombre, { type: "image/jpeg" }));
          },
          "image/jpeg",
          CALIDAD_JPEG
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Error al cargar imagen"));
      };
      img.src = url;
    });
  }, []);

  const manejarArchivos = useCallback(async (archivos: FileList | File[]) => {
    const validos: File[] = [];
    const previas: string[] = [];
    for (const archivo of Array.from(archivos)) {
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        avisar(t("entrega.adjuntosErrorTipo"), "error");
        continue;
      }
      if (archivo.size > MAX_TAMANO) {
        avisar(t("entrega.adjuntosErrorTamano"), "error");
        continue;
      }
      if (archivo.type.startsWith("image/") && adjuntos.length + validos.length + fotosPrevias.length < MAX_FOTOS) {
        setComprimiendo(validos.length);
        try {
          const comprimido = await comprimirImagen(archivo);
          validos.push(comprimido);
          previas.push(URL.createObjectURL(comprimido));
        } catch {
          avisar("Error al comprimir la imagen", "error");
        } finally {
          setComprimiendo(null);
        }
      } else {
        validos.push(archivo);
      }
    }
    setAdjuntos((a) => [...a, ...validos]);
    setFotosPrevias((p) => [...p, ...previas]);
  }, [adjuntos.length, fotosPrevias.length, avisar, t, comprimirImagen]);

  const tomarFoto = useCallback(() => {
    camaraRef.current?.click();
  }, []);

  const manejarCamara = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      manejarArchivos(e.target.files);
    }
    if (e.target) e.target.value = "";
  }, [manejarArchivos]);

  const quitarAdjunto = useCallback((idx: number, esFoto: boolean) => {
    if (esFoto) {
      setFotosPrevias((p) => { URL.revokeObjectURL(p[idx]); return p.filter((_, i) => i !== idx); });
      setAdjuntos((a) => a.filter((_, i) => i !== idx));
    } else {
      setAdjuntos((a) => a.filter((_, i) => i !== idx));
    }
  }, []);

  const validar = useCallback(() => {
    if (!contenido.trim() && adjuntos.length === 0 && fotosPrevias.length === 0) {
      avisar("Debes escribir algo o adjuntar al menos un archivo", "error");
      return false;
    }
    return true;
  }, [contenido, adjuntos.length, fotosPrevias.length, avisar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (yaEntregada) {
      avisar(t("entrega.yaEntregada"), "info");
      return;
    }
    if (!validar()) return;
    setCargando(true);
    try {
      const adjuntosParaEnviar: Adjunto[] = adjuntos.map((a) => ({
        nombre: a.name,
        ruta: `local/${a.name}`,
        tipo_mime: a.type,
      }));
      const resultado = await entregar({ tarea_id: tareaId, contenido_texto: contenido, adjuntos: adjuntosParaEnviar });
      alEntregar(resultado);
      avisar(t("entrega.exito"), "exito");
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      if (mensaje.includes("no_encontrado") || mensaje.includes("no_permitido")) {
        avisar(t("entrega.noPermitido"), "error");
      } else {
        avisar(t("entrega.error"), "error");
      }
    } finally {
      setCargando(false);
    }
  }

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
    <Card className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">{t("entrega.titulo")}</h2>

      {yaEntregada && (
        <div className="p-3 rounded-lg bg-primario-claro border border-primario text-primario-fuerte text-center">
          <Badge tono={obtenerTonoEstado(entregaExistente?.estado ?? "pendiente")}>{obtenerEstadoTexto(entregaExistente?.estado ?? "pendiente")}</Badge>
        </div>
      )}

      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <label htmlFor="contenido" className="block text-sm font-medium mb-1">
            {t("entrega.contenidoTexto")}
          </label>
          <Textarea
            id="contenido"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder={t("entrega.contenidoTextoPlaceholder")}
            rows={6}
            disabled={yaEntregada}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("entrega.adjuntos")}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {fotosPrevias.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt={`Foto ${i + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => quitarAdjunto(i, true)}
                  className="absolute -top-2 -right-2 rounded-full bg-negro/50 text-blanco p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t("entrega.adjuntosAgregar")}
                >
                  ×
                </button>
              </div>
            ))}
            {adjuntos.filter((a) => !a.type.startsWith("image/")).map((a, i) => (
              <Badge key={i} tono="neutro" className="gap-1" onClick={() => quitarAdjunto(i, false)}>
                {a.name} ({(a.size / 1024).toFixed(1)} KB)
                <button type="button" className="ml-1 hover:text-tinta">×</button>
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              multiple
              onChange={(e) => e.target.files && manejarArchivos(e.target.files)}
              className="sr-only"
              id="inputAdjuntosEntrega"
              disabled={yaEntregada}
            />
            <Button
              variante="secundario"
              tamano="sm"
              onClick={() => inputRef.current?.click()}
              disabled={yaEntregada}
            >
              {t("entrega.adjuntosAgregar")}
            </Button>
            <input
              ref={camaraRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={manejarCamara}
              className="sr-only"
              id="inputCamara"
              disabled={yaEntregada || fotosPrevias.length >= MAX_FOTOS}
            />
            {fotosPrevias.length < MAX_FOTOS && !yaEntregada && (
              <Button variante="secundario" tamano="sm" onClick={tomarFoto}>
                📷 {t("entrega.tomarFoto")}
              </Button>
            )}
            {fotosPrevias.length > 0 && (
              <span className="text-sm text-tinta-suave self-center">{t("entrega.maxFotos")}: {fotosPrevias.length}/{MAX_FOTOS}</span>
            )}
          </div>
        </div>

        {comprimiendo !== null && (
          <div className="text-sm text-tinta-suave text-center">{t("entrega.comprimiendo")} {comprimiendo + 1}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variante="secundario" onClick={() => {}} disabled={cargando || yaEntregada}>
            {t("entrega.cancelar")}
          </Button>
          <Button disabled={cargando || yaEntregada} cargando={cargando}>
            {cargando ? t("entrega.entregando") : t("entrega.entregar")}
          </Button>
        </div>
      </form>
    </Card>
  );
}