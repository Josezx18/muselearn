import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { claseDesdeCurso, configClassroom, esDocenteDelCurso, listarAlumnos, urlAutorizacion } from "./classroom";
import { importarCurso } from "./importar";

const respuesta = (status: number, cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status });

describe("Classroom", () => {
  it("la URL de permiso pide solo lectura y lleva el estado anti-CSRF", () => {
    const u = new URL(urlAutorizacion({ clientId: "id", redirectUri: "https://x.do/cb", estado: "abc" }));
    expect(u.searchParams.get("state")).toBe("abc");
    expect(u.searchParams.get("access_type")).toBe("online");
    expect(
      u.searchParams
        .get("scope")
        ?.split(" ")
        .every((s) => s.endsWith(".readonly") || s.endsWith("profile.emails")),
    ).toBe(true);
  });

  it("sin variables de entorno no hay configuración", () => {
    expect(configClassroom({} as NodeJS.ProcessEnv)).toBeNull();
    expect(configClassroom({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b" } as unknown as NodeJS.ProcessEnv)).toEqual({
      clientId: "a",
      clientSecret: "b",
    });
  });

  it("lee los estudiantes de todas las páginas y normaliza el correo", async () => {
    const paginas = [
      { students: [{ profile: { name: { fullName: "Ana Torres" }, emailAddress: "Ana@Liceo.do" } }], nextPageToken: "p2" },
      { students: [{ profile: { name: { fullName: "Luis Gil" } } }] },
    ];
    const falso = vi.fn(async () => respuesta(200, paginas.shift())) as unknown as typeof fetch;
    expect(await listarAlumnos("t", "c1", falso)).toEqual([
      { nombre: "Ana Torres", correo: "ana@liceo.do" },
      { nombre: "Luis Gil", correo: null },
    ]);
  });

  it("un 404 de teachers/me significa que no eres docente del curso", async () => {
    expect(await esDocenteDelCurso("t", "c1", (async () => respuesta(404, {})) as unknown as typeof fetch)).toBe(false);
    expect(await esDocenteDelCurso("t", "c1", (async () => respuesta(200, { userId: "1" })) as unknown as typeof fetch)).toBe(true);
  });

  it("la clase toma nombre y sección del curso y cumple las validaciones", () => {
    expect(claseDesdeCurso({ id: "1", name: "Tecnología 4to", section: "Atkins" })).toEqual({
      nombre: "Tecnología 4to",
      materia: "Tecnología 4to",
      grado: "Atkins",
    });
    expect(claseDesdeCurso({ id: "1", name: "X" }).nombre.length).toBeGreaterThanOrEqual(2);
  });
});

describe("importarCurso", () => {
  it("inscribe a quien tiene cuenta de estudiante con el mismo correo y lista a los demás", async () => {
    const insertados: unknown[] = [];
    const tabla = (nombre: string) => {
      const q: Record<string, unknown> = {};
      Object.assign(q, {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ data: null }),
        upsert: async (filas: unknown) => (nombre === "inscripciones" && insertados.push(filas), { error: null }),
        update: () => q,
        insert: () => q,
        single: async () => ({
          data: {
            id: "00000000-0000-4000-8000-000000000101",
            docente_id: "00000000-0000-4000-8000-000000000001",
            nombre: "Tec",
            materia: "Tec",
            grado: "A",
            codigo_inscripcion: "ABC234",
            creada_en: "2026-10-29T12:00:00Z",
          },
          error: null,
        }),
        then: (ok: (v: unknown) => void) => ok({ data: [], error: null }),
      });
      return q;
    };
    const db = { from: tabla } as unknown as SupabaseClient;
    const admin = {
      from: tabla,
      auth: {
        admin: {
          listUsers: async () => ({
            data: {
              users: [
                { id: "e1", email: "ana@liceo.do", app_metadata: { rol: "estudiante" } },
                { id: "d1", email: "luis@liceo.do", app_metadata: { rol: "docente" } },
              ],
            },
            error: null,
          }),
        },
      },
    } as unknown as SupabaseClient;
    const r = await importarCurso(db, admin, "00000000-0000-4000-8000-000000000001", { id: "c1", name: "Tec", section: "A" }, [
      { nombre: "Ana", correo: "ana@liceo.do" },
      { nombre: "Luis", correo: "luis@liceo.do" },
      { nombre: "Sin correo", correo: null },
    ]);
    expect(r.nueva).toBe(true);
    expect(r.inscritos).toEqual(["Ana"]);
    expect(r.sinCuenta.map((a) => a.nombre)).toEqual(["Luis", "Sin correo"]);
    expect(insertados).toHaveLength(1);
  });
});
