import { z } from "zod";
import { MaterialEstudio, type Tarea, type FormatoMaterial, type Idioma } from "@/types/contratos";
import { llamarMuse } from "../cliente";
import type { Llamador } from "./index";
import { PROMPT_MATERIAL_ESTUDIO, PROMPT_FORMATOS_MATERIAL } from "../prompts/docente";

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

/** Recorta textos y listas, omite elementos vacíos; las carencias estructurales siguen siendo errores. */
export function normalizarFormato(valor: unknown): unknown {
  function limpiar(v: unknown, clave = "", padre = ""): unknown {
    if (typeof v === "string") return v.trim().slice(0, clave === "relacion" ? 80 : (clave === "nota_docente" || clave === "texto" && padre !== "dato_clave") ? 600 : 240);
    if (Array.isArray(v)) return v.map(x => limpiar(x, clave)).filter(x => typeof x === "string" ? !!x : !!x && typeof x === "object" && Object.entries(x).some(([k,y]) => ["titulo", "concepto"].includes(k) && typeof y === "string" && !!y)).slice(0, ({ diapositivas: 8, puntos: 5, ramas: 6, hijos: 3, secciones: 6, pasos: 6 } as Record<string, number>)[clave] ?? 8);
    if (v && typeof v === "object") {
      const campos = Object.entries(v).map(([k,x]) => [k,limpiar(x,k,clave)] as const);
      return Object.fromEntries(campos.filter(([k,x]) => {
        if (k === "nota_docente") return !!x;
        if (k === "pasos" && Array.isArray(x)) return x.length >= 3;
        if (k === "dato_clave" && x && typeof x === "object") return Object.values(x).every(Boolean);
        return true;
      }));
    }
    return v;
  }
  return limpiar(valor);
}
const NodoModelo = z.object({ concepto: z.string(), relacion: z.string() });
const FormatosModelo = {
  diapositivas: z.array(z.object({ titulo: z.string(), puntos: z.array(z.string()), nota_docente: z.string().optional() })),
  mapa: z.object({ central: z.string(), ramas: z.array(NodoModelo.extend({ hijos: z.array(NodoModelo).default([]) })) }),
  infografia: z.object({ titulo: z.string(), dato_clave: z.object({ valor: z.string(), texto: z.string() }).optional(), secciones: z.array(z.object({ icono: z.enum(["idea", "pasos", "alerta", "ejemplo", "pregunta", "meta"]), titulo: z.string(), texto: z.string() })), pasos: z.array(z.string()).optional(), cierre: z.string() }),
};
export async function generarFormato(tarea: Tarea, formato: Exclude<FormatoMaterial, "guia">, existente: MaterialEstudio | null, op: { idioma?: Idioma; grado?: string; llamar?: Llamador } = {}): Promise<MaterialEstudio> {
  const guia = existente ?? await generarMaterial(tarea, op);
  const esquema = MaterialEstudio.pick({ [formato]: true } as { diapositivas?: true; mapa?: true; infografia?: true });
  const r = await (op.llamar ?? llamarMuse)({ funcion: "docente", idioma: op.idioma ?? "es", sistema: PROMPT_FORMATOS_MATERIAL, esquema: z.object({ [formato]: FormatosModelo[formato] }), maxTokens: 6000,
    mensajes: [{ role: "user", content: JSON.stringify({ formato, datos: { titulo: tarea.titulo, instrucciones: tarea.instrucciones.slice(0,20000), competencias: tarea.competencias, nivel_ayuda: tarea.nivel_ayuda, grado: op.grado, guia } }) }] });
  const nuevo = esquema.parse(normalizarFormato(r.datos));
  if (!nuevo[formato]) throw new Error("formato_ausente");
  return MaterialEstudio.parse({ ...guia, [formato]: nuevo[formato] });
}
