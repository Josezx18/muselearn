"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button, Textarea, useToast } from "@/components/ui";
import {
  ErrorApi,
  borradorComentarioIA,
  borrarComentario,
  guardarComentario,
} from "@/lib/api-cliente";
import type { ComentarioDocente } from "@/types/contratos";

/**
 * Comentario del docente para el estudiante, dentro de la ventana de la entrega. Muse puede escribir un
 * borrador (con lo que entregó y lo que respondió en la verificación); el docente lo edita y lo envía.
 */
export function ComentarioEntrega({
  entregaId,
  inicial,
  entregada,
}: {
  entregaId: string;
  inicial: ComentarioDocente | null;
  entregada: boolean;
}) {
  const t = useTranslations("gestion.comentario");
  const formato = useFormatter();
  const avisar = useToast();
  const [guardado, setGuardado] = useState<ComentarioDocente | null>(inicial);
  const [texto, setTexto] = useState(inicial?.texto ?? "");
  const [pensando, setPensando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiado = texto.trim() !== (guardado?.texto ?? "");

  async function borrador() {
    setPensando(true);
    setError(null);
    try {
      const b = await borradorComentarioIA(entregaId);
      setTexto(b.texto);
    } catch (e) {
      const codigo = e instanceof ErrorApi ? e.codigo : "";
      setError(
        t(
          codigo === "limite_diario_ia_docente"
            ? "errores.limite"
            : "errores.ia",
        ),
      );
    } finally {
      setPensando(false);
    }
  }

  async function guardar() {
    if (!texto.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      setGuardado(await guardarComentario(entregaId, texto.trim()));
      avisar(t("guardado"), "exito");
    } catch {
      setError(t("errores.guardar"));
    } finally {
      setGuardando(false);
    }
  }

  async function quitar() {
    setGuardando(true);
    setError(null);
    try {
      await borrarComentario(entregaId);
      setGuardado(null);
      setTexto("");
      avisar(t("quitado"), "exito");
    } catch {
      setError(t("errores.guardar"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section
      aria-labelledby="titulo-comentario"
      className="rounded-2xl border-2 border-primario p-4"
    >
      <h3 id="titulo-comentario" className="font-bold">
        {t("titulo")}
      </h3>
      <p className="mt-1 text-sm text-tinta-suave">
        {guardado
          ? t("enviado", {
              fecha: formato.dateTime(new Date(guardado.actualizado_en), {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })
          : t("ayuda")}
      </p>
      <div className="mt-3 grid gap-3">
        <Textarea
          aria-label={t("titulo")}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t("placeholder")}
          rows={5}
          maxLength={4000}
          disabled={pensando}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-peligro">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={borrador}
            disabled={pensando || !entregada}
            aria-busy={pensando || undefined}
            className="fondo-ia inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden>✦</span>{" "}
            {pensando
              ? t("pensando")
              : texto.trim()
                ? t("otroBorrador")
                : t("borrador")}
          </button>
          <div className="flex flex-wrap gap-2">
            {guardado && (
              <Button
                type="button"
                variante="fantasma"
                tamano="sm"
                onClick={quitar}
                disabled={guardando}
              >
                {t("quitar")}
              </Button>
            )}
            <Button
              type="button"
              tamano="sm"
              onClick={guardar}
              cargando={guardando}
              disabled={!texto.trim() || !cambiado}
            >
              {guardado ? t("actualizar") : t("enviar")}
            </Button>
          </div>
        </div>
        <p className="text-xs text-tinta-suave">{t("aviso")}</p>
      </div>
    </section>
  );
}
