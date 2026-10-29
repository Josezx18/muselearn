"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, Card, Dialog, Input } from "@/components/ui";
import { eliminarMiCuenta, obtenerPerfil, usarMocks } from "@/lib/api-cliente";
import type { PerfilUsuario } from "@/types/contratos";

/** Configuración → Privacidad y datos: lo aceptado, descargar mis datos y eliminar la cuenta. */
export function PrivacidadDatos({ rol }: { rol: "docente" | "estudiante" }) {
  const t = useTranslations("cuenta.privacidad");
  const formato = useFormatter();
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [palabra, setPalabra] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    obtenerPerfil()
      .then((p) => vivo && setPerfil(p))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const confirmada = ["ELIMINAR", "DELETE"].includes(
    palabra.trim().toUpperCase(),
  );

  async function eliminar() {
    setOcupado(true);
    setError(false);
    try {
      await eliminarMiCuenta(palabra);
      router.replace("/"); // la sesión ya no existe: a la portada
      router.refresh();
    } catch {
      setError(true);
      setOcupado(false);
    }
  }

  return (
    <Card className="grid gap-4">
      <div>
        <h2 className="text-xl font-extrabold">{t("titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("intro")}</p>
      </div>

      <div className="rounded-xl bg-fondo p-3 text-sm">
        {perfil?.terminos_aceptados_en ? (
          <p>
            {t("aceptaste", {
              fecha: formato.dateTime(new Date(perfil.terminos_aceptados_en), {
                dateStyle: "long",
              }),
            })}
          </p>
        ) : (
          <p>{t("documentos")}</p>
        )}
        <p className="mt-2 flex flex-wrap gap-4 font-bold">
          <Link
            href="/privacidad"
            className="text-primario-fuerte underline-offset-4 hover:underline"
          >
            {t("verPrivacidad")}
          </Link>
          <Link
            href="/terminos"
            className="text-primario-fuerte underline-offset-4 hover:underline"
          >
            {t("verTerminos")}
          </Link>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">{t("descargar")}</h3>
          <p className="text-sm text-tinta-suave">{t("descargarAyuda")}</p>
        </div>
        {usarMocks() ? (
          <Button type="button" variante="secundario" disabled>
            {t("descargarBoton")}
          </Button>
        ) : (
          <a
            href="/api/perfil/datos"
            download
            className="inline-flex min-h-11 items-center rounded-xl border-2 border-borde bg-superficie px-4 font-bold shadow-[0_3px_0_0_var(--color-borde)] active:translate-y-[2px] active:shadow-none"
          >
            {t("descargarBoton")}
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-peligro/40 p-3">
        <div className="min-w-0">
          <h3 className="font-bold text-peligro">{t("eliminar")}</h3>
          <p className="text-sm text-tinta-suave">
            {rol === "docente"
              ? t("eliminarAyudaDocente")
              : t("eliminarAyudaEstudiante")}
          </p>
        </div>
        <Button
          type="button"
          variante="peligro"
          onClick={() => setEliminando(true)}
        >
          {t("eliminarBoton")}
        </Button>
      </div>

      <Dialog
        abierto={eliminando}
        alCerrar={() => !ocupado && setEliminando(false)}
        titulo={t("confirmarTitulo")}
        etiquetaCerrar={t("cancelar")}
      >
        <div className="grid gap-4">
          <p>
            {rol === "docente"
              ? t("confirmarDocente")
              : t("confirmarEstudiante")}
          </p>
          <p className="font-bold">{t("noSeDeshace")}</p>
          <Input
            etiqueta={t("escribe")}
            value={palabra}
            onChange={(e) => setPalabra(e.target.value)}
            autoComplete="off"
          />
          {error && (
            <p role="alert" className="text-sm font-medium text-peligro">
              {t("error")}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variante="secundario"
              onClick={() => setEliminando(false)}
              disabled={ocupado}
            >
              {t("cancelar")}
            </Button>
            <Button
              type="button"
              variante="peligro"
              onClick={eliminar}
              disabled={!confirmada}
              cargando={ocupado}
            >
              {t("eliminarDefinitivo")}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
