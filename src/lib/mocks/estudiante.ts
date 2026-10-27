// Mocks de T05 (dashboard del estudiante). Datos ficticios.
import type { PreferenciasEstudio } from "@/types/contratos";
import { ESTUDIANTE_ACTUAL } from "./base";

export const preferenciasMock: PreferenciasEstudio = {
  estudiante_id: ESTUDIANTE_ACTUAL,
  horas_disponibles: [
    { dia: 1, desde: "15:00", hasta: "18:00" },
    { dia: 2, desde: "15:00", hasta: "18:00" },
    { dia: 3, desde: "15:00", hasta: "18:00" },
    { dia: 4, desde: "15:00", hasta: "18:00" },
    { dia: 5, desde: "15:00", hasta: "18:00" },
    { dia: 6, desde: "09:00", hasta: "12:00" },
  ],
  max_minutos_bloque: 45,
};
