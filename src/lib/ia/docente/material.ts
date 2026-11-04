import { MaterialEstudio, type Tarea, type Idioma } from "@/types/contratos";
import { llamarMuse } from "../cliente";
import type { Llamador } from "./index";
import { PROMPT_MATERIAL_ESTUDIO } from "../prompts/docente";

export async function generarMaterial(
  tarea: Tarea,
  op: { idioma?: Idioma; grado?: string; llamar?: Llamador } = {},
): Promise<MaterialEstudio> {
  const resultado = await (op.llamar ?? llamarMuse)({
    funcion: "docente", idioma: op.idioma ?? "es", sistema: PROMPT_MATERIAL_ESTUDIO,
    esquema: MaterialEstudio, maxTokens: 6000,
    mensajes: [{ role: "user", content: JSON.stringify({ datos: {
      titulo: tarea.titulo, instrucciones: tarea.instrucciones.slice(0, 20000),
      competencias: tarea.competencias, nivel_ayuda: tarea.nivel_ayuda,
      grado: op.grado ?? "secundaria",
      // No se envían entregas, estudiantes ni URLs privadas de adjuntos.
    } }) }],
  });
  return MaterialEstudio.parse(resultado.datos);
}
