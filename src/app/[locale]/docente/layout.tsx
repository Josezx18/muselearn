import type { ReactNode } from "react";
import { Navegacion, type ItemNav } from "@/components/comun/Navegacion";

// Layout del docente (T00). T01 agrega aquí la comprobación de sesión y rol.
const items: ItemNav[] = [
  { href: "/docente/clases", clave: "clases" },
  { href: "/docente/tareas", clave: "tareas" },
  { href: "/docente/comprension", clave: "comprension" },
];

export default function LayoutDocente({ children }: { children: ReactNode }) {
  return (
    <>
      <Navegacion items={items} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:pb-10">{children}</main>
    </>
  );
}
