import type { Entrega, InformeComprension, MapaComprension, Tarea, Usuario } from "@/types/contratos";

type Celda = string | number | null | undefined;
export function generarCSV(filas: Celda[][]): string {
  return "\uFEFF" + filas.map((fila) => fila.map((valor) => {
    let texto = String(valor ?? "");
    // También protege fórmulas precedidas por espacios o controles.
    if (/^[\s\u0000-\u001f]*[=+@-]/u.test(texto)) texto = "'" + texto;
    return '"' + texto.replaceAll('"', '""') + '"';
  }).join(";")).join("\r\n") + "\r\n";
}

export function fechaCSV(iso: string | null, offset = -240): string {
  return iso ? new Date(Date.parse(iso) + offset * 60000).toISOString().slice(0, 16).replace("T", " ") : "";
}

export function nombreCSV(clase: string, tipo: string, ahora = new Date(), offset = -240): string {
  const nombre = clase.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "clase";
  return `muselearn-${nombre}-${tipo}-${fechaCSV(ahora.toISOString(), offset).slice(0, 10)}.csv`;
}

export function csvEntregas(datos: {
  estudiantes: Usuario[]; tareas: Tarea[]; entregas: Entrega[];
  informes: { informe: InformeComprension }[];
  notas?: Map<string, number | null>; correos?: Map<string, string>;
}, offset = -240): string {
  return generarCSV([
    ["Estudiante", "Correo", "Tarea", "Fecha de entrega", "Estado", "Entregada en", "Entregada fuera", "Nivel global de comprensión", "Nota"],
    ...datos.estudiantes.flatMap((u) => datos.tareas.map((t) => {
      const e = datos.entregas.find((e) => e.estudiante_id === u.id && e.tarea_id === t.id);
      const informe = e && datos.informes.find((f) => f.informe.entrega_id === e.id)?.informe;
      return [u.nombre, datos.correos?.get(u.id), t.titulo, fechaCSV(t.fecha_entrega, offset), e?.estado ?? "pendiente", fechaCSV(e?.entregada_en ?? null, offset), e?.entregada_externamente ? "sí" : "no", informe?.nivel_global, e ? datos.notas?.get(e.id) : null];
    })),
  ]);
}

export function csvComprension(estudiantes: Usuario[], mapa: MapaComprension): string {
  return generarCSV([
    ["Estudiante", ...mapa.conceptos, "Promedio"],
    ...estudiantes.map((u) => {
      const niveles = mapa.conceptos.map((c) => mapa.celdas.find((f) => f.estudiante_id === u.id && f.concepto === c)?.nivel ?? null);
      const conocidos = niveles.filter((n): n is NonNullable<typeof n> => n !== null);
      return [u.nombre, ...niveles, conocidos.length ? (conocidos.reduce((a, b) => a + b, 0) / conocidos.length).toFixed(2).replace(".", ",") : null];
    }),
  ]);
}
