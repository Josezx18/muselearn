import { NextResponse } from "next/server";

/** Respuesta de error con el formato de api.md: { error: { codigo, mensaje } }. */
export function errorHttp(estado: number, codigo: string, mensaje: string) {
  return NextResponse.json({ error: { codigo, mensaje } }, { status: estado });
}
