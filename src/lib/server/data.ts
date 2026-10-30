// =====================================================================
// MuseLearn — funciones de data fetching del lado del servidor.
// Usan el cliente de Supabase del servidor (respeta RLS con la sesión del usuario).
// Con NEXT_PUBLIC_USAR_MOCKS=true devuelven los mismos datos que api-cliente.
// =====================================================================
import { usarMocks } from "@/lib/api-cliente";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { lunesDe } from "@/lib/ia/planificador/algoritmo";
import { offsetPorDefecto } from "@/lib/ia/planificador";
import { analisisMock, planParaSemanaMock } from "@/lib/mocks/ia";
import { clasesMock, usuariosMock } from "@/lib/mocks/clases";
import { tareasMock, entregasMock } from "@/lib/mocks/tareas";
import type { PlanSemanal, Tarea, AnalisisTarea, Clase, Usuario, Entrega } from "@/types/contratos";

/** Lunes de la semana actual en la zona del centro (misma regla que el planificador). */
export function semanaActual(hoy: Date = new Date()): string {
  return lunesDe(hoy, offsetPorDefecto());
}

async function getUsuarioAutenticado() {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return perfil as Usuario | null;
}

async function getClasesDelUsuario(usuarioId: string, rol: "estudiante" | "docente") {
  const supabase = await crearClienteServidor();
  if (rol === "estudiante") {
    const { data: inscripciones } = await supabase
      .from("inscripciones")
      .select("clase_id")
      .eq("estudiante_id", usuarioId);
    const ids = inscripciones?.map((i) => i.clase_id) ?? [];
    if (ids.length === 0) return [];
    const { data } = await supabase.from("clases").select("*").in("id", ids);
    return data as Clase[];
  } else {
    const { data } = await supabase.from("clases").select("*").eq("docente_id", usuarioId);
    return data as Clase[];
  }
}

export async function obtenerDatosTarea(id: string) {
  if (usarMocks()) {
    const tarea = tareasMock.find((t) => t.id === id) ?? tareasMock[0];
    const analisis = analisisMock.find((a) => a.tarea_id === id);
    const materia = clasesMock.find((c) => c.id === tarea.clase_id)?.materia;
    const entrega = entregasMock.find((e) => e.tarea_id === id && e.estudiante_id === usuariosMock.find((u: Usuario) => u.rol === "estudiante")!.id) ?? null;
    return {
      tarea,
      analisis,
      materia,
      entrega,
      clases: clasesMock,
    };
  }

  const usuario = await getUsuarioAutenticado();
  if (!usuario || usuario.rol !== "estudiante") throw new Error("Usuario no autenticado o no es estudiante");

  const supabase = await crearClienteServidor();

  const [tareaRes, analisisRes, clasesRes, entregasRes] = await Promise.all([
    supabase.from("tareas").select("*").eq("id", id).single(),
    supabase.from("analisis_tareas").select("datos").eq("tarea_id", id).eq("estudiante_id", usuario.id).maybeSingle(),
    getClasesDelUsuario(usuario.id, "estudiante"),
    supabase.from("entregas").select("*").eq("tarea_id", id).eq("estudiante_id", usuario.id).maybeSingle(),
  ]);

  const materia = clasesRes.find((c) => c.id === tareaRes.data?.clase_id)?.materia;

  return {
    tarea: tareaRes.data as Tarea,
    analisis: analisisRes.data?.datos as AnalisisTarea | undefined,
    materia,
    entrega: entregasRes.data as Entrega | null,
    clases: clasesRes,
  };
}

export async function obtenerDatosHoy(semana: string) {
  if (usarMocks()) {
    const usuario = usuariosMock.find((u: Usuario) => u.rol === "estudiante")!;
    return {
      usuario,
      plan: planParaSemanaMock(semana),
      tareas: tareasMock,
      analisis: analisisMock,
      clases: clasesMock,
      semana,
    };
  }

  const usuario = await getUsuarioAutenticado();
  if (!usuario || usuario.rol !== "estudiante") throw new Error("Usuario no autenticado o no es estudiante");

  const supabase = await crearClienteServidor();

  const [planRes, tareasRes, analisisRes, clasesRes] = await Promise.all([
    supabase.from("planes").select("datos").eq("estudiante_id", usuario.id).eq("semana_inicio", semana).maybeSingle(),
    supabase.from("tareas").select("*").in("clase_id", (await supabase.from("inscripciones").select("clase_id").eq("estudiante_id", usuario.id)).data?.map((i) => i.clase_id) ?? []),
    supabase.from("analisis_tareas").select("datos").eq("estudiante_id", usuario.id),
    getClasesDelUsuario(usuario.id, "estudiante"),
  ]);

  return {
    usuario,
    plan: (planRes.data?.datos as PlanSemanal) ?? null,
    tareas: tareasRes.data as Tarea[],
    analisis: analisisRes.data?.map((a) => a.datos as AnalisisTarea) ?? [],
    clases: clasesRes,
    semana,
  };
}

export async function obtenerDatosSemana(semana: string) {
  // Mismo lógica que Hoy, solo cambia la vista
  return obtenerDatosHoy(semana);
}

export async function obtenerDatosComprension() {
  if (usarMocks()) {
    const usuario = usuariosMock.find((u: Usuario) => u.rol === "docente")!;
    return {
      usuario,
      clases: clasesMock,
    };
  }

  const usuario = await getUsuarioAutenticado();
  if (!usuario || usuario.rol !== "docente") throw new Error("Usuario no autenticado o no es docente");

  const clases = await getClasesDelUsuario(usuario.id, "docente");

  return {
    usuario,
    clases,
  };
}