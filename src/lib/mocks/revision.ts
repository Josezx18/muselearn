import { RevisionEntrega } from "@/types/contratos";
export const revisionEntregaMock = RevisionEntrega.parse({
  cumple: "parcial", resumen: "El procedimiento está presentado, pero falta justificar y comprobar el resultado.",
  criterios: [{ criterio: "Explica los pasos y comprueba el resultado", cumple: "parcial", evidencia: "Presenta operaciones, sin una comprobación explícita." }],
  sugerencias_para_estudiante: ["Explica por qué aplicas la misma operación a ambos lados y comprueba tu resultado."],
  nota_sugerida: 75, confianza: "media",
});

/** Imagen de cuaderno ficticia para ejercitar el visor sin Storage. */
export const fotoRevisionMock = {
  nombre: "cuaderno-demo.svg", ruta: "demo/cuaderno-demo.svg", tipo_mime: "image/svg+xml",
  url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#fffef4"/><path d="M0 160H1200M0 260H1200M0 360H1200M0 460H1200" stroke="#cbd5e1" stroke-width="2"/><g fill="#243c75" font-family="sans-serif" font-size="48"><text x="90" y="100">Cuaderno de demostración</text><text x="90" y="240">3x + 5 = 20</text><text x="90" y="340">3x = 15</text><text x="90" y="440">x = 5</text></g></svg>'),
};
