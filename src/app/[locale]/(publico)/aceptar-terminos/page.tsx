import { FormularioAceptarTerminos } from "@/components/auth/FormularioAceptarTerminos";
import { redirect } from "@/i18n/navigation";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { usarMocks } from "@/lib/api-cliente";

export default async function PaginaAceptarTerminos({
  params,
}: PageProps<"/[locale]/aceptar-terminos">) {
  const { locale } = await params;
  if (usarMocks()) return <FormularioAceptarTerminos yaHabiaAceptado={false} />;
  const actual = await obtenerUsuarioActual();
  if (!actual) return redirect({ href: "/login", locale });
  return (
    <FormularioAceptarTerminos
      yaHabiaAceptado={Boolean(actual.terminos.version)}
    />
  );
}
