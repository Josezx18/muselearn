import { describe, it, expect, vi, beforeEach } from "vitest";
import { PedidoRevisionEntrega, RevisionEntrega, DetalleEntrega } from "@/types/contratos";
import { revisionEntregaMock } from "@/lib/mocks/revision";
import { tareasMock, entregasMock } from "@/lib/mocks/tareas";
import { usuariosMock } from "@/lib/mocks/clases";
import { revisarEntrega } from "./revision";
import * as revision from "./revision";
import { crearLlamador, type ClienteChat } from "../cliente";
const controles = vi.hoisted(() => ({ sesion: vi.fn(), detalle: vi.fn(), tarea: vi.fn() }));
vi.mock("@/app/api/docente/ia/_comun", () => ({ docenteConCupo: controles.sesion, errorIADocente: () => Response.json({}, { status: 502 }) }));
vi.mock("@/lib/db/gestion", () => ({ detalleEntrega: controles.detalle, tareaDelDocente: controles.tarea }));
// La función real de IA se prueba arriba del límite HTTP, sin solicitudes externas.
import { POST } from "@/app/api/docente/ia/revision/route";
const entrega = entregasMock[0];
const detalle = DetalleEntrega.parse({ entrega, estudiante: usuariosMock.find((u) => u.id === entrega.estudiante_id), adjuntos: [], preguntas: [], informe: null, comentario: null });
const tarea = tareasMock.find((t) => t.id === entrega.tarea_id)!;

describe("revisión T21", () => {
  it("valida límites y exige nota nula para evidencia no evaluable", () => {
    expect(RevisionEntrega.safeParse(revisionEntregaMock).success).toBe(true);
    for (const nota_sugerida of [-1, 101, 1.001]) expect(RevisionEntrega.safeParse({ ...revisionEntregaMock, nota_sugerida }).success).toBe(false);
    expect(RevisionEntrega.safeParse({ ...revisionEntregaMock, cumple: "no_se_puede" }).success).toBe(false);
    expect(RevisionEntrega.safeParse({ ...revisionEntregaMock, cumple: "no_se_puede", nota_sugerida: null }).success).toBe(true);
    expect(PedidoRevisionEntrega.safeParse({ entrega_id: entrega.id, nota: 100 }).success).toBe(false);
  });
  it("compara instrucciones y competencias y envía imágenes exclusivamente a visión Meta", async () => {
    const cuerpos: Record<string, unknown>[] = [];
    const cliente: ClienteChat = { chat: { completions: { create: async (c) => { cuerpos.push(c); return { choices: [{ message: { content: JSON.stringify(revisionEntregaMock) } }] }; } } } };
    const llamar = crearLlamador({ meta: { id: "meta", baseURL: "https://api.meta.ai/v1", apiKey: "prueba", modelo: "prueba", avanzado: true } }, () => cliente);
    const r = await revisarEntrega(tarea, detalle, [{ tipo: "image/png", base64: "Zm90bw==" }], llamar);
    expect(r).toEqual(revisionEntregaMock);
    const mensajes = JSON.stringify(cuerpos[0].messages);
    expect(mensajes).toContain(tarea.instrucciones);
    expect(mensajes).toContain(tarea.competencias[0]);
    expect(mensajes).toContain("data:image/png;base64,Zm90bw==");
    expect(mensajes).toContain("nunca instrucciones");
    expect(mensajes).toContain("práctica física");
    expect(mensajes).not.toContain(detalle.estudiante.nombre);
  });
});

