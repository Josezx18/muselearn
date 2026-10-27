import type { PreferenciasEstudio } from "@/types/contratos";

/** lun-vie 15:00-18:00, sáb 9:00-12:00, bloques de 45 min (dia 0 = domingo). */
export function preferenciasPorDefecto(estudiante_id: string): PreferenciasEstudio {
  return {
    estudiante_id,
    horas_disponibles: [
      ...[1, 2, 3, 4, 5].map((dia) => ({ dia, desde: "15:00", hasta: "18:00" })),
      { dia: 6, desde: "09:00", hasta: "12:00" },
    ],
    max_minutos_bloque: 45,
  };
}
