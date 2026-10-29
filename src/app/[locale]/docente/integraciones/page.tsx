import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Mascota } from "@/components/comun/mascotas/Mascota";

// Pantalla informativa: las integraciones con plataformas educativas aún no están conectadas.
// Los nombres van como texto (sin logos de terceros) y cada tarjeta dice qué se traerá y qué se devolverá.
const PLATAFORMAS = [
  { clave: "classroom", sigla: "GC" },
  { clave: "teams", sigla: "MT" },
  { clave: "moodle", sigla: "M" },
  { clave: "canvas", sigla: "C" },
  { clave: "schoology", sigla: "S" },
  { clave: "csv", sigla: "CSV" },
] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/docente/integraciones">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docente.integraciones" });
  return { title: t("titulo") };
}

export default async function Pagina({ params }: PageProps<"/[locale]/docente/integraciones">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docente.integraciones" });
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-3xl gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">{t("titulo")}</h1>
          <p className="mt-2 max-w-prose text-lg text-tinta-suave">{t("intro")}</p>
        </div>
        <Mascota expresion="pensando" flota className="hidden size-24 sm:block" />
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {PLATAFORMAS.map(({ clave, sigla }) => (
          <li key={clave} className="flex gap-3 rounded-2xl border-2 border-borde bg-superficie p-4">
            <span
              aria-hidden
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-primario-claro font-titulo text-sm font-extrabold text-primario-fuerte"
            >
              {sigla}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{t(`plataformas.${clave}.nombre`)}</h2>
                <span className="rounded-full bg-resaltador-claro px-2 py-0.5 text-xs font-bold">{t("proximamente")}</span>
              </div>
              <dl className="mt-1 grid gap-0.5 text-sm">
                {clave !== "csv" && (
                  <div>
                    <dt className="inline font-bold">{t("traer")}: </dt>
                    <dd className="inline text-tinta-suave">{t(`plataformas.${clave}.traer`)}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline font-bold">{t("devolver")}: </dt>
                  <dd className="inline text-tinta-suave">{t(`plataformas.${clave}.devolver`)}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ul>

      <p className="rounded-2xl border-2 border-borde bg-fondo p-4 text-tinta-suave">
        {t("hoy")} {t("nota")}
      </p>
      <Link href="/docente/clases" className="font-bold text-primario-fuerte underline-offset-4 hover:underline">
        ← {t("volver")}
      </Link>
    </div>
  );
}
