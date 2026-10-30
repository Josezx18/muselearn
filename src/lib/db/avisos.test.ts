import { describe, it, expect, vi, beforeEach } from "vitest";
import { crearAviso, obtenerAvisos, marcarAvisosLeidos } from "@/lib/db/avisos";
import { crearClienteAdmin } from "@/lib/supabase/servidor";

// Mock simple del cliente admin de Supabase
type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

type MockResult = 
  | { error: null; data?: Aviso[] | null }
  | { error: { message: string }; data?: null };

interface Aviso {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  enlace: string;
  leido: boolean;
  creado_en: string;
}

const createMockQueryBuilder = (result: MockResult = { error: null }): MockQueryBuilder => {
  const builder: MockQueryBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    in: vi.fn(),
    then: vi.fn(),
  };
  
  // Hacer que todos los métodos devuelvan el mismo builder para encadenamiento
  (Object.keys(builder) as Array<keyof MockQueryBuilder>).forEach((key) => {
    builder[key].mockReturnValue(builder);
  });
  
  // Hacer que el builder sea "thenable" para poder hacer await
  builder.then.mockImplementation((onFulfilled) => Promise.resolve(result).then(onFulfilled));
  
  return builder;
};

let mockQueryBuilder = createMockQueryBuilder();
const mockFrom = vi.fn(() => mockQueryBuilder);
const mockAdmin = { from: mockFrom } as unknown as ReturnType<typeof crearClienteAdmin>;

vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteAdmin: vi.fn(() => mockAdmin),
}));

describe("avisos.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder = createMockQueryBuilder();
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  describe("crearAviso", () => {
    it("no hace nada si usuarioIds está vacío", async () => {
      await crearAviso(mockAdmin, { usuarioIds: [], tipo: "tarea_nueva", titulo: "Test", enlace: "/test" });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("inserta avisos para cada usuario", async () => {
      mockQueryBuilder = createMockQueryBuilder({ error: null });
      mockFrom.mockReturnValue(mockQueryBuilder);

      await crearAviso(mockAdmin, {
        usuarioIds: ["u1", "u2"],
        tipo: "tarea_nueva",
        titulo: "Nueva tarea",
        enlace: "/estudiante/tarea/123",
      });

      expect(mockFrom).toHaveBeenCalledWith("avisos");
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        { usuario_id: "u1", tipo: "tarea_nueva", titulo: "Nueva tarea", enlace: "/estudiante/tarea/123", leido: false },
        { usuario_id: "u2", tipo: "tarea_nueva", titulo: "Nueva tarea", enlace: "/estudiante/tarea/123", leido: false },
      ]);
    });

    it("solo registra warn si falla la inserción (no lanza)", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockQueryBuilder = createMockQueryBuilder({ error: { message: "tabla no existe" } });
      mockFrom.mockReturnValue(mockQueryBuilder);

      await expect(
        crearAviso(mockAdmin, {
          usuarioIds: ["u1"],
          tipo: "nota",
          titulo: "Nota",
          enlace: "/estudiante/tarea/123",
        })
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("solo registra warn si hay excepción (ej. tabla no existe)", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockFrom.mockImplementation(() => {
        throw new Error("relation \"avisos\" does not exist");
      });

      await expect(
        crearAviso(mockAdmin, {
          usuarioIds: ["u1"],
          tipo: "nota",
          titulo: "Nota",
          enlace: "/estudiante/tarea/123",
        })
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("obtenerAvisos", () => {
    it("devuelve avisos y conteo de no leídos", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        error: null,
        data: [
          { id: "1", usuario_id: "u1", tipo: "tarea_nueva", titulo: "Tarea 1", enlace: "/a", leido: false, creado_en: "2024-01-01T00:00:00Z" },
          { id: "2", usuario_id: "u1", tipo: "nota", titulo: "Nota 1", enlace: "/b", leido: true, creado_en: "2024-01-02T00:00:00Z" },
          { id: "3", usuario_id: "u1", tipo: "comentario", titulo: "Comentario", enlace: "/c", leido: false, creado_en: "2024-01-03T00:00:00Z" },
        ],
      });
      mockFrom.mockReturnValue(mockQueryBuilder);

      const { avisos, noLeidos } = await obtenerAvisos("u1");

      expect(avisos).toHaveLength(3);
      expect(noLeidos).toBe(2);
      expect(mockFrom).toHaveBeenCalledWith("avisos");
    });

    it("devuelve array vacío y 0 si hay error", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockQueryBuilder = createMockQueryBuilder({ error: { message: "error" }, data: null });
      mockFrom.mockReturnValue(mockQueryBuilder);

      const { avisos, noLeidos } = await obtenerAvisos("u1");

      expect(avisos).toEqual([]);
      expect(noLeidos).toBe(0);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("marcarAvisosLeidos", () => {
    it("marca todos como leídos si no se pasan ids", async () => {
      mockQueryBuilder = createMockQueryBuilder({ error: null });
      mockFrom.mockReturnValue(mockQueryBuilder);

      await marcarAvisosLeidos("u1");

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ leido: true });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("usuario_id", "u1");
      expect(mockQueryBuilder.in).not.toHaveBeenCalled();
    });

    it("marca solo los ids especificados", async () => {
      mockQueryBuilder = createMockQueryBuilder({ error: null });
      mockFrom.mockReturnValue(mockQueryBuilder);

      await marcarAvisosLeidos("u1", ["1", "2"]);

      expect(mockQueryBuilder.in).toHaveBeenCalledWith("id", ["1", "2"]);
    });

    it("solo registra warn si falla", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockQueryBuilder = createMockQueryBuilder({ error: { message: "error" } });
      mockFrom.mockReturnValue(mockQueryBuilder);

      await expect(marcarAvisosLeidos("u1")).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});