import { FechaHora, type Entrega, type InformeComprension } from "@/types/contratos";

/** La fecha de entrega cambia al corregir; las sesiones conservan su fecha de creación. */
export function sesionVigente(sesion: { creada_en?: unknown }, entrega: Entrega) {
  const fecha = FechaHora.safeParse(sesion.creada_en);
  return fecha.success && entrega.entregada_en !== null &&
    Date.parse(fecha.data) >= Date.parse(entrega.entregada_en);
}

export function informeDeSesion(informe: InformeComprension, sesion: { creada_en?: unknown }) {
  const fecha = FechaHora.safeParse(sesion.creada_en);
  return fecha.success && Date.parse(informe.generado_en) >= Date.parse(fecha.data);
}
