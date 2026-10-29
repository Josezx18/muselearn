"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Card, Dialog, Input, Skeleton, useToast } from "@/components/ui";
import { ErrorApi, actualizarPerfil, cambiarContrasena, listarClases, obtenerPerfil, salirDeClase } from "@/lib/api-cliente";
import { FormularioUnirse } from "@/components/clases/FormularioUnirse";
import type { Clase, PerfilUsuario } from "@/types/contratos";

const ERRORES_CONTRASENA = ["contrasena_incorrecta", "contrasena_corta", "contrasena_igual"];

/** Mi perfil: datos, contraseña y (estudiante) mis clases. */
export function PaginaPerfil() {
  const t = useTranslations("cuenta");
  const avisar = useToast();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [error, setError] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    obtenerPerfil()
      .then((p) => vivo && setPerfil(p))
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
    };
  }, []);

  async function guardarNombre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nombre = String(new FormData(e.currentTarget).get("nombre") ?? "").trim();
    if (!perfil || nombre.length < 2) return;
    setGuardando(true);
    try {
      setPerfil(await actualizarPerfil({ nombre }));
      avisar(t("perfil.guardado"), "exito");
    } catch {
      avisar(t("perfil.error"), "error");
    } finally {
      setGuardando(false);
    }
  }

  if (error) return <p role="alert">{t("perfil.error")}</p>;
  if (!perfil) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-2xl gap-6">
      <h1 className="text-4xl font-extrabold">{t("perfil.titulo")}</h1>

      <Card>
        <h2 className="text-xl font-bold">{t("perfil.datos")}</h2>
        <form onSubmit={guardarNombre} className="mt-4 grid gap-4">
          <Input
            name="nombre"
            etiqueta={t("perfil.nombre")}
            defaultValue={perfil.nombre}
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
          />
          <div>
            <p className="text-sm font-bold">{t("perfil.correo")}</p>
            <p className="mt-1 break-all">{perfil.correo}</p>
            <p className="mt-1 text-sm text-tinta-suave">{t("perfil.correoAyuda")}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{t("perfil.rol")}</span>
            <Badge>{t(`menu.${perfil.rol}`)}</Badge>
          </div>
          <Button type="submit" cargando={guardando} className="justify-self-start">
            {t("perfil.guardar")}
          </Button>
        </form>
      </Card>

      <CambiarContrasena />

      {perfil.rol === "estudiante" && <MisClases estudianteId={perfil.id} />}
    </div>
  );
}

function CambiarContrasena() {
  const t = useTranslations("cuenta.perfil.contrasena");
  const avisar = useToast();
  const [ocupado, setOcupado] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = new FormData(form);
    setOcupado(true);
    setFallo(null);
    try {
      await cambiarContrasena(String(datos.get("actual") ?? ""), String(datos.get("nueva") ?? ""));
      form.reset();
      avisar(t("cambiada"), "exito");
    } catch (err) {
      setFallo(err instanceof ErrorApi && ERRORES_CONTRASENA.includes(err.codigo) ? err.codigo : "error");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold">{t("titulo")}</h2>
      <form onSubmit={enviar} className="mt-4 grid gap-4">
        <Input name="actual" type="password" etiqueta={t("actual")} required autoComplete="current-password" />
        <Input name="nueva" type="password" etiqueta={t("nueva")} ayuda={t("ayuda")} required minLength={8} autoComplete="new-password" />
        {fallo && (
          <p role="alert" className="font-bold text-peligro">
            {t(`errores.${fallo}`)}
          </p>
        )}
        <Button type="submit" variante="secundario" cargando={ocupado} className="justify-self-start">
          {t("cambiar")}
        </Button>
      </form>
    </Card>
  );
}

function MisClases({ estudianteId }: { estudianteId: string }) {
  const t = useTranslations("cuenta.perfil.clases");
  const avisar = useToast();
  const [clases, setClases] = useState<Clase[] | null>(null);
  const [saliendo, setSaliendo] = useState<Clase | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [unirse, setUnirse] = useState(false);

  const cargar = () =>
    listarClases()
      .then(setClases)
      .catch(() => setClases([]));
  useEffect(() => {
    void cargar();
  }, []);

  async function confirmarSalir() {
    if (!saliendo) return;
    setOcupado(true);
    try {
      await salirDeClase(saliendo.id, estudianteId);
      setClases((cs) => cs?.filter((c) => c.id !== saliendo.id) ?? null);
      avisar(t("salio"), "exito");
      setSaliendo(null);
    } catch {
      avisar(t("salio"), "error");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("titulo")}</h2>
        <Button variante="secundario" tamano="sm" onClick={() => setUnirse((u) => !u)} aria-expanded={unirse}>
          {t("unirme")}
        </Button>
      </div>
      {unirse && (
        <div className="mt-4">
          <FormularioUnirse
            compacto
            alUnirse={() => {
              void cargar();
            }}
          />
        </div>
      )}
      {!clases ? (
        <Skeleton className="mt-4 h-20" />
      ) : clases.length === 0 ? (
        <p className="mt-4 text-tinta-suave">{t("vacio")}</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {clases.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-borde p-3">
              <div className="min-w-0">
                <p className="font-bold">{c.nombre}</p>
                <p className="text-sm text-tinta-suave">{t("de", { materia: c.materia, grado: c.grado })}</p>
              </div>
              <Button variante="fantasma" tamano="sm" onClick={() => setSaliendo(c)}>
                {t("salir")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog abierto={!!saliendo} alCerrar={() => setSaliendo(null)} titulo={t("salir")}>
        <p>{saliendo && t("confirmarSalir", { nombre: saliendo.nombre })}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setSaliendo(null)}>
            ✕
          </Button>
          <Button variante="peligro" cargando={ocupado} onClick={() => void confirmarSalir()}>
            {t("salir")}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
