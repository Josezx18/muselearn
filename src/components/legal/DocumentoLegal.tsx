import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { marca } from "@/config/marca";
import { TERMINOS_VERSION } from "@/lib/terminos";

interface Seccion {
  titulo: string;
  parrafos: string[];
}

/** Política de privacidad o Términos de uso. El texto vive en messages/{es,en}/legal.json. */
export async function DocumentoLegal({
  tipo,
}: {
  tipo: "privacidad" | "terminos";
}) {
  const t = await getTranslations("legal");
  const formato = await getFormatter();
  const secciones = t.raw(`${tipo}.secciones`) as Seccion[];
  const fecha = formato.dateTime(new Date(`${TERMINOS_VERSION}T12:00:00Z`), {
    dateStyle: "long",
  });
  return (
    <article className="rounded-2xl border-2 border-borde bg-superficie p-5 sm:p-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t(`${tipo}.titulo`)}
      </h1>
      <p className="mt-2 text-sm text-tinta-suave">
        {t("actualizada", { fecha })}
      </p>
      <p className="mt-5 text-lg">{t(`${tipo}.intro`)}</p>
      <div className="mt-6 grid gap-6">
        {secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="font-titulo text-xl font-extrabold">{s.titulo}</h2>
            {s.parrafos.map((p, i) => (
              <p key={i} className="mt-2 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-8 rounded-xl bg-fondo p-4 text-sm text-tinta-suave">
        {t("aviso")}
      </p>
      <p className="mt-4 text-sm">
        {t("contacto")}
        <a
          href={`mailto:${marca.contactoPrivacidad}`}
          className="font-bold text-primario-fuerte underline-offset-4 hover:underline"
        >
          {marca.contactoPrivacidad}
        </a>
      </p>
      <p className="mt-6 flex flex-wrap gap-4 text-sm font-bold">
        <Link
          href={tipo === "privacidad" ? "/terminos" : "/privacidad"}
          className="text-primario-fuerte underline-offset-4 hover:underline"
        >
          {t(`otro.${tipo}`)}
        </Link>
      </p>
    </article>
  );
}
