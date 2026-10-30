import { NextResponse, after } from "next/server";
import { crearTarea, listarTareas } from "@/lib/db/tareas";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { NuevaTarea } from "@/lib/db/validacion-tareas";
import { LIMITES, tareasCreadasHoy } from "@/lib/db/limites";
import { analizarYGuardar, cargarContextoTarea, estaInscrito } from "@/lib/ia/analizador/servicio";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { crearAviso, TipoAviso } from "@/lib/db/avisos";

/** Margen para analizar a todos los estudiantes después de responder (segundos). */
export const maxDuration = 300;

export async function GET(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");

  const { searchParams } = new URL(peticion.url);
  const claseId = searchParams.get("clase_id");

  try {
    const tareas = await listarTareas(actual.db, claseId ?? undefined);
    return NextResponse.json(tareas);
  } catch {
    return errorHttp(500, "error_interno", "No se pudieron cargar las tareas.");
  }
}

export async function POST(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo los docentes crean tareas.");

  const entrada = NuevaTarea.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success) return errorHttp(400, "datos_invalidos", "Revisa los datos de la tarea.");

  const { clase_id } = entrada.data;

  const { data: clase } = await actual.db
    .from("clases")
    .select("id")
    .eq("id", clase_id)
    .eq("docente_id", actual.usuario.id)
    .maybeSingle();
  if (!clase) return errorHttp(403, "no_tu_clase", "No puedes crear tareas en una clase ajena.");
  if ((await tareasCreadasHoy(actual.db, actual.usuario.id)) >= LIMITES.tareas) {
    return errorHttp(429, "limite_diario_tareas", `Llegaste al máximo de ${LIMITES.tareas} tareas nuevas por día.`);
  }

  try {
    const tarea = await crearTarea(actual.db, actual.usuario.id, entrada.data);

    // Análisis en segundo plano para cada estudiante inscrito: after() lo ejecuta cuando ya se respondió
    // al docente, y en Vercel mantiene viva la función hasta terminar (maxDuration arriba).
    after(async () => {
      try {
        const admin = crearClienteAdmin();
        const { data: inscripciones } = await admin
          .from("inscripciones")
          .select("estudiante_id")
          .eq("clase_id", clase_id);
        if (!inscripciones?.length) return;

        // Aviso de tarea nueva para cada estudiante inscrito
        const idsEstudiantes = inscripciones.map((i) => i.estudiante_id);
        await crearAviso(admin, {
          usuarioIds: idsEstudiantes,
          tipo: "tarea_nueva" as TipoAviso,
          titulo: `Nueva tarea: ${entrada.data.titulo}`,
          enlace: `/estudiante/tarea/${tarea.id}`,
        });

        const ctx = await cargarContextoTarea(tarea.id);
        if (!ctx) return;

        for (const ins of inscripciones) {
          const inscrito = await estaInscrito(tarea.id, ins.estudiante_id);
          if (!inscrito) continue;
          try {
            await analizarYGuardar(ctx, ins.estudiante_id);
          } catch (e) {
            console.warn(`[tareas] Error analizando para ${ins.estudiante_id}:`, e);
          }
        }
      } catch (e) {
        console.warn("[tareas] Error en análisis en segundo plano:", e);
      }
    });

    return NextResponse.json(tarea, { status: 201 });
  } catch {
    return errorHttp(500, "error_interno", "No se pudo crear la tarea.");
  }
}