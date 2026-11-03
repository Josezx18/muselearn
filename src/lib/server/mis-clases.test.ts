import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/sesion", () => ({ obtenerUsuarioActual: vi.fn() }));
vi.mock("@/lib/db/clases", () => ({ listarClases: vi.fn() }));
vi.mock("@/lib/api-cliente", () => ({ usarMocks: () => true }));

import { obtenerMisClases, obtenerTareasDeClase } from "./data";

const ID_MATEMATICA = "00000000-0000-4000-8000-000000000101";
const ID_TECNOLOGIA = "00000000-0000-4000-8000-000000000102";
const ID_ECUACIONES = "00000000-0000-4000-8000-000000000201";
const ID_FRACCIONES = "00000000-0000-4000-8000-000000000202";
const ID_ARDUINO = "00000000-0000-4000-8000-000000000203";
const ID_CIRCUITOS = "00000000-0000-4000-8000-000000000204";
const ID_MOVIMIENTO = "00000000-0000-4000-8000-000000000205";
const ID_ENSAYO3D = "00000000-0000-4000-8000-000000000206";
const ID_VECTORES = "00000000-0000-4000-8000-000000000208";

describe("obtenerMisClases con mocks", () => {
  it("devuelve las clases inscritas con docente, conteo de pendientes y próxima fecha", async () => {
    const clases = await obtenerMisClases();
    expect(clases).toHaveLength(2);
    const matematica = clases.find((c) => c.clase.id === ID_MATEMATICA)!;
    expect(matematica.docente.nombre).toBe("Prof. Ana Rodríguez");
    expect(matematica.pendientes).toBe(1); // vectores, sin entregar
    expect(matematica.proximaFecha).not.toBeNull();
    const tecnologia = clases.find((c) => c.clase.id === ID_TECNOLOGIA)!;
    expect(tecnologia.pendientes).toBe(2); // arduino (entrega sin finalizar) + ensayo 3D
    expect(tecnologia.proximaFecha).not.toBeNull();
  });
});

describe("obtenerTareasDeClase con mocks", () => {
  it("agrupa Matemática: 3 entregadas, 1 pendiente (vectores), 0 vencidas", async () => {
    const grupos = await obtenerTareasDeClase(ID_MATEMATICA);
    expect(grupos).not.toBeNull();
    expect(grupos!.pendientes.map((e) => e.tarea.id)).toEqual([ID_VECTORES]);
    expect(grupos!.vencidas).toHaveLength(0);
    expect(grupos!.entregadas.map((e) => e.tarea.id).sort()).toEqual(
      [ID_ECUACIONES, ID_FRACCIONES, ID_MOVIMIENTO].sort(),
    );
    expect(grupos!.docente.nombre).toBe("Prof. Ana Rodríguez");
  });

  it("Tecnología: Arduino vencida, ensayo 3D pendiente, circuitos y C# entregados", async () => {
    const grupos = await obtenerTareasDeClase(ID_TECNOLOGIA);
    expect(grupos).not.toBeNull();
    expect(grupos!.vencidas.map((e) => e.tarea.id)).toEqual([ID_ARDUINO]);
    expect(grupos!.pendientes.map((e) => e.tarea.id)).toEqual([ID_ENSAYO3D]);
    expect(grupos!.entregadas.map((e) => e.tarea.id).sort()).toEqual([ID_CIRCUITOS, "00000000-0000-4000-8000-000000000207"].sort());
  });

  it("una clase desconocida devuelve null", async () => {
    expect(await obtenerTareasDeClase("00000000-0000-4000-8000-000000000999")).toBeNull();
  });
});
