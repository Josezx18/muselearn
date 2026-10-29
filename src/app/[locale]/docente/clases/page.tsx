import { getTranslations } from "next-intl/server";
import { GestorClases } from "@/components/clases/GestorClases";
import { Link } from "@/i18n/navigation";

// T01 crea y lista las clases (ARQUITECTURA §5: docente/clases/ es de T02 y T01 para crear clase).
// Debajo, el acceso a la pantalla de integraciones con otras plataformas.
export default async function Pagina({ params }: PageProps<"/[locale]/docente/clases">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docente.integraciones" });
  return (
    <div className="grid gap-8">
      <GestorClases />
      <Link
        href="/docente/integraciones"
        className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-borde bg-superficie p-4 hover:border-tinta-suave"
      >
        <span>
          <span className="block font-bold">{t("enlace")}</span>
          <span className="block text-sm text-tinta-suave">{t("enlaceDetalle")}</span>
        </span>
        <span aria-hidden className="text-xl font-bold text-primario">
          →
        </span>
      </Link>
    </div>
  );
}
