import { beforeEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GET } from "@/app/api/clases/[id]/exportar/route";
import { clasesMock, usuariosMock } from "@/lib/mocks/clases";
import { entregasMock, tareasMock } from "@/lib/mocks/tareas";

const { sesion } = vi.hoisted(() => ({ sesion: vi.fn() }));
vi.mock("@/lib/db/sesion", () => ({ obtenerUsuarioActual: sesion }));
const clase = clasesMock[0];
let propia = true;
let errorNota: string | null = "PGRST205";
const filtros: unknown[][] = [];
const db = {
  from(tabla: string) {
    const resultado = () => {
      if (tabla === "clases") return { data: propia ? clase : null, error: null };
      if (tabla === "tareas") return { data: tareasMock.filter((t) => t.clase_id === clase.id), error: null };
      if (tabla === "inscripciones") return { data: usuariosMock.filter((u) => u.rol === "estudiante").map((u) => ({ estudiante_id: u.id })), error: null };
      if (tabla === "perfiles") return { data: usuariosMock.filter((u) => u.rol === "estudiante"), error: null };
      if (tabla === "entregas") return { data: entregasMock, error: null };
      if (tabla === "calificaciones") return { data: [], error: errorNota ? { code: errorNota } : null };
      return { data: [], error: null };
    };
    const consulta = {
      select: () => consulta,
      eq: (...args: unknown[]) => { filtros.push([tabla, ...args]); return consulta; },
      in: () => consulta,
      maybeSingle: async () => resultado(),
      then: (resolver: (r: ReturnType<typeof resultado>) => unknown) => Promise.resolve(resultado()).then(resolver),
    };
    return consulta;
  },
};
function pedir(tipo = "entregas", id = clase.id) {
  return GET(new Request(`http://localhost/api/clases/${id}/exportar?tipo=${tipo}`), { params: Promise.resolve({ id }) });
}
beforeEach(() => {
  propia = true; errorNota = "PGRST205"; filtros.length = 0;
  sesion.mockResolvedValue({ usuario: { id: clase.docente_id, rol: "docente" }, db: db as unknown as SupabaseClient });
});
it("rechaza sin sesión y rol estudiante antes de consultar datos", async () => {
  sesion.mockResolvedValueOnce(null);
  expect((await pedir()).status).toBe(401);
  sesion.mockResolvedValueOnce({ usuario: { rol: "estudiante" } });
  expect((await pedir()).status).toBe(403);
  expect(filtros).toEqual([]);
});
it("exige clase propia con el cliente de sesión", async () => {
  propia = false;
  expect((await pedir()).status).toBe(404);
  expect(filtros).toContainEqual(["clases", "docente_id", clase.docente_id]);
  expect(filtros.every((f) => f[0] === "clases")).toBe(true);
});
it("valida identificador y tipo", async () => {
  expect((await pedir("otro")).status).toBe(400);
  expect((await pedir("entregas", "no-uuid")).status).toBe(400);
});
it.each(["PGRST205", "42P01", null])("descarga sin tabla opcional (%s)", async (codigo) => {
  errorNota = codigo;
  const respuesta = await pedir();
  expect(respuesta.status).toBe(200);
  expect(respuesta.headers.get("Cache-Control")).toBe("private, no-store");
  expect(respuesta.headers.get("Content-Disposition")).toMatch(/^attachment; filename="muselearn-/);
  expect([...(new Uint8Array(await respuesta.arrayBuffer())).slice(0, 3)]).toEqual([239, 187, 191]);
});
it("no oculta errores de permisos en calificaciones", async () => {
  errorNota = "42501";
  expect((await pedir()).status).toBe(503);
});
it("comprensión no consulta calificaciones", async () => {
  errorNota = "42501";
  const respuesta = await pedir("comprension");
  expect(respuesta.status).toBe(200);
  expect(await respuesta.text()).toContain('"Promedio"');
});
