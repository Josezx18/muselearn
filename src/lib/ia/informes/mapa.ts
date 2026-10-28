import { MapaComprension, type Usuario, type InformeComprension, type NivelDominio } from "@/types/contratos";
/** Para varias tareas usa la evidencia más reciente de cada concepto. Ausencia nunca equivale a nivel 1. */
export function calcularMapa(
  clase_id: string,
  tarea_id: string | null,
  estudiantes: Usuario[],
  informes: { estudiante_id: string; informe: InformeComprension }[],
) {
  const conceptos = [...new Set(informes.flatMap((f) => f.informe.por_concepto.map((c) => c.concepto)))].sort();
  const ordenados = [...informes].sort((a, b) => a.informe.generado_en.localeCompare(b.informe.generado_en));
  const niveles = new Map<string, NivelDominio>();
  for (const fila of ordenados)
    for (const c of fila.informe.por_concepto) niveles.set(JSON.stringify([fila.estudiante_id, c.concepto]), c.nivel);
  const celdas = estudiantes.flatMap((u) =>
    conceptos.map((concepto) => ({
      estudiante_id: u.id,
      estudiante_nombre: u.nombre,
      concepto,
      nivel: niveles.get(JSON.stringify([u.id, concepto])) ?? null,
    })),
  );
  const promedios = conceptos.map((concepto) => {
    const datos = celdas.filter((c) => c.concepto === concepto && c.nivel !== null);
    return { concepto, promedio: datos.length ? datos.reduce((s, c) => s + c.nivel!, 0) / datos.length : null };
  });
  return MapaComprension.parse({
    clase_id,
    tarea_id,
    conceptos,
    celdas,
    conceptos_a_reforzar: promedios
      .filter((c) => c.promedio !== null && c.promedio < 3)
      .sort((a, b) => a.promedio! - b.promedio!)
      .map((c) => c.concepto),
  });
}
