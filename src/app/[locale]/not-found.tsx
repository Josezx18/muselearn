import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NoEncontrado() {
  const t = await getTranslations("comun");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-extrabold text-primario">404</p>
      <p className="text-tinta-suave">{t("estado.vacio")}</p>
      <Link href="/" className="font-semibold text-primario underline">
        {t("acciones.volver")}
      </Link>
    </main>
  );
}
