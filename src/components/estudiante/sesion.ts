import { usarMocks } from "@/lib/api-cliente";
import { exigirRol } from "@/lib/db/sesion";
import { ESTUDIANTE_ACTUAL } from "@/lib/mocks/base";
import { usuariosMock } from "@/lib/mocks/clases";
export async function sesionEstudiante(locale: string) {
  if (!usarMocks()) return exigirRol("estudiante", locale);
  return usuariosMock.find(u => u.id === ESTUDIANTE_ACTUAL)!;
}
