"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, Input, useToast } from "@/components/ui";
import { crearClase } from "@/lib/api-cliente";
import type { Clase } from "@/types/contratos";

/** Formulario "Nueva clase". Al crear, avisa al padre con la clase (trae el código generado). */
export function FormularioClase({ alCrear }: { alCrear: (clase: Clase) => void }) {
  const t = useTranslations("clases");
  const avisar = useToast();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const datos = new FormData(formulario);
    setCargando(true);
    setError(false);
    try {
      const clase = await crearClase({
        nombre: String(datos.get("nombre") ?? ""),
        materia: String(datos.get("materia") ?? ""),
        grado: String(datos.get("grado") ?? ""),
      });
      formulario.reset();
      avisar(t("nueva.creada"), "exito");
      alCrear(clase);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("nueva.titulo")}</h2>
      <form onSubmit={enviar} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input name="nombre" etiqueta={t("nueva.nombre")} placeholder={t("nueva.nombreEjemplo")} required minLength={2} maxLength={80} />
        </div>
        <Input name="materia" etiqueta={t("nueva.materia")} required minLength={2} maxLength={60} />
        <Input name="grado" etiqueta={t("nueva.grado")} required maxLength={30} />
        {error && (
          <p role="alert" className="text-sm font-medium text-peligro sm:col-span-2">
            {t("nueva.error")}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" cargando={cargando} className="w-full sm:w-auto">
            {t("nueva.crear")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
