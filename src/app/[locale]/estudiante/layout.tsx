import type { ReactNode } from "react";
import { Navegacion, type ItemNav } from "@/components/comun/Navegacion";

// Layout del estudiante (T00; T05 puede modificarlo). T01 agrega la comprobación de sesión y rol.
const items: ItemNav[] = [
  { href: "/estudiante/hoy", clave: "hoy" },
  { href: "/estudiante/semana", clave: "semana" },
];

export default function LayoutEstudiante({ children }: { children: ReactNode }) {
  return (
    <>
      <Navegacion items={items} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:pb-10">{children}</main>
    </>
  );
}
