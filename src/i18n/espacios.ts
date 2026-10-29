// Espacios de nombres de traducción. Cada módulo es dueño de su archivo en messages/{es,en}/.
// Para usar: const t = useTranslations("tareas");  →  t("titulo")
export const espacios = [
  "comun", // T00 (congelado)
  "auth", // T01
  "clases", // T01
  "tareas", // T02
  "estudiante", // T05
  "tutor", // T04
  "verificacion", // T04
  "informes", // T06
  "docente", // T06
  "cuenta", // perfil y configuración
  "gestion", // gestión del docente
] as const;

export type Espacio = (typeof espacios)[number];
