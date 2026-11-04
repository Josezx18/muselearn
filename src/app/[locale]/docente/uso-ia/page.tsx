import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esAdmin, leerUso } from "@/lib/db/uso-ia";
import { inicioDelDia } from "@/lib/db/limites";
import { calcularCosto, precio } from "@/lib/ia/precios";
import type { IdProveedor } from "@/lib/ia/cliente";

export default async function UsoIA({ params, searchParams }: PageProps<"/[locale]/docente/uso-ia">) {
  if (!process.env.ADMIN_CORREOS?.trim()) notFound();
  const db = await crearClienteServidor();
  const { data: { user } } = await db.auth.getUser();
  if (!esAdmin(user?.email)) notFound();
  const { locale } = await params;
  const t = await getTranslations("uso-ia");
  const periodo = (await searchParams).periodo;
  const filtro = typeof periodo === "string" && ["hoy", "7", "30", "todo"].includes(periodo) ? periodo : "7";
  const inicio = new Date(inicioDelDia());
  if (filtro === "7" || filtro === "30") inicio.setUTCDate(inicio.getUTCDate() - Number(filtro) + 1);
  let filas: Awaited<ReturnType<typeof leerUso>>;
  try { filas = await leerUso(filtro === "todo" ? null : inicio.toISOString()); }
  catch { return <><h1 className="text-3xl font-bold">{t("titulo")}</h1><p role="alert">{t("noDisponible")}</p></>; }
  const dinero = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(n);
  const numero = (n: number) => new Intl.NumberFormat(locale).format(n);
  const nombres = { meta: "Meta", abierto: "Baseten", nvidia: "NVIDIA" };
  const resumen = (grupo: typeof filas) => {
    const entrada = grupo.reduce((s, f) => s + (f.tokens_entrada ?? 0), 0);
    const salida = grupo.reduce((s, f) => s + (f.tokens_salida ?? 0), 0);
    const costos = grupo.map(f => f.funcion === "voz" ? null : calcularCosto(f.proveedor, f.tokens_entrada, f.tokens_salida));
    return { entrada, salida, fallos: grupo.filter(f => !f.ok).length, costo: (costos.some(c => c === null) || (!grupo.length && calcularCosto("abierto", 0, 0) === null)) ? null : costos.reduce<number>((s, c) => s + (c ?? 0), 0) };
  };
  const credito = precio(process.env.CREDITO_ABIERTO_USD) ?? 100;
  // El crédito siempre usa todo el historial, independientemente del filtro del panel.
  let abiertoTotal: ReturnType<typeof resumen> | null = null;
  try { abiertoTotal = resumen((filtro === "todo" ? filas : await leerUso(null)).filter(f => f.proveedor === "abierto")); } catch { /* no mostrar crédito parcial */ }
  const grupos = new Map<string, typeof filas>();
  const dias = new Map<string, number>();
  const offset = Number(process.env.ZONA_OFFSET_MIN ?? -240);
  for (const f of filas) {
    const clave = `${f.funcion}/${f.proveedor}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), f]);
    const dia = new Date(Date.parse(f.creado_en) + (Number.isFinite(offset) ? offset : -240) * 60000).toISOString().slice(0, 10);
    dias.set(dia, (dias.get(dia) ?? 0) + 1);
  }
  const maximo = Math.max(1, ...dias.values());
  return <div className="space-y-6 min-w-0">
    <h1 className="text-3xl font-bold">{t("titulo")}</h1>
    <p className="rounded-xl border border-borde p-4">{t("aviso")}</p>
    <nav className="flex flex-wrap gap-3">{["hoy", "7", "30", "todo"].map(p => <Link key={p} href={`/docente/uso-ia?periodo=${p}`} aria-current={filtro === p ? "page" : undefined} className="rounded-lg border border-borde px-3 py-2 aria-[current=page]:bg-acento">{t(p)}</Link>)}</nav>
    <div className="grid gap-4 md:grid-cols-3">{(["abierto", "meta", "nvidia"] as IdProveedor[]).map(proveedor => {
      const grupo = filas.filter(f => f.proveedor === proveedor); const r = resumen(grupo);
      return <section key={proveedor} className="rounded-xl border border-borde p-4"><h2 className="text-xl font-bold">{nombres[proveedor]}</h2><dl>{[["llamadas", grupo.length], ["fallos", r.fallos], ["entrada", r.entrada], ["salida", r.salida]].map(([k,v]) => <div key={k} className="flex flex-wrap justify-between gap-2"><dt>{t(String(k))}</dt><dd>{numero(Number(v))}</dd></div>)}</dl><p>{t("costo")}: {r.costo === null || !grupo.length ? t("sinPrecio") : dinero(r.costo)}</p></section>;
    })}</div>
    <section className="rounded-xl border border-borde p-4"><h2 className="font-bold">Baseten</h2>{abiertoTotal?.costo !== null && abiertoTotal !== null ? <><p>{t("credito", { usado: dinero(abiertoTotal.costo), total: dinero(credito) })}</p><progress className="w-full" aria-label={t("costo")} value={Math.min(credito, abiertoTotal.costo)} max={credito || 1} /></> : <p>{t("sinPrecio")}</p>}</section>
    {!filas.length && <p>{t("vacio")}</p>}
    <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="text-left font-bold">{t("funcion")}</caption><thead><tr>{["funcion","proveedor","llamadas","fallos","entrada","salida","costo"].map(k => <th key={k} className="p-2 text-left">{t(k)}</th>)}</tr></thead><tbody>{[...grupos].map(([clave,g]) => { const r = resumen(g); return <tr key={clave}>{[t(`funciones.${g[0].funcion}`),nombres[g[0].proveedor],g.length,r.fallos,r.entrada,r.salida,r.costo === null ? t("sinPrecio") : dinero(r.costo)].map((v,i) => <td key={i} className="border-t border-borde p-2">{v}</td>)}</tr>; })}</tbody></table></div>
    <section><h2 className="text-xl font-bold">{t("diario")}</h2><div className="space-y-2">{[...dias].map(([dia,n]) => <div key={dia}><p className="text-sm">{dia}: {numero(n)}</p><div className="h-4 rounded bg-primario" style={{ width: `${100*n/maximo}%` }} /></div>)}</div></section>
    <section><h2 className="text-xl font-bold">{t("errores")}</h2><ul className="space-y-2">{filas.filter(f => !f.ok).slice(-20).reverse().map((f,i) => <li key={i} className="break-words rounded border border-borde p-3">{nombres[f.proveedor]} · {t(`funciones.${f.funcion}`)} · <time dateTime={f.creado_en}>{new Date(f.creado_en).toLocaleString(locale, { timeZone: "UTC" })} UTC</time><p>{f.error}</p></li>)}</ul></section>
  </div>;
}
