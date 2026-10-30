"use client";
import { useState } from "react";
import { Button, useToast } from "@/components/ui";
import { cargarComprension, obtenerClase } from "@/lib/api-cliente";
import { csvComprension, csvEntregas, nombreCSV } from "./csv";

export function BotonExportar({ claseId, tipo, etiqueta, error }: {
  claseId: string; tipo: "entregas" | "comprension"; etiqueta: string; error: string;
}) {
  const [ocupado, setOcupado] = useState(false);
  const avisar = useToast();
  async function descargar() {
    setOcupado(true);
    try {
      // Navegación de archivo: el navegador conserva cookies y Content-Disposition.
      const enlace = document.createElement("a");
      let url: string | undefined;
      if (process.env.NEXT_PUBLIC_USAR_MOCKS === "true") {
        const [datos, clase] = await Promise.all([cargarComprension(claseId), obtenerClase(claseId)]);
        const csv = tipo === "entregas" ? csvEntregas(datos) : csvComprension(datos.estudiantes, datos.mapa);
        url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        enlace.href = url;
        enlace.download = nombreCSV(clase.nombre, tipo);
      } else {
        enlace.href = `/api/clases/${encodeURIComponent(claseId)}/exportar?tipo=${tipo}`;
        enlace.download = "";
      }
      document.body.append(enlace);
      enlace.click();
      enlace.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      avisar(error, "error");
    } finally {
      setOcupado(false);
    }
  }
  return <Button variante="secundario" tamano="sm" disabled={!claseId} cargando={ocupado} onClick={() => void descargar()}>{etiqueta}</Button>;
}
