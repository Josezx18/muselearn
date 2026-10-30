import { ComentarioDocente, Calificacion } from "@/types/contratos";
import { entregasMock } from "./tareas";
import { IDS, id } from "./base";
import { planSemanalMock } from "./ia";

export const comentariosDemoMock = entregasMock.filter((e) => e.entregada_en).map((e) => ComentarioDocente.parse({
  entrega_id: e.id,
  texto: e.id === id(330)
    ? "En y = 2x + 1 primero multiplica 2 por x. Revisa la tabla, comprueba los puntos y vuelve a entregar."
    : "Gracias por mostrar tu procedimiento. Explica cada operaci?n y comprueba sustituyendo tu resultado.",
  actualizado_en: planSemanalMock.generado_en,
}));
export const calificacionesDemoMock = comentariosDemoMock.map((c, i) => Calificacion.parse({
  entrega_id: c.entrega_id, docente_id: IDS.docente,
  nota: i < 12 ? [88, 85, 45, 100, 58, 90, 55, 96, null, 78, 82, 91][i] : c.entrega_id === id(330) ? 40 : null,
  devuelta: c.entrega_id === id(330), motivo_devolucion: c.entrega_id === id(330) ? c.texto : null,
  actualizado_en: c.actualizado_en,
}));