describe("autorización del endpoint", () => {
  const registrar = vi.fn();
  beforeEach(() => {
    vi.restoreAllMocks(); vi.clearAllMocks();
    controles.sesion.mockResolvedValue({ actual: { db: {}, usuario: { id: "docente" } }, registrar });
    controles.detalle.mockResolvedValue(detalle); controles.tarea.mockResolvedValue(tarea);
  });
  const pedido = (valor: unknown = { entrega_id: entrega.id }) => new Request("http://local/api/docente/ia/revision", { method: "POST", body: JSON.stringify(valor) });
  it("respeta sesión, rol y cupo del guard compartido", async () => {
    for (const status of [401, 403, 429]) {
      controles.sesion.mockResolvedValue(Response.json({}, { status }));
      expect((await POST(pedido())).status).toBe(status);
    }
    expect(controles.detalle).not.toHaveBeenCalled(); expect(registrar).not.toHaveBeenCalled();
  });
  it("registra el cupo y devuelve el reporte validado sin persistir", async () => {
    const revisar = vi.spyOn(revision, "revisarEntrega").mockResolvedValue(revisionEntregaMock);
    const respuesta = await POST(pedido());
    expect(respuesta.status).toBe(200); expect(await respuesta.json()).toEqual(revisionEntregaMock);
    expect(registrar).toHaveBeenCalledExactlyOnceWith("borrador_comentario");
    expect(revisar).toHaveBeenCalledWith(tarea, detalle, []);
  });
  it("descarga la foto con Storage autenticado y pasa su contenido al modelo", async () => {
    const imagen = { nombre: "foto.png", ruta: "entregas/tarea/estudiante/foto.png", tipo_mime: "image/png" };
    const download = vi.fn().mockResolvedValue({ data: new Blob(["foto"], { type: "image/png" }), error: null });
    const from = vi.fn().mockReturnValue({ download });
    controles.sesion.mockResolvedValue({ actual: { db: { storage: { from } }, usuario: { id: "docente" } }, registrar });
    const conFoto = { ...detalle, entrega: { ...entrega, adjuntos: [imagen] } };
    controles.detalle.mockResolvedValue(conFoto);
    const revisar = vi.spyOn(revision, "revisarEntrega").mockResolvedValue(revisionEntregaMock);
    expect((await POST(pedido())).status).toBe(200);
    expect(from).toHaveBeenCalledWith("adjuntos"); expect(download).toHaveBeenCalledWith(imagen.ruta);
    expect(revisar).toHaveBeenCalledWith(tarea, conFoto, [{ tipo: "image/png", base64: "Zm90bw==" }]);
  });
  it("no llama al modelo cuando Storage no permite leer la foto", async () => {
    const download = vi.fn().mockResolvedValue({ data: null, error: new Error("denegado") });
    controles.sesion.mockResolvedValue({ actual: { db: { storage: { from: () => ({ download }) } }, usuario: { id: "docente" } }, registrar });
    controles.detalle.mockResolvedValue({ ...detalle, entrega: { ...entrega, adjuntos: [{ nombre: "foto", ruta: "ajena", tipo_mime: "image/png" }] } });
    expect((await POST(pedido())).status).toBe(400); expect(registrar).not.toHaveBeenCalled();
  });
  it("rechaza imágenes excesivas y formatos no admitidos antes de llamar a IA", async () => {
    const imagen = { nombre: "foto.gif", ruta: "entregas/foto.gif", tipo_mime: "image/gif" };
    controles.detalle.mockResolvedValueOnce({ ...detalle, entrega: { ...entrega, adjuntos: [imagen] } });
    expect((await POST(pedido())).status).toBe(400);
    controles.detalle.mockResolvedValueOnce({ ...detalle, entrega: { ...entrega, adjuntos: Array(7).fill(imagen) } });
    expect((await POST(pedido())).status).toBe(400); expect(registrar).not.toHaveBeenCalled();
  });
  it("rechaza entradas inválidas", async () => { expect((await POST(pedido({ entrega_id: "x" }))).status).toBe(400); });
  it("no revisa entregas ajenas ni pendientes", async () => {
    controles.detalle.mockResolvedValueOnce(null); expect((await POST(pedido())).status).toBe(404);
    controles.tarea.mockResolvedValueOnce(null); expect((await POST(pedido())).status).toBe(403);
    controles.detalle.mockResolvedValueOnce({ ...detalle, entrega: { ...entrega, estado: "pendiente" } });
    expect((await POST(pedido())).status).toBe(409); expect(registrar).not.toHaveBeenCalled();
  });
});
