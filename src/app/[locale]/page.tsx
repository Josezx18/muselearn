import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SelectorIdioma } from "@/components/comun/SelectorIdioma";

// Portada (T00). T01 puede cambiar los destinos de los botones al terminar el login.
export default async function Portada() {
  const t = await getTranslations("comun");
  const pasos = [
    { titulo: t("inicio.pasos.organiza"), detalle: t("inicio.pasos.organizaDetalle") },
    { titulo: t("inicio.pasos.aprende"), detalle: t("inicio.pasos.aprendeDetalle") },
    { titulo: t("inicio.pasos.demuestra"), detalle: t("inicio.pasos.demuestraDetalle") },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
      <div className="flex items-center justify-between">
        <span className="text-lg font-extrabold tracking-tight text-primario">{t("app.nombre")}</span>
        <SelectorIdioma />
      </div>

      <section className="flex flex-1 flex-col justify-center py-12">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t("app.lema")}</h1>
        <p className="mt-4 max-w-xl text-lg text-tinta-suave">{t("app.descripcion")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-13 items-center justify-center rounded-xl bg-primario px-6 text-lg font-semibold text-white hover:bg-primario-fuerte"
          >
            {t("inicio.soyEstudiante")}
          </Link>
          <Link
            href="/login"
            className="inline-flex h-13 items-center justify-center rounded-xl border border-borde bg-superficie px-6 text-lg font-semibold hover:bg-fondo"
          >
            {t("inicio.soyDocente")}
          </Link>
        </div>
      </section>

      <ol className="grid gap-3 pb-6 sm:grid-cols-3">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="rounded-2xl border border-borde bg-superficie p-4">
            <span className="text-sm font-bold text-acento">0{i + 1}</span>
            <p className="mt-1 font-semibold">{p.titulo}</p>
            <p className="mt-1 text-sm text-tinta-suave">{p.detalle}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
