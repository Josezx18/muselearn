import { Navegacion, type ItemNav } from "@/components/comun/Navegacion";
import { BotonSalir } from "@/components/auth/BotonSalir";
import { exigirRol } from "@/lib/db/sesion";
import { usarMocks } from "@/lib/api-cliente";

const items: ItemNav[] = [
  { href: "/docente/clases", clave: "clases" },
  { href: "/docente/tareas", clave: "tareas" },
  { href: "/docente/comprension", clave: "comprension" },
];

export default async function LayoutDocente({ children, params }: LayoutProps<"/[locale]/docente">) {
  const { locale } = await params;
  if (!usarMocks()) await exigirRol("docente", locale); // T01: sin sesión → login; otro rol → su inicio
  return (
    <>
      <Navegacion items={items} accion={<BotonSalir />} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:pb-12">{children}</main>
    </>
  );
}
