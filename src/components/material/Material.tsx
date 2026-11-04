"use client";
import { useEffect, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card } from "@/components/ui";
import { obtenerMaterial, generarMaterialEstudio, guardarMaterial, borrarMaterial } from "@/lib/api-cliente";
import { MaterialEstudio, type MaterialGuardado } from "@/types/contratos";
import { useVozSalida } from "@/lib/voz-salida";

export function Material({ tareaId, docente = false }: { tareaId: string; docente?: boolean }) {
  const t = useTranslations("material");
  const id = useId();
  const voz = useVozSalida(useLocale());
  const [registro, setRegistro] = useState<MaterialGuardado | null>(null);
  const [contenido, setContenido] = useState<MaterialEstudio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    let activo = true;
    obtenerMaterial(tareaId, !docente).then(r => {
      if (activo) { setRegistro(r); setContenido(r?.contenido ?? null); setError(""); }
    }).catch(() => { if (activo) setError(t("errorCarga")); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [tareaId, docente, t, recarga]);

  async function actuar(accion: "generar" | "guardar" | "publicar" | "borrar") {
    if (ocupado) return;
    setOcupado(true); setError(""); setAviso(""); voz.callar();
    try {
      let r: MaterialGuardado | null;
      if (accion === "generar") r = await generarMaterialEstudio(tareaId);
      else if (accion === "borrar") { await borrarMaterial(tareaId); r = null; }
      else {
        const validacion = MaterialEstudio.safeParse(contenido);
        if (!validacion.success) { setError(t("invalido")); return; }
        r = await guardarMaterial(tareaId, { contenido: validacion.data,
          ...(accion === "publicar" ? { publicado: !registro?.publicado } : {}) });
      }
      setRegistro(r); setContenido(r?.contenido ?? null); setAviso(t("guardado"));
    } catch { setError(t("errorGuardar")); }
    finally { setOcupado(false); }
  }
  const campo = (clave: string, valor: string, cambiar: (v: string) => void, max: number, multilinea = true) => (
    <label className="block min-w-0 space-y-1" key={clave}>
      <span className="font-bold">{t(clave.split(".")[0])}</span>
      {multilinea ? <textarea className="w-full rounded-xl border-2 border-borde bg-superficie p-3" value={valor} maxLength={max} rows={3} disabled={ocupado} onChange={e => cambiar(e.target.value)} />
        : <input className="w-full rounded-xl border-2 border-borde bg-superficie p-3" value={valor} maxLength={max} disabled={ocupado} onChange={e => cambiar(e.target.value)} />}
    </label>
  );
  if (cargando) return docente ? <p role="status">{t("cargando")}</p> : null;
  if (!docente && !registro && !error) return null;
  return <section aria-labelledby={id} className="my-6 min-w-0 break-words rounded-2xl border-2 border-borde bg-superficie p-4 sm:p-5" aria-busy={ocupado}>
    <h2 id={id} className="text-xl font-extrabold">{t("titulo")}</h2>
    {error && <p role="alert" className="my-3">{error}</p>}
    {error && !registro && <Button onClick={() => setRecarga(n => n + 1)}>{t("reintentar")}</Button>}
    <p role="status" className="text-sm">{ocupado ? t("trabajando") : aviso}</p>
    {docente && <>
      <p className="my-3 text-tinta-suave">{t("revisar")}</p>
      {registro && <p className="mb-3 font-bold">{t(registro.publicado ? "publicado" : "borrador")}</p>}
      <Button disabled={ocupado || !!error && !registro} onClick={() => void actuar("generar")}>{t(registro ? "crearOtro" : "crear")}</Button>
      {registro && <p className="mt-2 text-sm text-tinta-suave">{t("reemplazar")}</p>}
    </>}
    {contenido && <div className="mt-4 space-y-4">
      {docente ? <>
        {campo("nombre", contenido.titulo, v => setContenido({ ...contenido, titulo: v }), 160, false)}
        {campo("resumen", contenido.resumen, v => setContenido({ ...contenido, resumen: v }), 1600)}
        <h3 className="font-bold">{t("conceptos")}</h3>
        {contenido.conceptos.map((c, i) => <fieldset key={i} className="min-w-0 space-y-3 rounded-xl border border-borde p-3">
          <legend>{t("conceptoNumero", { n: i + 1 })}</legend>
          {(["nombre", "explicacion", "ejemplo"] as const).map(k => campo(`${k}.${i}`, c[k], v => setContenido({ ...contenido, conceptos: contenido.conceptos.map((x, j) => j === i ? { ...x, [k]: v } : x) }), k === "nombre" ? 160 : 2000, k !== "nombre"))}
        </fieldset>)}
        <h3 className="font-bold">{t("errores")}</h3>
        {contenido.errores_comunes.map((e, i) => campo(`error.${i}`, e, v => setContenido({ ...contenido, errores_comunes: contenido.errores_comunes.map((x, j) => i === j ? v : x) }), 600))}
        <h3 className="font-bold">{t("tarjetas")}</h3>
        {contenido.autoevaluacion.map((a, i) => <fieldset key={i} className="min-w-0 space-y-3 rounded-xl border border-borde p-3">
          <legend>{t("tarjetaNumero", { n: i + 1 })}</legend>
          {(["pregunta", "respuesta"] as const).map(k => campo(`${k}.${i}`, a[k], v => setContenido({ ...contenido, autoevaluacion: contenido.autoevaluacion.map((x, j) => i === j ? { ...x, [k]: v } : x) }), k === "pregunta" ? 500 : 1000))}
        </fieldset>)}
        {campo("guion", contenido.guion_audio, v => setContenido({ ...contenido, guion_audio: v }), 2400)}
        <div className="flex flex-wrap gap-3">
          <Button disabled={ocupado} onClick={() => void actuar("guardar")}>{t("guardar")}</Button>
          <Button disabled={ocupado} onClick={() => void actuar("publicar")}>{t(registro?.publicado ? "ocultar" : "publicar")}</Button>
          <Button variante="secundario" disabled={ocupado} onClick={() => void actuar("borrar")}>{t("borrar")}</Button>
        </div>
      </> : <>
        <h3 className="font-bold">{contenido.titulo}</h3><p className="whitespace-pre-wrap">{contenido.resumen}</p>
        <h3 className="font-bold">{t("conceptos")}</h3>
        {contenido.conceptos.map((c, i) => <Card key={i}><h4 className="font-bold">{c.nombre}</h4><p className="mt-2 whitespace-pre-wrap">{c.explicacion}</p><p className="mt-2 whitespace-pre-wrap"><strong>{t("ejemplo")}: </strong>{c.ejemplo}</p></Card>)}
        <h3 className="font-bold">{t("errores")}</h3>
        <ul className="list-disc space-y-2 pl-5">{contenido.errores_comunes.map((e, i) => <li key={i}>{e}</li>)}</ul>
        <h3 className="font-bold">{t("tarjetas")}</h3>
        <p>{t("tocar")}</p>
        {contenido.autoevaluacion.map((a, i) => <details key={i} className="rounded-xl border-2 border-borde p-3"><summary className="flex min-h-11 cursor-pointer items-center font-bold">{a.pregunta}</summary><p className="mt-3 whitespace-pre-wrap">{a.respuesta}</p></details>)}
      </>}
      <Button className="min-h-12 w-full sm:w-auto" disabled={!voz.disponible || ocupado} onClick={() => voz.hablando ? voz.callar() : voz.hablar(contenido.guion_audio, { forzar: true })}>{t(voz.hablando ? "detener" : "escuchar")}</Button>
      {!voz.disponible && <p className="text-sm">{t("sinVoz")}</p>}
    </div>}
  </section>;
}
