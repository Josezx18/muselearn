// Recalcula la semana de los estudiantes de una clase cuando una tarea cambia de fecha o se borra,
// para que su plan guardado no muestre bloques de una tarea que ya no existe o vence otro día.
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { planificarSemana } from ".";
import { crearAlmacenSupabase } from "./almacen";

export async function replanificarClase(claseId: string) {
  const admin = crearClienteAdmin();
  const { data } = await admin.from("inscripciones").select("estudiante_id").eq("clase_id", claseId);
  const almacen = crearAlmacenSupabase();
  for (const { estudiante_id } of data ?? []) {
    try {
      await planificarSemana(estudiante_id as string, undefined, { almacen, causa: "analisis_actualizado" });
    } catch (e) {
      console.warn(`[plan] no se pudo replanificar a ${estudiante_id}: ${(e as Error).message}`);
    }
  }
}
