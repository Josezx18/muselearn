vi.mock("@/i18n/navigation", () => ({useRouter: vi.fn()}));
vi.mock("@/lib/api-cliente", () => ({listarAvisos: vi.fn(), marcarAvisosLeidos: vi.fn()}));
vi.mock("@/components/ui", () => ({cn: vi.fn()}));
import { expect, it, vi } from "vitest";
import { createTranslator } from "next-intl";
import { textoAviso } from "./Campana";
import es from "../../../messages/es/avisos.json";
import en from "../../../messages/en/avisos.json";
it("traduce datos conservando el contenido del usuario y pluraliza", () => {
 const aviso = { tipo: "tarea_nueva", titulo: "legacy", datos: { tarea: "Ecuaciones" } };
 expect(textoAviso(aviso, createTranslator({locale: "en", messages: en}))).toBe("New task: Ecuaciones");
 expect(textoAviso(aviso, createTranslator({locale: "es", messages: es}))).toBe("Nueva tarea: Ecuaciones");
 expect(textoAviso({tipo: "tareas_importadas", titulo: "legacy", datos: {n: 1}}, createTranslator({locale: "en", messages: en}))).toBe("1 new task imported from Classroom");
});
it("conserva el titulo antiguo sin datos o con tipo desconocido", () => {
 const t = () => "incorrecto";
 expect(textoAviso({tipo: "nota", titulo: "Anterior"}, t)).toBe("Anterior");
 expect(textoAviso({tipo: "futuro", titulo: "Anterior", datos: {}}, t)).toBe("Anterior");
});
