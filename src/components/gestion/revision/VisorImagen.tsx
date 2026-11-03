"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog } from "@/components/ui";
export function VisorImagen({ imagen, alCerrar }: { imagen: { url: string; nombre: string }; alCerrar: () => void }) {
  const t = useTranslations("gestion.revision");
  const [real, setReal] = useState(false);
  return <Dialog abierto alCerrar={alCerrar} titulo={t("visor")} etiquetaCerrar={t("cerrarImagen")} className="w-[calc(100%-1rem)]! max-w-6xl!">
    <Button variante="secundario" aria-pressed={real} onClick={() => setReal(!real)}>{t("zoom")}</Button>
    <div className="mt-3 max-h-[70dvh] overflow-auto">
      <button type="button" aria-label={t("zoom")} onClick={() => setReal(!real)} className="block min-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- adjunto autenticado temporal */}
        <img src={imagen.url} alt={imagen.nombre} className={real ? "max-w-none" : "mx-auto max-h-[65dvh] max-w-full object-contain"} />
      </button>
    </div>
  </Dialog>;
}
