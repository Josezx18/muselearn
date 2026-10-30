import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import plan from "../../../docs/capturas/demo-02-hoy-1440.png";
import tutor from "../../../docs/capturas/demo-04-tutor-1440.png";
import verificacion from "../../../docs/capturas/demo-06-verificacion-1440.png";
import docente from "../../../docs/capturas/demo-08-general-1440.png";
import crear from "../../../docs/capturas/demo-01-crear-ia-1440.png";

const capturas = [plan, tutor, verificacion, docente, crear];
// Mantener la misma tabla de modelos que README.md.
const modelos = [
  ["Muse Spark 1.3", "Meta Model API"],
  ["Muse Voice Transcribe 1.0", "Meta Model API"],
  ["Muse Spark Open", "Baseten · Modal"],
  ["Muse Glimmer 30B", "NVIDIA"],
];

export async function ComoFunciona() {
  const t = await getTranslations("legal.comoFunciona");
  return (
    <article className="min-w-0 space-y-10 pb-8">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-5xl">{t("titulo")}</h1>
        <p className="mt-4 text-lg text-tinta-suave">{t("intro")}</p>
        <p className="mt-3 text-sm text-tinta-suave">{t("capturas")}</p>
      </header>
      {capturas.map((src, i) => (
        <section key={src.src} aria-labelledby={`paso-${i}`}>
          <h2 id={`paso-${i}`} className="text-2xl font-bold">{t(`secciones.${i}.0`)}</h2>
          <p className="mb-4 mt-2 text-tinta-suave">{t(`secciones.${i}.1`)}</p>
          <Image src={src} alt={t(`secciones.${i}.2`)} sizes="(max-width: 768px) calc(100vw - 32px), 736px" className="h-auto w-full rounded-xl border border-borde" />
        </section>
      ))}
      <section aria-labelledby="modelos">
        <h2 id="modelos" className="mb-4 text-2xl font-bold">{t("modelos")}</h2>
        <table className="w-full table-fixed border-collapse text-left text-sm [overflow-wrap:anywhere]">
          <thead><tr>{[0, 1, 2].map((i) => <th key={i} scope="col" className="border-b border-borde p-2">{t(`columnas.${i}`)}</th>)}</tr></thead>
          <tbody>{modelos.map(([modelo, proveedor], i) => (
            <tr key={modelo}>
              <th scope="row" className="border-b border-borde p-2 font-normal">{t(`trabajos.${i}`)}</th>
              <td className="border-b border-borde p-2">{modelo}</td>
              <td className="border-b border-borde p-2">{proveedor}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
      <section aria-labelledby="privacidad">
        <h2 id="privacidad" className="text-2xl font-bold">{t("privacidad")}</h2>
        <p className="my-3 text-tinta-suave">{t("privacidadTexto")}</p>
        <Link href="/privacidad" className="underline underline-offset-4">{t("privacidadEnlace")}</Link>
      </section>
      <Link href="/" className="inline-block underline underline-offset-4">{t("volver")}</Link>
    </article>
  );
}
