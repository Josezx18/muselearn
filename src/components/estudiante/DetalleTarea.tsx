"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { obtenerTarea, listarAnalisis, listarClases } from "@/lib/api-cliente";
import type { Tarea, AnalisisTarea } from "@/types/contratos";
import { Button, Card, Skeleton } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { TarjetaTarea } from "./TarjetaTarea";
export function DetalleTarea({id, estudianteId}: {id:string; estudianteId:string}) {
 const t = useTranslations("estudiante"); const [tarea,setTarea] = useState<Tarea|null>(null); const [analisis,setAnalisis] = useState<AnalisisTarea>(); const [materia,setMateria] = useState<string>(); const [error,setError] = useState(false); const [intento,setIntento] = useState(0);
 useEffect(()=> { let activo=true; Promise.all([obtenerTarea(id),listarAnalisis(estudianteId),listarClases()]).then(([ta,a,cs])=>{if(activo) { if(ta.id !== id) {setError(true);return;} setTarea(ta);setAnalisis(a.find(x=>x.tarea_id===id));setMateria(cs.find(c=>c.id===ta.clase_id)?.materia);setError(false);}}).catch(()=>{if(activo)setError(true);});return ()=>{activo=false;}; },[id,estudianteId,intento]);
 return <div className="min-w-0 space-y-6 break-words"><Link className="text-primario underline" href="/estudiante/hoy">{t("volver")}</Link>
 {error ? <div role="alert"><p>{t("error")}</p><Button onClick={()=>setIntento(i=>i+1)}>{t("reintentar")}</Button></div> : !tarea ? <div role="status"><p>{t("carga")}</p><Skeleton className="h-64"/></div> : <>
 <h1 className="text-2xl font-bold">{tarea.titulo}</h1><TarjetaTarea tarea={tarea} analisis={analisis} materia={materia}/>
 <Card><h2 className="text-xl font-semibold">{t("instrucciones")}</h2><p className="mt-3 whitespace-pre-wrap">{tarea.instrucciones}</p></Card>
 <Card><h2 className="text-xl font-semibold">{t("adjuntos")}</h2>{tarea.adjuntos.length ? <ul className="mt-3 space-y-2">{tarea.adjuntos.map((a,i)=><li key={i}>{t("adjuntoPrivado",{nombre:a.nombre})}</li>)}</ul> : <p>{t("sinAdjuntos")}</p>}</Card>
 <Card className="space-y-3"><h2 className="text-xl font-semibold">{t("analisis")}</h2>{analisis ? <><p>{analisis.conceptos.join(" / ")}</p><h3 className="font-semibold">{t("pasos")}</h3><ol className="list-decimal space-y-2 pl-5">{analisis.pasos_sugeridos.map((s,i)=><li key={i}>{s}</li>)}</ol></> : <p>{t("sinAnalisis")}</p>}</Card>
 <Link className="inline-flex min-h-11 items-center rounded-xl bg-primario px-4 py-2 text-white" href={`/estudiante/tarea/${id}/tutor`}>{t("tutor")}</Link>
 <details className="rounded-2xl border border-borde p-4"><summary className="cursor-pointer font-semibold text-primario">{t("entregar")}</summary><p className="mt-3">{t("placeholder")}</p></details>
 </> }</div>;
}
