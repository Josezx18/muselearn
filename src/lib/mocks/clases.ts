// Mocks de T01 (auth y clases). Datos ficticios.
import type { Clase, Usuario } from "@/types/contratos";
import { IDS, enSemana } from "./base";

export const usuariosMock: Usuario[] = [
  { id: IDS.docente, rol: "docente", nombre: "Prof. Ana Rodríguez", idioma: "es" },
  { id: IDS.estudiantes[0], rol: "estudiante", nombre: "Camila Pérez", idioma: "es" },
  { id: IDS.estudiantes[1], rol: "estudiante", nombre: "Luis Martínez", idioma: "es" },
  { id: IDS.estudiantes[2], rol: "estudiante", nombre: "Sofía Gómez", idioma: "es" },
  { id: IDS.estudiantes[3], rol: "estudiante", nombre: "Diego Fernández", idioma: "es" },
  { id: IDS.estudiantes[4], rol: "estudiante", nombre: "Valeria Santos", idioma: "es" },

  { id: IDS.estudiantes[5], rol: "estudiante", nombre: "Yandel Rosario", idioma: "es" },
  { id: IDS.estudiantes[6], rol: "estudiante", nombre: "Alondra de la Cruz", idioma: "es" },
  { id: IDS.estudiantes[7], rol: "estudiante", nombre: "Dariel Jiménez", idioma: "es" },
  { id: IDS.estudiantes[8], rol: "estudiante", nombre: "Nayeli Tejada", idioma: "es" },
  { id: IDS.estudiantes[9], rol: "estudiante", nombre: "Elian Alcántara", idioma: "es" },
  { id: IDS.estudiantes[10], rol: "estudiante", nombre: "Kiara Peralta", idioma: "es" },
  { id: IDS.estudiantes[11], rol: "estudiante", nombre: "Jadiel Encarnación", idioma: "es" },
];

export const clasesMock: Clase[] = [
  {
    id: IDS.clases.matematica,
    docente_id: IDS.docente,
    nombre: "Matemática 4to A",
    materia: "Matemática",
    grado: "4to",
    codigo_inscripcion: "MAT4KQ",
    creada_en: enSemana(-14, 8),
  },
  {
    id: IDS.clases.tecnologia,
    docente_id: IDS.docente,
    nombre: "Tecnología 4to B",
    materia: "Tecnología",
    grado: "4to",
    codigo_inscripcion: "TEC4ZR",
    creada_en: enSemana(-14, 9),
  },
];
