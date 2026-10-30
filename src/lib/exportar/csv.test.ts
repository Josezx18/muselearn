import { describe, expect, it } from "vitest";
import { csvComprension, csvEntregas, fechaCSV, generarCSV, nombreCSV } from "./csv";
import { usuariosMock } from "@/lib/mocks/clases";
import { tareasMock, entregasMock } from "@/lib/mocks/tareas";
import { informeMock, mapaComprensionMock } from "@/lib/mocks/informes";

describe("CSV para Excel", () => {
  it("usa BOM, separador, CRLF y escapa comillas, saltos y punto y coma", () => {
    expect(generarCSV([['á;"b"\nc', null, 0]])).toBe('\uFEFF"á;""b""\nc";"";"0"\r\n');
  });
  it.each(["=1+1", "+SUM(A1)", "-2", "@SUM(A1)", " \t=2", "\r+1"])("neutraliza %s", (valor) => {
    expect(generarCSV([[valor]])).toBe(`\uFEFF"'${valor}"\r\n`);
  });
  it("convierte fecha en ambos sentidos cruzando medianoche", () => {
    expect(fechaCSV("2026-10-29T02:30:00Z", -240)).toBe("2026-10-28 22:30");
    expect(fechaCSV("2026-10-29T23:30:00Z", 120)).toBe("2026-10-30 01:30");
    expect(fechaCSV(null)).toBe("");
    expect(nombreCSV('Álgebra / "4 A"', "entregas", new Date("2026-10-29T02:30:00Z"))).toBe("muselearn-algebra-4-a-entregas-2026-10-28.csv");
  });
  it("incluye todos los cruces estudiante × tarea y notas opcionales", () => {
    const estudiantes = usuariosMock.filter((u) => u.rol === "estudiante");
    const csv = csvEntregas({ estudiantes, tareas: tareasMock, entregas: entregasMock, informes: [{ informe: informeMock }] });
    expect(csv.split("\r\n").length).toBe(2 + estudiantes.length * tareasMock.length);
    expect(csv).toContain('"Nivel global de comprensión";"Nota"');
    expect(csv).toContain('"pendiente";"";"no";"";""');
    const e = entregasMock[0];
    const conNota = csvEntregas({ estudiantes: estudiantes.filter((u) => u.id === e.estudiante_id), tareas: tareasMock.filter((t) => t.id === e.tarea_id), entregas: [e], informes: [], notas: new Map([[e.id, 0]]) });
    expect(conNota).toContain(';"0"\r\n');
  });
  it("exporta conceptos dinámicos, niveles vacíos y promedio de los conocidos", () => {
    const u = usuariosMock.find((u) => u.rol === "estudiante")!;
    const mapa = { ...mapaComprensionMock, conceptos: ["A", "B", "C"], celdas: [
      { estudiante_id: u.id, estudiante_nombre: u.nombre, concepto: "A", nivel: 1 as const },
      { estudiante_id: u.id, estudiante_nombre: u.nombre, concepto: "C", nivel: 4 as const },
    ] };
    expect(csvComprension([u], mapa)).toContain('"A";"B";"C";"Promedio"\r\n');
    expect(csvComprension([u], mapa)).toContain(';"1";"";"4";"2,50"\r\n');
    expect(csvComprension([u], { ...mapa, celdas: [] })).toContain(';"";"";"";""\r\n');
  });
});
