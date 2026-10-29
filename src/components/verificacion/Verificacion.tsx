"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { iniciarVerificacion, listarEntregas, responderVerificacion, ErrorApi } from "@/lib/api-cliente";
import { useRouter } from "@/i18n/navigation";
import { Button, Textarea } from "@/components/ui";
import type { SesionVerificacion } from "@/types/contratos";
import { EntradaVoz } from "./voz";
import { ConMascota, MascotaBoton } from "@/components/comun/mascotas/ConMascota";
import { BotonVoz } from "@/components/comun/BotonVoz";
import { useVozSalida } from "@/lib/voz-salida";

export function Verificacion({ tareaId, entregaId }: { tareaId: string; entregaId?: string }) {
  const t = useTranslations("verificacion");
  const locale = useLocale();
  const router = useRouter();
  const [sesion, setSesion] = useState<SesionVerificacion | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [via, setVia] = useState<"voz" | "texto">("texto");
  const [ocupado, setOcupado] = useState(false);
  const [vozOcupada, setVozOcupada] = useState(false);
  const [error, setError] = useState<false | "general" | "limite">(false);
  const tm = useTranslations("mascota.verificacion");
  const voz = useVozSalida(locale);
  const activo = useRef(false);
  const pregunta = sesion?.preguntas.at(-1);
  const { hablar } = voz;
  // Cada pregunta nueva se lee en voz alta si la voz del tutor está encendida.
  useEffect(() => {
    if (pregunta?.texto) hablar(pregunta.texto);
  }, [pregunta?.id, pregunta?.texto, hablar]);
  function cargarSesion(nueva: SesionVerificacion) {
    setSesion(nueva);
    setRespuesta(nueva.preguntas.at(-1)?.respuesta ?? "");
    setVia(nueva.preguntas.at(-1)?.via ?? "texto");
  }
  async function empezar() {
    if (activo.current) return;
    activo.current = true;
    setOcupado(true);
    setError(false);
    try {
      if (entregaId) {
        cargarSesion(await iniciarVerificacion(entregaId));
        return;
      }
      const entrega = (await listarEntregas(tareaId)).find((e) => e.estado !== "pendiente");
      if (!entrega) throw new Error("sin_entrega");
      if (entrega.estado === "verificada") {
        router.push(`/estudiante/informe/${entrega.id}`);
        return;
      }
      cargarSesion(await iniciarVerificacion(entrega.id));
    } catch (e) {
      setError(e instanceof ErrorApi && e.codigo.startsWith("limite_diario") ? "limite" : "general");
    } finally {
      activo.current = false;
      setOcupado(false);
    }
  }
  async function enviar() {
    if (!sesion || !pregunta || !respuesta.trim() || activo.current || vozOcupada) return;
    activo.current = true;
    setOcupado(true);
    setError(false);
    voz.callar();
    try {
      const resultado = await responderVerificacion({ sesion_id: sesion.id, pregunta_id: pregunta.id, respuesta, via });
      if ("informe" in resultado) router.push(`/estudiante/informe/${sesion.entrega_id}`);
      else {
        setSesion({
          ...sesion,
          preguntas: [...sesion.preguntas.map((p) => (p.id === pregunta.id ? { ...p, respuesta, via } : p)), resultado.siguiente],
        });
        setRespuesta("");
        setVia("texto");
      }
    } catch (e) {
      setError(e instanceof ErrorApi && e.codigo.startsWith("limite_diario") ? "limite" : "general");
    } finally {
      activo.current = false;
      setOcupado(false);
    }
  }
  function escuchar() {
    if (!pregunta) return;
    if (voz.hablando) voz.callar();
    else voz.hablar(pregunta.texto, { forzar: true });
  }
  const numero = sesion?.preguntas.length ?? 0;
  // Tocar la mascota: lee la pregunta en voz alta (o empieza la verificación si aún no empezó).
  function tocarMascota() {
    if (pregunta) escuchar();
    else void empezar();
  }
  const expresion = vozOcupada ? "escucho" : ocupado ? "pensando" : voz.hablando ? "hola" : pregunta ? "pista" : "hola";
  const mensajeMascota = vozOcupada
    ? tm("escuchando")
    : ocupado
      ? tm("pensando")
      : voz.hablando
        ? tm("hablando")
        : pregunta
          ? tm("pregunta")
          : tm("inicio");
  return (
    <ConMascota expresion={expresion} mensaje={mensajeMascota} hablando={voz.hablando} alTocar={tocarMascota}>
      <section className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-extrabold">{t("titulo")}</h1>
            {!pregunta && <p className="mt-3 max-w-prose text-lg text-tinta-suave">{t("tranquilidad")}</p>}
            {voz.disponible && (
              <BotonVoz
                className="mt-3"
                activa={voz.activa}
                alCambiar={voz.activar}
                etiquetas={{ encendida: t("voz.encendida"), apagada: t("voz.apagada") }}
              />
            )}
          </div>
          <MascotaBoton
            expresion={expresion}
            viva
            hablando={voz.hablando}
            flota={ocupado || vozOcupada}
            alTocar={tocarMascota}
            className="size-20 lg:hidden"
          />
        </header>
        {error && (
          <p role="alert" className="rounded-2xl border-2 border-peligro bg-peligro-claro p-4 font-bold text-peligro">
            {t(error === "limite" ? "limite" : "error")}
          </p>
        )}
        {!pregunta ? (
          <div className="papel papel-margen rounded-2xl border-2 border-borde py-6 pl-14 pr-5">
            <ol className="space-y-3 font-mano text-2xl text-tinta" aria-hidden>
              <li>1) ¿Cómo empezaste?</li>
              <li>2) ¿Por qué ese paso?</li>
              <li>3) ¿Cómo sabes que está bien?</li>
            </ol>
            <Button tamano="lg" className="mt-6 w-full sm:w-auto" onClick={() => void empezar()} cargando={ocupado}>
              {t("empezar")}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5" aria-hidden>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`h-2.5 w-8 rounded-full ${n < numero ? "bg-primario" : n === numero ? "bg-resaltador" : "bg-nivel-vacio"}`}
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-tinta-suave">{t("progreso", { numero })}</p>
            </div>
            <div className="papel rounded-2xl border-2 border-tinta p-5 shadow-[4px_4px_0_0_var(--sombra-fuerte)]">
              <h2 className="break-words font-titulo text-2xl font-extrabold leading-snug" aria-live="polite">
                {pregunta.texto}
              </h2>
              {voz.disponible && (
                <Button variante="fantasma" tamano="sm" className="mt-3 -ml-2" onClick={escuchar}>
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
                    <path
                      d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {voz.hablando ? t("voz.callar") : t("escuchar")}
                </Button>
              )}
            </div>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void enviar();
              }}
            >
              <EntradaVoz
                tareaId={tareaId}
                disabled={ocupado}
                onOcupado={setVozOcupada}
                onTexto={(texto) => {
                  setRespuesta(texto);
                  setVia("voz");
                }}
              />
              <Textarea
                etiqueta={t("respuesta")}
                ayuda={t("corregir")}
                value={respuesta}
                maxLength={10000}
                disabled={ocupado}
                onChange={(e) => setRespuesta(e.target.value)}
              />
              <Button type="submit" tamano="lg" cargando={ocupado} disabled={!respuesta.trim() || vozOcupada}>
                {t("enviar")}
              </Button>
            </form>
          </>
        )}
      </section>
    </ConMascota>
  );
}
