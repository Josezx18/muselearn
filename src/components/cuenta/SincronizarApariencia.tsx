"use client";

import { useEffect } from "react";
import { aplicarMascota, aplicarTema, mascotaActual, temaActual, type Mascota, type Tema } from "@/lib/tema";

/**
 * La apariencia vive en la cuenta. Al entrar desde otro equipo, el navegador aún no la conoce:
 * este componente la copia del perfil a la página (y a la cookie, para que la próxima carga ya salga bien).
 */
export function SincronizarApariencia({ tema, mascota }: { tema: Tema; mascota: Mascota }) {
  useEffect(() => {
    if (temaActual() !== tema) aplicarTema(tema);
    if (mascotaActual() !== mascota) aplicarMascota(mascota);
  }, [tema, mascota]);
  return null;
}
