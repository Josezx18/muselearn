"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Card, Textarea, useToast } from "@/components/ui";
import { entregar, subirAdjuntoEntrega } from "@/lib/api-cliente";
import type { Adjunto, Entrega, Modalidad } from "@/types/contratos";

const MAX_FOTOS = 4;
const MAX_ARCHIVOS = 8;
const MAX_LADO = 1600; // px
const CALIDAD_JPEG = 0.8;
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

interface Elemento {
  clave: string;
  archivo: File;
  vista: string | null; // URL de vista previa (solo imágenes)
}

export interface FormularioEntregaProps {
  tareaId: string;
  /** Dónde se entrega la tarea: fuera de MuseLearn, aquí se sube una evidencia y se marca "ya la entregué". */
  modalidad?: Modalidad;
  entregaExistente?: Pick<Entrega, "estado" | "adjuntos" | "contenido_texto"> | null;
  alEntregar: (entrega: Entrega) => void;
}

/** Reduce la foto a máx. 1600 px por lado y la convierte a JPEG 80 %. */
function comprimir(archivo: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(img.width * escala);
      lienzo.height = Math.round(img.height * escala);
      const ctx = lienzo.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
      lienzo.toBlob(
        (blob) => (blob ? resolve(new File([blob], archivo.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })) : reject(new Error("blob"))),
        "image/jpeg",
        CALIDAD_JPEG,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagen"));
    };
    img.src = url;
  });
}

