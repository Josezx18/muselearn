import { Navegacion, type ItemNav } from "@/components/comun/Navegacion";
import { MenuUsuario } from "@/components/cuenta/MenuUsuario";
import { SincronizarApariencia } from "@/components/cuenta/SincronizarApariencia";
import { usuariosMock } from "@/lib/mocks/clases";
import { exigirRol } from "@/lib/db/sesion";
import { usarMocks } from "@/lib/api-cliente";

const items: ItemNav[] = [
  { href: "/estudiante/hoy", clave: "hoy" },
  { href: "/estudiante/semana", clave: "semana" },
];

export default async function LayoutEstudiante({ children, params }: LayoutProps<"/[locale]/estudiante">) {
  const { locale } = await params;
  // T01: sin sesión → login; otro rol → su inicio. En modo mocks, un usuario ficticio.
  const usuario = usarMocks()
    ? { ...(usuariosMock.find((u) => u.rol === "estudiante") ?? usuariosMock[0]), tema: null, mascota: null }
    : await exigirRol("estudiante", locale);
  return (
    <>
      {usuario.tema && usuario.mascota && <SincronizarApariencia tema={usuario.tema} mascota={usuario.mascota} />}
      <Navegacion items={items} accion={<MenuUsuario nombre={usuario.nombre} rol="estudiante" />} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:pb-12">{children}</main>
    </>
  );
}
