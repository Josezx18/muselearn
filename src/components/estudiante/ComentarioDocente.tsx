"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { obtenerComentario } from "@/lib/api-cliente";
import type { ComentarioDocente as Comentario } from "@/types/contratos";

/** El comentario que dejó el docente sobre la entrega del estudiante (si hay uno). */
export function ComentarioDocente({ entregaId }: { entregaId: string }) {
  const t = useTranslations("estudiante.comentario");
  const formato = useFormatter();
  const [comentario, setComentario] = useState<Comentario | null>(null);

  useEffect(() => {
    let vivo = true;
    obtenerComentario(entregaId)
      .then((c) => vivo && setComentario(c))
      .catch(() => {}); // sin comentario visible si falla: no bloquea la página
    return () => {
      vivo = false;
    };
  }, [entregaId]);

  if (!comentario) return null;
  return (
    <section
      aria-labelledby="titulo-comentario-docente"
      className="rounded-2xl border-2 border-tinta bg-resaltador-claro p-4 shadow-[3px_3px_0_0_var(--sombra-fuerte)]"
    >
      <h2
        id="titulo-comentario-docente"
        className="font-titulo text-lg font-extrabold"
      >
        {t("titulo")}
      </h2>
      <p className="mt-2 whitespace-pre-wrap">{comentario.texto}</p>
      <p className="mt-2 text-xs text-tinta-suave">
        {formato.dateTime(new Date(comentario.actualizado_en), {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </section>
  );
}