export function FormularioEntrega({ tareaId, modalidad = "muselearn", entregaExistente, alEntregar }: FormularioEntregaProps) {
  const t = useTranslations("tareas");
  const avisar = useToast();
  const [texto, setTexto] = useState(entregaExistente?.contenido_texto ?? "");
  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const externa = modalidad === "classroom" || modalidad === "otra";
  const [yaEntregada, setYaEntregada] = useState(false);
  const archivosRef = useRef<HTMLInputElement>(null);
  const camaraRef = useRef<HTMLInputElement>(null);

  const bloqueada = entregaExistente?.estado === "entregada" || entregaExistente?.estado === "verificando" || entregaExistente?.estado === "verificada";
  const fotos = elementos.filter((e) => e.vista).length;

  // Liberar las URLs de vista previa al desmontar.
  const elementosRef = useRef(elementos);
  useEffect(() => {
    elementosRef.current = elementos;
  }, [elementos]);
  useEffect(() => () => elementosRef.current.forEach((e) => e.vista && URL.revokeObjectURL(e.vista)), []);

  async function agregar(lista: FileList | null) {
    if (!lista?.length) return;
    const nuevos: Elemento[] = [];
    let fotosLibres = MAX_FOTOS - fotos;
    setComprimiendo(true);
    for (const original of Array.from(lista)) {
      if (elementos.length + nuevos.length >= MAX_ARCHIVOS) break;
      if (!TIPOS.includes(original.type)) {
        avisar(t("entrega.adjuntosErrorTipo"), "error");
        continue;
      }
      const esImagen = original.type.startsWith("image/");
      if (esImagen && fotosLibres <= 0) {
        avisar(t("entrega.fotosLlenas"), "error");
        continue;
      }
      let archivo = original;
      if (esImagen) {
        try {
          archivo = await comprimir(original);
        } catch {
          avisar(t("entrega.errorCompresion"), "error");
          continue;
        }
        fotosLibres--;
      }
      if (archivo.size > MAX_BYTES) {
        avisar(t("entrega.adjuntosErrorTamano"), "error");
        continue;
      }
      nuevos.push({ clave: crypto.randomUUID(), archivo, vista: esImagen ? URL.createObjectURL(archivo) : null });
    }
    setComprimiendo(false);
    setElementos((actuales) => [...actuales, ...nuevos]);
  }

  function quitar(clave: string) {
    setElementos((actuales) => {
      const quitado = actuales.find((e) => e.clave === clave);
      if (quitado?.vista) URL.revokeObjectURL(quitado.vista);
      return actuales.filter((e) => e.clave !== clave);
    });
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (bloqueada) return avisar(t("entrega.yaEntregada"), "info");
    if (!texto.trim() && elementos.length === 0) return avisar(t(externa ? "entrega.vaciaEvidencia" : "entrega.vacia"), "error");
    if (externa && !yaEntregada) return avisar(t("entrega.marcarExterna"), "error");
    setEnviando(true);
    try {
      // 1) Subir cada archivo a Storage (carpeta del estudiante).  2) Entregar con las rutas reales.
      const adjuntos: Adjunto[] = [];
      for (const e of elementos) adjuntos.push(await subirAdjuntoEntrega(tareaId, e.archivo));
      const entrega = await entregar({ tarea_id: tareaId, contenido_texto: texto.trim(), adjuntos, entregada_externamente: externa && yaEntregada });
      avisar(t("entrega.exito"), "exito");
      alEntregar(entrega);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "";
      avisar(t(/no_inscrito|no_tu_clase/.test(mensaje) ? "entrega.noPermitido" : "entrega.error"), "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{t(externa ? "entrega.tituloEvidencia" : "entrega.titulo")}</h2>
      {modalidad !== "muselearn" && !bloqueada && <p className="-mt-2 text-sm text-tinta-suave">{t(`entrega.ayuda.${modalidad}`)}</p>}

      {bloqueada && entregaExistente && (
        <div className="flex items-center gap-2 rounded-xl border border-borde bg-primario-claro p-3 text-sm text-primario-fuerte">
          <Badge tono={entregaExistente.estado === "verificada" ? "acento" : "primario"}>{t(`estados.${entregaExistente.estado}`)}</Badge>
          {t("entrega.yaEntregada")}
        </div>
      )}

      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <label htmlFor="entrega-texto" className="mb-1 block text-sm font-medium">
            {t("entrega.contenidoTexto")}
          </label>
          <Textarea
            id="entrega-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t(externa ? "entrega.evidenciaPlaceholder" : "entrega.contenidoTextoPlaceholder")}
            rows={6}
            maxLength={20000}
            disabled={bloqueada}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("entrega.adjuntos")}</span>

          {elementos.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {elementos.map((e, i) =>
                e.vista ? (
                  <li key={e.clave} className="relative">
                    {/* Vista previa local (blob:) — next/image no aplica aquí. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.vista} alt={t("entrega.fotoAlt", { numero: i + 1 })} width="80" height="80" className="h-20 w-20 rounded-lg border border-borde object-cover" />
                    <button
                      type="button"
                      onClick={() => quitar(e.clave)}
                      aria-label={t("entrega.quitar")}
                      className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-tinta text-sm text-superficie"
                    >
                      ×
                    </button>
                  </li>
                ) : (
                  <li key={e.clave}>
                    <Badge tono="neutro" className="gap-2">
                      <span className="max-w-40 truncate">{e.archivo.name}</span>
                      <button type="button" onClick={() => quitar(e.clave)} aria-label={t("entrega.quitar")}>
                        ×
                      </button>
                    </Badge>
                  </li>
                ),
              )}
            </ul>
          )}

          <input
            ref={camaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            aria-label={t("entrega.tomarFoto")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void agregar(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={archivosRef}
            type="file"
            accept="application/pdf,image/*"
            multiple
            aria-label={t("entrega.adjuntosAgregar")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void agregar(e.target.files);
              e.target.value = "";
            }}
          />

          {!bloqueada && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variante="secundario" onClick={() => camaraRef.current?.click()} disabled={fotos >= MAX_FOTOS || comprimiendo}>
                📷 {t("entrega.tomarFoto")}
              </Button>
              <Button type="button" variante="secundario" tamano="sm" onClick={() => archivosRef.current?.click()} disabled={elementos.length >= MAX_ARCHIVOS || comprimiendo}>
                {t("entrega.adjuntosAgregar")}
              </Button>
              <span className="text-sm text-tinta-suave">{t("entrega.contadorFotos", { fotos, maximo: MAX_FOTOS })}</span>
            </div>
          )}
          {comprimiendo && <p className="text-sm text-tinta-suave">{t("entrega.comprimiendo")}</p>}
        </div>

        {externa && !bloqueada && (
          <label className="flex items-start gap-3 rounded-xl border-2 border-borde p-3 has-[:checked]:border-primario has-[:checked]:bg-primario-claro">
            <input type="checkbox" checked={yaEntregada} onChange={(e) => setYaEntregada(e.target.checked)} className="mt-1 size-5 accent-[var(--color-primario)]" />
            <span className="text-sm font-medium">{t(`entrega.confirmarExterna.${modalidad}`)}</span>
          </label>
        )}

        {!bloqueada && (
          <div className="flex justify-end">
            <Button type="submit" disabled={enviando || comprimiendo} cargando={enviando}>
              {enviando ? t("entrega.entregando") : t("entrega.entregar")}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
