import { beforeEach, describe, expect, it, vi } from "vitest";
import { informeMock, rutaMock } from "@/lib/mocks/informes";
import { tareasMock } from "@/lib/mocks/tareas";
import { usuariosMock } from "@/lib/mocks/clases";
import { calcularMapa } from "./mapa";
const llamar = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ia/cliente", () => ({ llamarMuse: llamar }));
import { generarRuta } from "./index";

describe("ruta de práctica", () => {
  beforeEach(() => llamar.mockReset());
  it("usa Muse, idioma y esfuerzo correctos y fija la identidad", async () => {
    const pasos = rutaMock.pasos.slice(0, 2);
    llamar.mockResolvedValue({ datos: { ...rutaMock, entrega_id: tareasMock[0].id, pasos } });
    const ruta = await generarRuta(informeMock, tareasMock[0], "en");
    expect(ruta.entrega_id).toBe(informeMock.entrega_id);
    expect(llamar).toHaveBeenCalledWith(expect.objectContaining({ funcion: "ruta", idioma: "en", esfuerzo: "medium" }));
  });
  it.each([
    { pasos: [rutaMock.pasos[0]] },
    { pasos: [rutaMock.pasos[0], { ...rutaMock.pasos[1], minutos: 26 }] },
    { pasos: [rutaMock.pasos[0], { ...rutaMock.pasos[1], concepto: "Inventado" }] },
  ])("rechaza pasos que incumplen el prompt 05: %j", async (datos) => {
    llamar.mockResolvedValue({ datos: { ...rutaMock, ...datos } });
    await expect(generarRuta(informeMock, tareasMock[0])).rejects.toThrow();
  });
  it("acepta un reto de profundización si todos los niveles son altos", async () => {
    const informe = { ...informeMock, por_concepto: informeMock.por_concepto.map(c => ({ ...c, nivel: 4 as const })) };
    llamar.mockResolvedValue({ datos: { ...rutaMock, pasos: [rutaMock.pasos[2]] } });
    expect((await generarRuta(informe, tareasMock[0])).pasos).toHaveLength(1);
  });
});

describe("mapa de comprensión", () => {
  const estudiantes = usuariosMock.filter(u => u.rol === "estudiante");
  it("incluye a quien no tiene informe con nivel null", () => {
    const mapa = calcularMapa(tareasMock[0].clase_id, tareasMock[0].id, estudiantes, [{ estudiante_id: estudiantes[0].id, informe: informeMock }]);
    expect(mapa.celdas).toHaveLength(estudiantes.length * informeMock.por_concepto.length);
    expect(mapa.celdas.filter(c => c.estudiante_id === estudiantes[1].id).every(c => c.nivel === null)).toBe(true);
    expect(mapa.conceptos_a_reforzar).toEqual(["Comprobar la solución"]);
  });
  it("usa el informe más reciente por concepto al agregar tareas", () => {
    const primero = { ...informeMock, generado_en: "2026-10-20T10:00:00Z" };
    const ultimo = { ...informeMock, generado_en: "2026-10-21T10:00:00Z", por_concepto: informeMock.por_concepto.map(c => ({ ...c, nivel: 4 as const })) };
    const mapa = calcularMapa(tareasMock[0].clase_id, null, estudiantes, [{ estudiante_id: estudiantes[0].id, informe: ultimo }, { estudiante_id: estudiantes[0].id, informe: primero }]);
    expect(mapa.celdas.filter(c => c.estudiante_id === estudiantes[0].id).every(c => c.nivel === 4)).toBe(true);
    expect(mapa.conceptos_a_reforzar).toEqual([]);
  });
  it("admite una clase sin evaluaciones", () => {
    expect(calcularMapa(tareasMock[0].clase_id, null, estudiantes, []).conceptos).toEqual([]);
  });
});
