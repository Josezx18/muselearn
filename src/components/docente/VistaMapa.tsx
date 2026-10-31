"use client";
import { useTranslations } from "next-intl";
import type { MapaComprension, Usuario, NivelDominio } from "@/types/contratos";

type Datos = {
  mapa: MapaComprension;
  estudiantes: Usuario[];
  entregas: import("@/types/contratos").Entrega[];
  tareas: import("@/types/contratos").Tarea[];
  informes: import("@/lib/comprension-resumen").InformeDeEstudiante[];
};

const colores = { 1: "bg-nivel-1 text-white", 2: "bg-nivel-2 text-tinta", 3: "bg-nivel-3 text-white", 4: "bg-nivel-4 text-white" };
const NIVELES = [1, 2, 3, 4] as const;

export function VistaMapa({ datos, alVerEstudiante }: { datos: Datos; alVerEstudiante: (id: string) => void }) {
  const t = useTranslations("docente"),
    comun = useTranslations("informes");

  return (
    <div className="grid gap-4">
      <Leyenda />
      {!datos.mapa.conceptos.length && <p>{t("vacio")}</p>}
      <div role="region" aria-label={t("titulo")} tabIndex={0} className="min-w-0 max-w-full overflow-x-auto rounded border border-borde">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t("titulo")}</caption>
          <thead>
            <tr>
              <th className="p-3 text-left">{t("detalle")}</th>
              {datos.mapa.conceptos.map((c: string) => (
                <th className="min-w-36 p-3" key={c}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.estudiantes.map((u: Usuario) => (
              <tr key={u.id}>
                <th className="p-3 text-left">
                  <button className="text-primario underline" onClick={() => alVerEstudiante(u.id)}>
                    {u.nombre}
                  </button>
                </th>
                {datos.mapa.conceptos.map((c: string) => {
                  const nivel = datos.mapa.celdas.find((x) => x.estudiante_id === u.id && x.concepto === c)?.nivel;
                  return (
                    <td className="border border-borde p-1" key={c}>
                      <button
                        onClick={() => alVerEstudiante(u.id)}
                        aria-label={`${u.nombre}, ${c}: ${nivel ? `${nivel} · ${comun(`niveles.${nivel}`)}` : t("sinDato")}`}
                        className={`w-full rounded-lg p-3 font-titulo font-extrabold ${nivel ? colores[nivel as NivelDominio] : "bg-nivel-vacio text-tinta-suave"}`}
                      >
                        {nivel ?? t("sinDato")}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Leyenda() {
  const t = useTranslations("docente"),
    comun = useTranslations("informes");
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {NIVELES.map((n) => (
        <span key={n} className={`rounded-lg px-2.5 py-1 font-bold ${colores[n]}`}>
          {n} · {comun(`niveles.${n}`)}
        </span>
      ))}
      <span className="rounded-lg bg-nivel-vacio px-2.5 py-1 font-bold text-tinta-suave">{t("sinDato")}</span>
    </div>
  );
}