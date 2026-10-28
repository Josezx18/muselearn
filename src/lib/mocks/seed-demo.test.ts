import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AnalisisTarea, InformeComprension, RutaPractica } from "@/types/contratos";

// Los datos de supabase/seed-demo.sql se generan desde supabase/demo/generar-seed-demo.py,
// que también escribe estos objetos para comprobar que cumplen los contratos.
const objetos = JSON.parse(readFileSync("supabase/demo/objetos.json", "utf8"));

describe("datos de demo (seed-demo.sql)", () => {
  it("cumplen los contratos", () => {
    expect(() => z.array(AnalisisTarea).parse(objetos.analisis)).not.toThrow();
    expect(() => z.array(InformeComprension).parse(objetos.informes)).not.toThrow();
    expect(() => z.array(RutaPractica).parse(objetos.rutas)).not.toThrow();
  });

  it("cada ruta pertenece a su informe y trabaja conceptos del informe", () => {
    for (const ruta of objetos.rutas as z.infer<typeof RutaPractica>[]) {
      const informe = (objetos.informes as z.infer<typeof InformeComprension>[]).find((i) => i.entrega_id === ruta.entrega_id);
      expect(informe).toBeDefined();
      const conceptos = informe!.por_concepto.map((c) => c.concepto);
      for (const paso of ruta.pasos) expect(conceptos).toContain(paso.concepto);
    }
  });
});
