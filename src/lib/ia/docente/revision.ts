import { RevisionEntrega, type DetalleEntrega, type Tarea } from "@/types/contratos";
import { llamarMuse, type MensajeIA } from "../cliente";
import type { Llamador } from "./index";
import { PROMPT_REVISION_ENTREGA, mensajeComentario } from "../prompts/docente";

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
    mensajes: [{ role: "user", content }], esquema: RevisionEntrega, maxTokens: 3500,
  });
  return RevisionEntrega.parse(r.datos);
}
