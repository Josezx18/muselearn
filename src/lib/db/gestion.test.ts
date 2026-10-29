import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CambioPerfil, EdicionTarea, PerfilUsuario } from "@/types/contratos";
import { puedeVerArchivo } from "./gestion";
import { enlaceArchivo } from "@/lib/archivos";
import { franjasValidas, minutosSemana } from "@/lib/horas";

const T = "00000000-0000-4000-8000-000000000201";
const E = "00000000-0000-4000-8000-000000000011";
const OTRO = "00000000-0000-4000-8000-000000000012";

/** Cliente falso: responde "existe" solo para las filas que el RLS dejaría ver. */
function dbQueVe(visibles: { tareas?: string[]; entregas?: [string, string][] }) {
  return {
    from(tabla: string) {
      const filtros: Record<string, string> = {};
      const q = {
        select: () => q,
        eq: (col: string, val: string) => ((filtros[col] = val), q),
        maybeSingle: async () => {
          if (tabla === "tareas") return { data: visibles.tareas?.includes(filtros.id) ? { id: filtros.id } : null };
          const ok = visibles.entregas?.some(([t, e]) => t === filtros.tarea_id && e === filtros.estudiante_id);
          return { data: ok ? { id: "x" } : null };
        },
      };
      return q;
    },
  } as unknown as SupabaseClient;
}

describe("puedeVerArchivo", () => {
  it("adjuntos de tarea: solo si el RLS deja ver la tarea", async () => {
    expect(await puedeVerArchivo(dbQueVe({ tareas: [T] }), E, `tareas/${T}/guia.pdf`)).toBe(true);
    expect(await puedeVerArchivo(dbQueVe({}), E, `tareas/${T}/guia.pdf`)).toBe(false);
  });

  it("archivos de entrega: el propio estudiante, o quien pueda leer esa entrega (su docente)", async () => {
    const ruta = `entregas/${T}/${E}/foto.jpg`;
    expect(await puedeVerArchivo(dbQueVe({}), E, ruta)).toBe(true);
    expect(await puedeVerArchivo(dbQueVe({}), OTRO, ruta)).toBe(false);
    expect(await puedeVerArchivo(dbQueVe({ entregas: [[T, E]] }), OTRO, ruta)).toBe(true);
  });

  it("rechaza rutas raras", async () => {
    const db = dbQueVe({ tareas: [T] });
    for (const r of [`tareas/${T}/../x`, "tareas/no-uuid/a.pdf", `otra/${T}/a.pdf`, `entregas/${T}/a.jpg`, ""]) {
      expect(await puedeVerArchivo(db, E, r)).toBe(false);
    }
  });

  it("el enlace codifica la ruta", () => {
    expect(enlaceArchivo("entregas/a b/c.jpg")).toBe("/api/archivos?ruta=entregas%2Fa%20b%2Fc.jpg");
  });
});

describe("contratos de cuenta y gestión", () => {
  it("CambioPerfil exige al menos un cambio y valores conocidos", () => {
    expect(CambioPerfil.safeParse({}).success).toBe(false);
    expect(CambioPerfil.safeParse({ tema: "rosa" }).success).toBe(false);
    expect(CambioPerfil.parse({ mascota: "orbi" })).toEqual({ mascota: "orbi" });
    expect(CambioPerfil.safeParse({ nombre: " A " }).success).toBe(false);
    expect(CambioPerfil.safeParse({ rol: "docente" } as never).success).toBe(false);
  });

  it("PerfilUsuario completa la apariencia por defecto", () => {
    const p = PerfilUsuario.parse({ id: E, rol: "estudiante", nombre: "Camila", idioma: "es", correo: "c@x.do" });
    expect([p.tema, p.mascota]).toEqual(["muse", "pagi"]);
  });

  it("EdicionTarea acepta cambios parciales y fechas con desfase", () => {
    expect(EdicionTarea.parse({ fecha_entrega: "2026-11-04T22:00:00+00:00" })).toEqual({ fecha_entrega: "2026-11-04T22:00:00+00:00" });
    expect(EdicionTarea.safeParse({}).success).toBe(false);
    expect(EdicionTarea.safeParse({ nivel_ayuda: "respuestas" }).success).toBe(false);
  });
});

describe("horas de estudio", () => {
  it("suma los minutos libres de la semana y valida las franjas", () => {
    const f = [
      { dia: 1, desde: "15:00", hasta: "17:30" },
      { dia: 6, desde: "09:00", hasta: "10:00" },
    ];
    expect(minutosSemana(f)).toBe(210);
    expect(franjasValidas(f)).toBe(true);
    expect(franjasValidas([{ dia: 2, desde: "18:00", hasta: "17:00" }])).toBe(false);
    expect(franjasValidas([{ dia: 2, desde: "7:00", hasta: "09:00" }])).toBe(false);
  });
});
