import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SelectorIdioma } from "@/components/comun/SelectorIdioma";
import { Logo } from "@/components/comun/Logo";

// Portada. El elemento memorable es la hoja de cuaderno: así se ve una entrega y la pregunta que la verifica.
const MAPA: (1 | 2 | 3 | 4 | null)[][] = [
  [4, 3, 2],
  [3, 3, 3],
  [1, 1, 1],
  [3, 2, 3],
  [2, 2, 1],
];
const COLOR_NIVEL = { 1: "bg-nivel-1", 2: "bg-nivel-2", 3: "bg-nivel-3", 4: "bg-nivel-4" } as const;

export default async function Portada() {
  const t = await getTranslations("comun");
  const pasos = [
    { titulo: t("inicio.pasos.organiza"), detalle: t("inicio.pasos.organizaDetalle") },
    { titulo: t("inicio.pasos.aprende"), detalle: t("inicio.pasos.aprendeDetalle") },
    { titulo: t("inicio.pasos.demuestra"), detalle: t("inicio.pasos.demuestraDetalle") },
  ];
  const conceptos = t.raw("inicio.docente.conceptos") as string[];
  const estudiantes = t.raw("inicio.docente.estudiantes") as string[];

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-5">
        <Logo />
        <SelectorIdioma />
      </header>

      <main className="flex-1">
        {/* Portada: titular + hoja de cuaderno */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1fr_1.05fr] md:pt-16">
          <div>
            <h1 className="max-w-xl text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.025em] sm:text-6xl">{t("app.lema")}</h1>
            <p className="mt-5 max-w-md text-lg text-tinta-suave">{t("app.descripcion")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-13 items-center justify-center rounded-xl bg-primario px-7 text-lg font-bold text-white shadow-[0_3px_0_0_var(--color-primario-fuerte)] hover:bg-primario-fuerte active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--color-primario-fuerte)]"
              >
                {t("inicio.soyEstudiante")}
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border-2 border-borde bg-superficie px-7 text-lg font-bold shadow-[0_3px_0_0_var(--color-borde)] active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--color-borde)]"
              >
                {t("inicio.soyDocente")}
              </Link>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-lg" aria-label={t("inicio.cuaderno.etiqueta")}>
            {/* Hoja con agujeros de anillado */}
            <div className="papel papel-margen relative overflow-hidden rounded-[18px] border-2 border-borde pb-6 pl-14 pr-5 pt-7 shadow-[6px_8px_0_0_var(--color-cuadricula)] -rotate-[1.2deg]">
              <div aria-hidden className="absolute left-3 top-6 flex flex-col gap-9">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="size-3.5 rounded-full border-2 border-borde bg-fondo" />
                ))}
              </div>
              <ol className="font-mano text-[1.9rem] leading-[44px] text-tinta">
                <li className="aparece [--retraso:0ms]">1) 3x + 5 = 20</li>
                <li className="aparece [--retraso:350ms]">
                  2) <span className="rounded-sm bg-resaltador-claro px-1">3x + 5 − 5 = 20 − 5</span>
                </li>
                <li className="aparece [--retraso:700ms]">3) 3x = 15</li>
                <li className="aparece [--retraso:1050ms]">
                  4) x = 5 <span className="text-primario">✓</span>
                </li>
              </ol>
            </div>

            {/* Nota al margen: la pregunta de verificación y la respuesta del estudiante */}
            <figcaption className="aparece relative z-10 -mt-6 ml-4 mr-1 rounded-2xl border-2 border-tinta bg-superficie p-4 shadow-[4px_4px_0_0_var(--color-tinta)] [--retraso:1500ms] sm:ml-16">
              <p className="text-sm font-bold text-primario-fuerte">{t("inicio.cuaderno.margen")}</p>
              <p className="mt-1 font-titulo text-lg font-bold leading-snug">{t("inicio.cuaderno.pregunta")}</p>
              <div className="mt-3 flex gap-3 rounded-xl bg-fondo p-3">
                <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-primario" aria-hidden>
                  <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                  <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="text-[0.95rem]">“{t("inicio.cuaderno.respuesta")}”</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-tinta-suave">
                    {t("inicio.cuaderno.respondio")}
                    <span className="rounded-full bg-nivel-3 px-2 py-0.5 font-bold text-white">3 · {t("inicio.cuaderno.nivel")}</span>
                  </p>
                </div>
              </div>
            </figcaption>
          </figure>
        </section>

        {/* Cómo funciona: es una secuencia real (planificar → practicar → explicar) */}
        <section className="border-y-2 border-borde bg-superficie">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <h2 className="text-2xl font-extrabold sm:text-3xl">{t("inicio.comoFunciona")}</h2>
            <ol className="relative mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
              <span aria-hidden className="absolute left-5 top-10 hidden h-0.5 w-[calc(100%-2.5rem)] bg-borde sm:block" />
              {pasos.map((p, i) => (
                <li key={p.titulo} className="relative flex gap-4 sm:block">
                  <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 border-tinta bg-resaltador font-titulo text-lg font-extrabold">
                    {i + 1}
                  </span>
                  <div className="sm:mt-4">
                    <h3 className="text-xl font-bold">{p.titulo}</h3>
                    <p className="mt-1 max-w-xs text-tinta-suave">{p.detalle}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Lo que ve el docente */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">{t("inicio.docente.titulo")}</h2>
            <p className="mt-3 max-w-md text-lg text-tinta-suave">{t("inicio.docente.texto")}</p>
            <dl className="mt-6 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-borde bg-superficie p-4">
                <dt className="text-sm text-tinta-suave">{t("inicio.docente.entrego")}</dt>
                <dd className="font-titulo text-4xl font-extrabold">100 %</dd>
              </div>
              <div className="rounded-2xl border-2 border-tinta bg-resaltador-claro p-4">
                <dt className="text-sm text-tinta">{t("inicio.docente.comprendio")}</dt>
                <dd className="font-titulo text-4xl font-extrabold">60 %</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-borde bg-superficie p-4" aria-hidden>
            <div className="grid min-w-[18.5rem] grid-cols-[4.25rem_repeat(3,1fr)] gap-1.5 text-xs sm:grid-cols-[6rem_repeat(3,1fr)] sm:text-sm">
              <span />
              {conceptos.map((c) => (
                <span key={c} className="px-1 pb-1 font-bold leading-tight">
                  {c}
                </span>
              ))}
              {estudiantes.map((e, fila) => (
                <div key={e} className="contents">
                  <span className="self-center font-bold">{e}</span>
                  {MAPA[fila].map((n, col) => (
                    <span
                      key={col}
                      className={`grid h-10 place-items-center rounded-lg font-bold ${n ? `${COLOR_NIVEL[n]} ${n === 2 ? "text-tinta" : "text-white"}` : "bg-nivel-vacio text-tinta-suave"}`}
                    >
                      {n ?? "–"}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-sm text-tinta-suave">{t("inicio.pie")}</footer>
    </div>
  );
}
