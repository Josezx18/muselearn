import { z } from "zod";
import { CumplimientoRevision, RevisionEntrega, type DetalleEntrega, type Tarea } from "@/types/contratos";
import { llamarMuse, type MensajeIA } from "../cliente";
import type { Llamador } from "./index";
import { PROMPT_REVISION_ENTREGA, mensajeComentario } from "../prompts/docente";

/**
 * Lo que se le pide al modelo: la misma forma que RevisionEntrega pero tolerante (sin múltiplos exactos, textos
 * vacíos o de más). Después se normaliza a RevisionEntrega, para que un detalle de formato no haga fallar la revisión.
 */
const RevisionModelo = z.object({
  cumple: CumplimientoRevision,
  resumen: z.string(),
  criterios: z.array(z.object({ criterio: z.string(), cumple: CumplimientoRevision, evidencia: z.string().default("") })).default([]),
  sugerencias_para_estudiante: z.array(z.string()).default([]),
  nota_sugerida: z.number().nullable().default(null),
  confianza: z.enum(["alta", "media", "baja"]),
});

export function normalizarRevision(r: z.infer<typeof RevisionModelo>): RevisionEntrega {
  const corta = (t: string, max: number, vacio = "—") => (t.trim() || vacio).slice(0, max);
  const nota = r.cumple === "no_se_puede" || r.nota_sugerida === null ? null : Math.round(Math.max(0, Math.min(100, r.nota_sugerida)) * 100) / 100;
  return RevisionEntrega.parse({
    cumple: r.cumple,
    resumen: corta(r.resumen, 2000),
    criterios: r.criterios.filter((c) => c.criterio.trim()).slice(0, 12).map((c) => ({ criterio: corta(c.criterio, 500), cumple: c.cumple, evidencia: corta(c.evidencia, 1000) })),
    sugerencias_para_estudiante: r.sugerencias_para_estudiante.map((x) => x.trim()).filter(Boolean).slice(0, 6).map((x) => x.slice(0, 600)),
    nota_sugerida: nota,
    confianza: r.confianza,
  });
}

/** Las imágenes se descargan con el cliente autenticado, nunca desde una URL aportada por el estudiante. */
export async function revisarEntrega(
  tarea: Tarea,
  detalle: DetalleEntrega,
  fotos: { tipo: string; base64: string }[] = [],
  llamar: Llamador = llamarMuse,
): Promise<RevisionEntrega> {
  const content: Extract<MensajeIA, { role: "user" }>["content"] = [
    { type: "text", text: mensajeComentario({
      tarea: { titulo: tarea.titulo, instrucciones: tarea.instrucciones, competencias: tarea.competencias, modalidad: tarea.modalidad },
      entrega: { texto: detalle.entrega.contenido_texto, archivos: detalle.adjuntos.map((a) => ({ nombre: a.nombre, tipo: a.tipo_mime })), imagenes_disponibles: fotos.length },
    }) },
    ...fotos.map((foto) => ({ type: "image_url" as const, image_url: { url: `data:${foto.tipo};base64,${foto.base64}` } })),
  ];
  const r = await llamar({
    // La ruta de visión es exclusivamente Meta, igual que el analizador de fotos.
    funcion: fotos.length ? "leer_cuaderno" : "docente",
    idioma: detalle.estudiante.idioma,
    sistema: PROMPT_REVISION_ENTREGA,
    mensajes: [{ role: "user", content }], esquema: RevisionModelo, maxTokens: 3500,
  });
  return normalizarRevision(RevisionModelo.parse(r.datos));
}
