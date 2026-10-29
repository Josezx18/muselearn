import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Enlaces a Privacidad y Términos para pies de página. */
export async function EnlacesLegales({
  className = "",
}: {
  className?: string;
}) {
  const t = await getTranslations("legal");
  return (
    <nav
      aria-label={`${t("privacidad.titulo")} · ${t("terminos.titulo")}`}
      className={`flex flex-wrap gap-x-4 gap-y-1 ${className}`}
    >
      <Link href="/privacidad" className="underline-offset-4 hover:underline">
        {t("privacidad.titulo")}
      </Link>
      <Link href="/terminos" className="underline-offset-4 hover:underline">
        {t("terminos.titulo")}
      </Link>
    </nav>
  );
}
