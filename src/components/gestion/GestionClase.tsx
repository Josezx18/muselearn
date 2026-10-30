"use client";
import { BotonExportar } from "@/lib/exportar/BotonExportar";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, Dialog, Input, Skeleton, Tabs, useToast } from "@/components/ui";
import { ListaTareas } from "@/components/tareas";
import { borrarClase, cambiarCodigoClase, editarClase, listarEstudiantes, listarTareas, quitarEstudiante } from "@/lib/api-cliente";
import type { Clase, Usuario } from "@/types/contratos";

/** Página de una clase del docente: datos y código, tareas y estudiantes, con editar y borrar. */
export function GestionClase({ claseInicial }: { claseInicial: Clase }) {
  const t = useTranslations("gestion");
  const tc = useTranslations("clases.nueva");
  const avisar = useToast();
  const router = useRouter();
  const [clase, setClase] = useState(claseInicial);
  const [dialogo, setDialogo] = useState<null | "editar" | "borrar" | "codigo">(null);
  const [ocupado, setOcupado] = useState(false);
  const [numTareas, setNumTareas] = useState(0);
  const [confirmacion, setConfirmacion] = useState("");

  const cerrar = () => {
    setDialogo(null);
    setConfirmacion("");
  };

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setOcupado(true);
    try {
      setClase(
        await editarClase(clase.id, { nombre: String(d.get("nombre")), materia: String(d.get("materia")), grado: String(d.get("grado")) }),
      );
      avisar(t("clase.guardada"), "exito");
      cerrar();
    } catch {
      avisar(t("clase.error"), "error");
    } finally {
      setOcupado(false);
    }
  }

  async function nuevoCodigo() {
    setOcupado(true);
    try {
      const c = await cambiarCodigoClase(clase.id);
      setClase(c);
      avisar(t("clase.codigoNuevo", { codigo: c.codigo_inscripcion }), "exito");
      cerrar();
    } catch {
      avisar(t("clase.error"), "error");
    } finally {
      setOcupado(false);
    }
  }

  async function borrar() {
    setOcupado(true);
    try {
      await borrarClase(clase.id);
      avisar(t("clase.borrada"), "exito");
      router.push("/docente/clases");
    } catch {
      avisar(t("clase.error"), "error");
      setOcupado(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-extrabold tracking-tight">{clase.nombre}</h1>
          <p className="text-tinta-suave">
            {clase.materia} · {clase.grado}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotonExportar claseId={clase.id} tipo="entregas" etiqueta={t("exportarEntregas")} error={t("exportarError")} />
          <Button variante="secundario" tamano="sm" onClick={() => setDialogo("editar")}>
            {t("clase.editar")}
          </Button>
          <Button
            variante="fantasma"
            tamano="sm"
            className="text-peligro"
            onClick={() => {
              setDialogo("borrar");
              listarTareas(clase.id)
                .then((ts) => setNumTareas(ts.length))
                .catch(() => undefined);
            }}
          >
            {t("clase.borrar")}
          </Button>
        </div>
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-tinta-suave">{t("clase.codigo")}</p>
          <p className="font-mono text-3xl font-extrabold tracking-[0.25em]">{clase.codigo_inscripcion}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variante="secundario"
            tamano="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(clase.codigo_inscripcion).then(() => avisar(t("clase.copiado"), "exito"));
            }}
          >
            {t("clase.copiar")}
          </Button>
          <Button variante="fantasma" tamano="sm" onClick={() => setDialogo("codigo")}>
            {t("clase.cambiarCodigo")}
          </Button>
        </div>
      </Card>

      <Tabs
        pestanas={[
          { id: "tareas", etiqueta: t("pestanas.tareas"), contenido: <ListaTareas claseId={clase.id} /> },
          { id: "estudiantes", etiqueta: t("pestanas.estudiantes"), contenido: <ListaEstudiantes claseId={clase.id} /> },
        ]}
      />

      <Dialog abierto={dialogo === "editar"} alCerrar={cerrar} titulo={t("clase.editar")}>
        <form onSubmit={guardar} className="grid gap-4">
          <Input name="nombre" etiqueta={tc("nombre")} defaultValue={clase.nombre} required minLength={2} maxLength={80} />
          <Input name="materia" etiqueta={tc("materia")} defaultValue={clase.materia} required minLength={2} maxLength={60} />
          <Input name="grado" etiqueta={tc("grado")} defaultValue={clase.grado} required maxLength={30} />
          <div className="flex justify-end gap-2">
            <Button type="button" variante="secundario" onClick={cerrar}>
              {t("clase.cancelar")}
            </Button>
            <Button type="submit" cargando={ocupado}>
              {t("clase.guardar")}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog abierto={dialogo === "codigo"} alCerrar={cerrar} titulo={t("clase.cambiarCodigo")}>
        <p>{t("clase.confirmarCodigo")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variante="secundario" onClick={cerrar}>
            {t("clase.cancelar")}
          </Button>
          <Button cargando={ocupado} onClick={() => void nuevoCodigo()}>
            {t("clase.cambiarCodigo")}
          </Button>
        </div>
      </Dialog>

      <Dialog abierto={dialogo === "borrar"} alCerrar={cerrar} titulo={t("clase.borrar")}>
        <p>{t("clase.confirmarBorrar", { tareas: numTareas })}</p>
        <div className="mt-4">
          <Input
            etiqueta={t("clase.escribeNombre")}
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            autoComplete="off"
            placeholder={clase.nombre}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variante="secundario" onClick={cerrar}>
            {t("clase.cancelar")}
          </Button>
          <Button
            variante="peligro"
            cargando={ocupado}
            disabled={confirmacion.trim() !== clase.nombre.trim()}
            onClick={() => void borrar()}
          >
            {t("clase.borrarDefinitivo")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function ListaEstudiantes({ claseId }: { claseId: string }) {
  const t = useTranslations("gestion");
  const avisar = useToast();
  const [lista, setLista] = useState<Usuario[] | null>(null);
  const [quitando, setQuitando] = useState<Usuario | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    listarEstudiantes(claseId)
      .then((l) => vivo && setLista(l))
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, [claseId]);

  async function confirmar() {
    if (!quitando) return;
    setOcupado(true);
    try {
      await quitarEstudiante(claseId, quitando.id);
      setLista((l) => l?.filter((u) => u.id !== quitando.id) ?? null);
      avisar(t("estudiantes.quitado", { nombre: quitando.nombre }), "exito");
      setQuitando(null);
    } catch {
      avisar(t("clase.error"), "error");
    } finally {
      setOcupado(false);
    }
  }

  if (!lista) return <Skeleton className="h-32" />;
  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-bold">{t("estudiantes.titulo", { n: lista.length })}</h2>
      {lista.length === 0 ? (
        <Card className="text-center text-tinta-suave">{t("estudiantes.vacio")}</Card>
      ) : (
        <ul className="grid gap-2">
          {lista.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-borde bg-superficie p-3">
              <span className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primario-claro font-bold text-primario-fuerte"
                >
                  {u.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="truncate font-bold">{u.nombre}</span>
              </span>
              <Button variante="fantasma" tamano="sm" onClick={() => setQuitando(u)}>
                {t("estudiantes.quitar")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog abierto={!!quitando} alCerrar={() => setQuitando(null)} titulo={t("estudiantes.quitar")}>
        <p>{quitando && t("estudiantes.confirmarQuitar", { nombre: quitando.nombre })}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setQuitando(null)}>
            {t("clase.cancelar")}
          </Button>
          <Button variante="peligro" cargando={ocupado} onClick={() => void confirmar()}>
            {t("estudiantes.quitar")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
