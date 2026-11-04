import { MaterialEstudio, MaterialGuardado } from "@/types/contratos";

export const materialMock = MaterialEstudio.parse({
  diapositivas: ["La igualdad", "El equilibrio", "Operaciones inversas", "Comprobación", "Explica tu razonamiento"].map(titulo => ({ titulo, puntos: ["Aplica la misma operación a ambos miembros.", "Comprueba cada paso antes de continuar."], nota_docente: "Pide justificar la conservación de la igualdad." })),
  mapa: { central: "Ecuaciones", ramas: ["Igualdad", "Operaciones inversas", "Comprobación"].map(concepto => ({ concepto, relacion: "se comprende con", hijos: [{ concepto: "Equilibrio", relacion: "conserva" }] })) },
  infografia: { titulo: "Conserva el equilibrio", dato_clave: { valor: "2", texto: "miembros de una igualdad" }, secciones: [{ icono: "idea", titulo: "Observa", texto: "Identifica las operaciones." }, { icono: "alerta", titulo: "Cuida la igualdad", texto: "Opera en ambos miembros." }, { icono: "pregunta", titulo: "Comprueba", texto: "¿Se mantiene el equilibrio?" }], pasos: ["Lee la igualdad", "Justifica cada operación", "Comprueba tu propuesta"], cierre: "Explica por qué funciona tu razonamiento." },
  titulo: "Repaso de ecuaciones",
  resumen: "Una ecuación expresa una igualdad entre dos cantidades. Mantener el equilibrio permite encontrar el valor desconocido y comprobarlo.",
  conceptos: [{ nombre: "Equilibrio", explicacion: "Aplicar la misma operación a ambos miembros conserva la igualdad.", ejemplo: "En una balanza, x + 9 = 20. Quitamos nueve a ambos lados: x = 11. Comprobación: 11 + 9 = 20." }],
  errores_comunes: ["Cambiar solo un miembro rompe la igualdad; aplica la misma operación a ambos lados."],
  autoevaluacion: [
    { pregunta: "¿Por qué operar en ambos miembros?", respuesta: "Para conservar la igualdad entre las dos cantidades." },
    { pregunta: "¿Cómo compruebas una solución?", respuesta: "Sustituyes el valor en la igualdad original y comparas ambos lados." },
    { pregunta: "¿Qué operación deshace una suma?", respuesta: "La resta de la misma cantidad en ambos miembros." },
  ],
  guion_audio: "Imagina una balanza equilibrada. Cada lado representa un miembro de una ecuación y la letra representa una cantidad que todavía no conocemos. Nuestro objetivo es descubrir esa cantidad sin perder el equilibrio. Si quitamos algo de un lado, debemos quitar la misma cantidad del otro. Antes de calcular, identifica la operación que acompaña a la incógnita. Después piensa en la operación inversa, la que deshace ese cambio. Una suma se deshace con una resta y una multiplicación se deshace con una división, siempre que no dividamos entre cero. Escribe un paso por línea para poder explicar qué hiciste y por qué conserva la igualdad. No basta con encontrar un número que parezca razonable. Al terminar, sustituye tu resultado en la ecuación original y calcula cada lado por separado. Si ambos lados tienen el mismo valor, has comprobado tu propuesta. Si no coinciden, vuelve sobre tus pasos y busca el primer cambio que alteró el equilibrio. Ahora intenta explicar con tus propias palabras por qué cada operación mantiene la igualdad.",
});
const clave = (id: string) => `muselearn-material-${id}`;
export function leerMaterialMock(id: string): MaterialGuardado | null {
  const texto = localStorage.getItem(clave(id));
  return texto ? MaterialGuardado.parse(JSON.parse(texto)) : null;
}
export function guardarMaterialMock(id: string, contenido: MaterialEstudio, publicado: boolean): MaterialGuardado {
  const previo = leerMaterialMock(id);
  const ahora = new Date().toISOString();
  const registro = MaterialGuardado.parse({ tarea_id: id, contenido, publicado, creado_en: previo?.creado_en ?? ahora, actualizado_en: ahora });
  localStorage.setItem(clave(id), JSON.stringify(registro));
  return registro;
}
export function borrarMaterialMock(id: string) { localStorage.removeItem(clave(id)); }
