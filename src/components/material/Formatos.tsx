"use client";
import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import type { MaterialEstudio } from "@/types/contratos";

type Formato = "diapositivas" | "mapa" | "infografia";
export function Formatos({ contenido, docente, ocupado, cambiar }: { contenido: MaterialEstudio; docente: boolean; ocupado: boolean; cambiar: (c: MaterialEstudio) => void }) {
  const t = useTranslations("material");
  const [indice, setIndice] = useState(0);
  const [error, setError] = useState(false);
  const visor = useRef<HTMLDivElement>(null);
  const id = useId();
  function imprimir(formato: Formato) {
    document.documentElement.setAttribute("data-material-imprimir", `${id}-${formato}`);
    const nodo = document.querySelector(`[data-material-formato="${id}-${formato}"]`);
    nodo?.setAttribute("data-imprimiendo", "");
    try { window.print(); }
    finally { nodo?.removeAttribute("data-imprimiendo"); document.documentElement.removeAttribute("data-material-imprimir"); }
  }
  function editor(valor: unknown, actualizar: (v: unknown) => void, clave = "titulo"): React.ReactNode {
    if (typeof valor === "string") return <label className="block min-w-0 space-y-1"><span>{t(({ titulo: "tituloCampo", concepto: "tituloCampo", central: "centralCampo", relacion: "relacionCampo", texto: "textoCampo", valor: "valorCampo", cierre: "cierreCampo", nota_docente: "notaCampo" } as Record<string,string>)[clave] ?? "textoCampo")}</span>{clave === "icono" ? <select className="w-full rounded border border-borde bg-superficie p-3" value={valor} disabled={ocupado} onChange={e => actualizar(e.target.value)}>{["idea","pasos","alerta","ejemplo","pregunta","meta"].map(k => <option key={k} value={k}>{t(`iconos.${k}`)}</option>)}</select> : <textarea className="w-full rounded border border-borde bg-superficie p-3" rows={2} value={valor} disabled={ocupado} maxLength={clave === "relacion" ? 80 : ["nota_docente","texto"].includes(clave) ? 600 : 240} onChange={e => actualizar(e.target.value)} />}</label>;
    if (Array.isArray(valor)) return <div className="space-y-3">{valor.map((v,i) => <div className="min-w-0 rounded border border-borde p-2" key={i}>{editor(v,x => actualizar(valor.map((a,j) => j === i ? x : a)),clave)}</div>)}</div>;
    if (valor && typeof valor === "object") return <div className="space-y-2">{Object.entries(valor).map(([k,v]) => <div key={k}>{editor(v,x => actualizar({...valor,[k]:x}),k)}</div>)}</div>;
    return null;
  }
  const ds = contenido.diapositivas;
  const actual = Math.min(indice,(ds?.length ?? 1)-1);
  const mapa = contenido.mapa;
  const inf = contenido.infografia;
  const listaMapa = mapa && <ul className="space-y-3 pl-5">{mapa.ramas.map((r,i) => <li key={i}><strong>{r.relacion} → {r.concepto}</strong><ul className="list-disc pl-5">{r.hijos.map((h,j) => <li key={j}>{h.relacion} → {h.concepto}</li>)}</ul></li>)}</ul>;
  return <div className="min-w-0 space-y-6">
    {(["diapositivas","mapa","infografia"] as const).filter(f => contenido[f]).map(f => <section key={f} className="min-w-0 space-y-3" aria-label={t(f)}>
      <h3 className="text-xl font-bold">{t(f)}</h3>
      <Button variante="secundario" onClick={() => imprimir(f)}>{t("imprimir")}</Button>
      {docente && <details><summary className="cursor-pointer py-3 font-bold">{t("editarFormato",{formato:t(f)})}</summary>{editor(contenido[f],v => cambiar({...contenido,[f]:v}))}</details>}
      <div data-material-formato={`${id}-${f}`} className="material-formato min-w-0 break-words">
      {f === "diapositivas" && ds && <div ref={visor} className="max-h-screen overflow-auto bg-superficie text-tinta" onKeyDown={e => { if(e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); setIndice(n => Math.max(0,Math.min(ds.length-1,n+(e.key === "ArrowRight" ? 1 : -1)))); } }}>
        <div tabIndex={0} role="group" aria-label={t("diapositivas")} className="outline-offset-4">
          {ds.map((d,i) => <article key={i} className={`material-diapositiva aspect-video overflow-auto rounded-xl border-2 border-borde bg-superficie p-4 sm:p-8 ${actual === i ? "" : "hidden"}`}><h4 className="text-lg font-extrabold sm:text-3xl">{d.titulo}</h4><ul className="mt-3 list-disc space-y-2 pl-5 text-sm sm:text-xl">{d.puntos.map((p,j) => <li key={j}>{p}</li>)}</ul></article>)}
        </div>
        <div className="material-controles mt-3 flex flex-wrap items-center gap-3"><Button disabled={actual === 0} onClick={() => setIndice(actual-1)}>{t("anterior")}</Button><span role="status">{actual+1} / {ds.length}</span><Button disabled={actual === ds.length-1} onClick={() => setIndice(actual+1)}>{t("siguiente")}</Button><Button onClick={() => { setError(false); const p = document.fullscreenElement ? document.exitFullscreen?.() : visor.current?.requestFullscreen?.(); if(p) void p.catch(() => setError(true)); else setError(true); }}>{t("pantalla")}</Button>{error && <p role="alert">{t("errorPantalla")}</p>}</div>
      </div>}
      {f === "mapa" && mapa && <><svg role="img" aria-labelledby={`${id}-mapa`} viewBox={`0 0 700 ${mapa.ramas.length*260}`} className="hidden w-full min-[481px]:block"><title id={`${id}-mapa`}>{mapa.central}</title><rect x="5" y={mapa.ramas.length*130-100} width="170" height="200" rx="15" fill="var(--color-superficie)" stroke="currentColor"/><foreignObject x="10" y={mapa.ramas.length*130-90} width="160" height="180"><p className="break-words p-2 text-xl font-bold">{mapa.central}</p></foreignObject>{mapa.ramas.map((r,i) => <g key={i}><path d={`M175,${mapa.ramas.length*130} H185 V${i*260+120} H340`} fill="none" stroke="currentColor"/><foreignObject x="195" y={i*260+10} width="140" height="105"><p className="break-words text-base">{r.relacion}</p></foreignObject><rect x="340" y={i*260+5} width="350" height="245" rx="12" fill="var(--color-superficie)" stroke="currentColor"/><foreignObject x="345" y={i*260+10} width="340" height="235"><div className="break-words p-2 text-lg"><strong>{r.concepto}</strong><ul className="mt-2 list-disc space-y-2 pl-4">{r.hijos.map((h,j) => <li key={j}>{h.relacion} → {h.concepto}</li>)}</ul></div></foreignObject></g>)}</svg><div className="material-mapa-texto space-y-3"><h4 className="font-bold">{mapa.central}</h4>{listaMapa}</div></>}
      {f === "infografia" && inf && <article className="space-y-5 rounded-2xl border-2 border-borde bg-superficie p-4 sm:p-8"><h4 className="text-2xl font-extrabold text-primario">{inf.titulo}</h4>{inf.dato_clave && <p className="rounded-xl border-2 border-borde p-5"><strong className="block text-5xl">{inf.dato_clave.valor}</strong>{inf.dato_clave.texto}</p>}<div className="grid gap-4 sm:grid-cols-2">{inf.secciones.map((s,i) => <section key={i} className="rounded-xl border border-borde p-4"><svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" className="text-primario"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2"/><path d={({idea:"M16 7v12m-4 5h8",pasos:"M9 10h14M9 16h14M9 22h14",alerta:"M16 8v12m0 3v2",ejemplo:"M9 9h14v14H9z",pregunta:"M12 12a4 4 0 118 0c0 4-4 3-4 7m0 3v2",meta:"M8 24V8l16 4-16 5"})[s.icono]} fill="none" stroke="currentColor" strokeWidth="2"/></svg><h5 className="mt-2 font-bold">{s.titulo}</h5><p>{s.texto}</p></section>)}</div>{inf.pasos && <ol className="list-decimal space-y-3 pl-6">{inf.pasos.map((p,i) => <li key={i}>{p}</li>)}</ol>}<p className="border-t-2 border-borde pt-4 font-bold">{inf.cierre}</p></article>}
      </div>
    </section>)}
  </div>;
}
