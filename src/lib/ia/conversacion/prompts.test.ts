import { expect, it } from "vitest";
import { sistemaTutor } from "./prompts";
import { tareasMock } from "@/lib/mocks/tareas";
it.each(["texto", "voz"] as const)("prioriza el idioma del mensaje con respaldo del perfil (%s)", modo => {
 const prompt = sistemaTutor(tareasMock[0], modo);
 expect(prompt).toContain("IDIOMA DEL TUTOR");
 expect(prompt).toContain("mensaje del estudiante");
 expect(prompt).toContain("idioma del perfil indicado en IDIOMA");
 expect(prompt).toContain("NIVEL_AYUDA");
});
