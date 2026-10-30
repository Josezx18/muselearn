import { Calificacion, type Calificacion as Registro } from "@/types/contratos";
import { Entrega } from "@/types/contratos";
import { calificacionesDemoMock } from "./devoluciones";

const clave = "muselearn-t09-calificaciones";
const iniciales = Calificacion.array().parse(calificacionesDemoMock);
const memoria = new Map<string, Registro>(iniciales.map((c) => [c.entrega_id, c]));
export function leerCalificacionMock(id: string) {
  if (typeof window !== "undefined") {
    const registros = zRegistros(window.localStorage.getItem(clave));
    return registros.find((c) => c.entrega_id === id) ?? iniciales.find((c) => c.entrega_id === id) ?? null;
  }
  return memoria.get(id) ?? null;
}
function zRegistros(texto: string | null) {
  try { return Calificacion.array().parse(JSON.parse(texto ?? "[]")); } catch { return []; }
}
export function escribirCalificacionMock(id: string, cambios: Partial<Registro>) {
  const previa = leerCalificacionMock(id);
  const registro = Calificacion.parse({
    entrega_id: id, docente_id: "00000000-0000-4000-8000-000000000001",
    nota: null, devuelta: false, motivo_devolucion: null, ...previa, ...cambios,
    actualizado_en: new Date().toISOString(),
  });
  memoria.set(id, registro);
  if (typeof window !== "undefined") {
    const registros = zRegistros(window.localStorage.getItem(clave)).filter((c) => c.entrega_id !== id);
    window.localStorage.setItem(clave, JSON.stringify([...registros, registro]));
  }
  return registro;
}
export function estadoCalificadoMock(entrega: Entrega): Entrega {
  const actual = leerEntregaMock(entrega.id) ?? entrega;
  return leerCalificacionMock(entrega.id)?.devuelta ? { ...actual, estado: "pendiente" } : actual;
}

const entregas = new Map<string, Entrega>();
function entregasGuardadas() {
  try {
    return Entrega.array().parse(JSON.parse(window.localStorage.getItem(`${clave}-entregas`) ?? "[]"));
  } catch { return []; }
}
export function leerEntregaMock(id: string) {
  return typeof window === "undefined" ? entregas.get(id) ?? null : entregasGuardadas().find((e) => e.id === id) ?? null;
}
export function escribirEntregaMock(entrega: Entrega) {
  const validada = Entrega.parse(entrega);
  entregas.set(validada.id, validada);
  if (typeof window !== "undefined") window.localStorage.setItem(`${clave}-entregas`, JSON.stringify([
    ...entregasGuardadas().filter((e) => e.id !== validada.id), validada,
  ]));
  return validada;
}
