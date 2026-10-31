import { beforeEach, describe, expect, it, vi } from "vitest";
import { clasesMock, usuariosMock } from "@/lib/mocks/clases";
import { tareasMock } from "@/lib/mocks/tareas";
import { ESTUDIANTE_ACTUAL } from "@/lib/mocks/base";

const { from, actual, listar } = vi.hoisted(() => ({ from: vi.fn(), actual: vi.fn(), listar: vi.fn() }));
vi.mock("@/lib/db/sesion", () => ({ obtenerUsuarioActual: actual }));
vi.mock("@/lib/db/clases", () => ({ listarClases: listar }));
vi.mock("@/lib/api-cliente", () => ({ usarMocks: () => false }));

import { obtenerDatosHoy, obtenerDatosTarea } from "./data";

type Resultado = { data: unknown; error: Error | null };
const filas: Record<string, Resultado> = {};
const filtros: Array<[string, string, unknown]> = [];
const estudiante = usuariosMock.find((u) => u.id === ESTUDIANTE_ACTUAL)!;

beforeEach(() => {
  vi.clearAllMocks();
  filtros.length = 0;
  filas.planes = { data: null, error: null };
  filas.tareas = { data: tareasMock, error: null };
  filas.analisis_tareas = { data: [], error: null };
  filas.entregas = { data: null, error: null };
  actual.mockResolvedValue({ usuario: estudiante, db: { from } });
  listar.mockResolvedValue(clasesMock);
  from.mockImplementation((tabla: string) => {
    const resultado = Promise.resolve(filas[tabla]);
    const consulta = {
      select: vi.fn(), eq: vi.fn(), in: vi.fn(), maybeSingle: vi.fn(),
      then: resultado.then.bind(resultado),
    };
    consulta.select.mockReturnValue(consulta);
    consulta.in.mockReturnValue(consulta);
    consulta.maybeSingle.mockReturnValue(consulta);
    consulta.eq.mockImplementation((columna: string, valor: unknown) => {
      filtros.push([tabla, columna, valor]);
      return consulta;
    });
    return consulta;
  });
});

describe("carga SSR con sesión y datos reales de Supabase", () => {
  it("rechaza una sesión ausente antes de consultar datos", async () => {
    actual.mockResolvedValue(null);
    await expect(obtenerDatosHoy("2026-10-26")).rejects.toThrow("sesion_no_autorizada");
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza el rol docente en las vistas del estudiante", async () => {
    actual.mockResolvedValue({ usuario: usuariosMock.find((u) => u.rol === "docente"), db: { from } });
    await expect(obtenerDatosHoy("2026-10-26")).rejects.toThrow("sesion_no_autorizada");
    expect(from).not.toHaveBeenCalled();
  });

  it("propaga un error de base de datos en lugar de mostrar un plan vacío", async () => {
    filas.planes.error = new Error("fallo_bd_simulado");
    await expect(obtenerDatosHoy("2026-10-26")).rejects.toThrow("fallo_bd_simulado");
  });

  it("valida el JSON del plan antes de enviarlo al componente", async () => {
    filas.planes.data = { datos: { bloques: "invalido" } };
    await expect(obtenerDatosHoy("2026-10-26")).rejects.toThrow();
  });

  it("distingue ausencia de plan y filtra por la identidad autenticada", async () => {
    const datos = await obtenerDatosHoy("2026-10-26");
    expect(datos.plan).toBeNull();
    expect(datos.tareas).toEqual(tareasMock);
    expect(filtros).toContainEqual(["planes", "estudiante_id", estudiante.id]);
    expect(filtros).toContainEqual(["analisis_tareas", "estudiante_id", estudiante.id]);
  });

  it("una tarea no accesible permanece ausente, sin sustituirla por otra", async () => {
    filas.tareas.data = null;
    filas.analisis_tareas.data = null;
    const datos = await obtenerDatosTarea(tareasMock[0].id);
    expect(datos.tarea).toBeNull();
  });

  it("propaga errores al cargar una tarea", async () => {
    filas.tareas.error = new Error("fallo_tarea_simulado");
    await expect(obtenerDatosTarea(tareasMock[0].id)).rejects.toThrow("fallo_tarea_simulado");
  });

  it("rechaza una entrega que no cumple el contrato", async () => {
    filas.tareas.data = tareasMock[0];
    filas.analisis_tareas.data = null;
    filas.entregas.data = { id: "invalido" };
    await expect(obtenerDatosTarea(tareasMock[0].id)).rejects.toThrow();
  });
});
