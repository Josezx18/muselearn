"""Genera supabase/seed-demo.sql: datos 100 % ficticios para la demo de MuseLearn.

Uso:  python3 supabase/demo/generar-seed-demo.py   (escribe supabase/seed-demo.sql)
Requisito: haber ejecutado antes `npm run seed:auth` (crea docente, 5 estudiantes y la clase MAT4KQ).
El SQL es idempotente: borra y vuelve a crear solo las tareas de demo (ids fijos), con fechas relativas a hoy.
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]

ESTUDIANTES = ["camila", "luis", "sofia", "diego", "valeria"]
COMPETENCIA = "Resuelve problemas con ecuaciones lineales"
COMPETENCIA_PROP = "Aplica razones y proporciones en situaciones cotidianas"


def uid(n: int) -> str:
    return f"de000000-0000-4000-8000-{n:012d}"


TAREAS = [
    {
        "id": uid(101),
        "titulo": "Ecuaciones de primer grado: ejercicios 1-8",
        "instrucciones": "Resuelve los ejercicios 1 al 8 de la página 54. Escribe cada paso del despeje y comprueba tu resultado sustituyendo x en la ecuación original.",
        "fecha": "now() - interval '3 days'",
        "creada": "now() - interval '10 days'",
        "competencias": [COMPETENCIA],
        "nivel_ayuda": "pistas",
        "conceptos": ["Operaciones inversas", "Despejar x", "Comprobar la solución"],
    },
    {
        "id": uid(102),
        "titulo": "Proporciones y regla de tres",
        "instrucciones": "Resuelve los 6 problemas de la guía: recetas, mapas a escala y precios. Explica por qué la relación es directa antes de aplicar la regla de tres.",
        "fecha": "now() - interval '1 day'",
        "creada": "now() - interval '6 days'",
        "competencias": [COMPETENCIA_PROP],
        "nivel_ayuda": "ejemplos",
        "conceptos": ["Razón y proporción", "Regla de tres directa", "Interpretar el resultado"],
    },
    {
        "id": uid(103),
        "titulo": "Sistemas de ecuaciones 2x2",
        "instrucciones": "Resuelve los sistemas 1 al 5 por sustitución y el 6 por igualación. Comprueba cada par (x, y) en las dos ecuaciones.",
        "fecha": "now() + interval '3 days'",
        "creada": "now() - interval '1 day'",
        "competencias": [COMPETENCIA],
        "nivel_ayuda": "pistas",
        "conceptos": ["Sustitución", "Igualación", "Comprobar en ambas ecuaciones"],
    },
    {
        "id": uid(104),
        "titulo": "Funciones lineales: tabla y gráfica",
        "instrucciones": "Para y = 2x + 1 y y = -x + 4: completa la tabla de valores (x de -2 a 3), grafica ambas rectas en el mismo plano y marca dónde se cortan.",
        "fecha": "now() + interval '6 days'",
        "creada": "now()",
        "competencias": ["Representa relaciones lineales con tablas y gráficas"],
        "nivel_ayuda": "explicacion",
        "conceptos": ["Tabla de valores", "Pendiente", "Punto de corte"],
    },
]

# Análisis por estudiante: (dificultad, minutos, prioridad) por tarea. Sofía y Valeria tardan más.
ANALISIS = {
    uid(101): {"base": (3, 40, 70), "pasos": ["Resuelve del 1 al 4", "Descansa 5 minutos", "Resuelve del 5 al 8 y comprueba cada uno"]},
    uid(102): {"base": (3, 45, 80), "pasos": ["Lee los 6 problemas y marca qué se compara", "Resuelve recetas y precios", "Resuelve los de mapas a escala"]},
    uid(103): {"base": (4, 55, 85), "pasos": ["Repasa cómo despejar una variable", "Resuelve del 1 al 3 por sustitución", "Resuelve 4 y 5", "Haz el 6 por igualación y comprueba"]},
    uid(104): {"base": (3, 45, 40), "pasos": ["Completa las dos tablas", "Grafica la primera recta", "Grafica la segunda y busca el corte"]},
}
AJUSTE = {"camila": (0, -10, -5), "luis": (0, 0, 0), "sofia": (1, 15, 10), "diego": (0, 5, 0), "valeria": (1, 10, 5)}
RAZON = {
    uid(101): "Ya pasó la fecha de entrega; si te falta algo, entrégalo hoy.",
    uid(102): "Ya pasó la fecha de entrega; si te falta algo, entrégalo hoy.",
    uid(103): "Vence en 3 días y usa el despeje que practicaste: conviene empezar mañana con los primeros sistemas.",
    uid(104): "Vence en 6 días y es más corta: puedes hacerla el fin de semana sin apuro.",
}

ENTREGAS = {
    uid(101): {
        "camila": "1) 3x + 5 = 20 → resto 5 en los dos lados → 3x = 15 → divido entre 3 → x = 5. Compruebo: 3·5 + 5 = 20 ✓\n2) 2x − 7 = 9 → sumo 7 → 2x = 16 → x = 8 ...",
        "luis": "1) 3x + 5 = 20 → 3x = 15 → x = 5\n2) 2x − 7 = 9 → 2x = 16 → x = 8\n3) 5x + 2 = 3x + 10 → 2x = 8 → x = 4 ...",
        "sofia": "1) 3x + 5 = 20 ⟹ 3x = 15 ⟹ x = 5 (verificado: 15 + 5 = 20)\n2) 2x − 7 = 9 ⟹ 2x = 16 ⟹ x = 8 (verificado)\n3) 5x + 2 = 3x + 10 ⟹ 2x = 8 ⟹ x = 4 (verificado) ...",
        "diego": "1) x = 5\n2) x = 8\n3) 5x − 3x = 10 − 2 → 2x = 8 → x = 4 ...",
        "valeria": "1) 3x + 5 = 20 → 3x = 25 → x = 8,3 (me equivoqué, lo corregí: x = 5)\n2) 2x = 16 → x = 8 ...",
    },
    uid(102): {
        "camila": "Receta: si 4 personas usan 300 g, para 10 personas: 300·10/4 = 750 g. Es directa porque más personas → más harina en la misma razón ...",
        "luis": "Receta: 300 x 10 / 4 = 750 g. Mapa: 2 cm son 5 km, 7 cm → 17,5 km ...",
        "sofia": "Receta: 750 g. Mapa: 17,5 km. Precio: RD$ 1,260. (Todas resueltas con regla de tres directa.)",
        "diego": "1) 750 g\n2) 17,5 km\n3) Si 3 cuadernos cuestan RD$ 210, 7 cuestan RD$ 490 ...",
    },
}

# Informes: niveles por concepto (orden de TAREAS[i]["conceptos"]), evidencia citada de sus respuestas orales.
INFORMES = {
    uid(101): {
        "camila": ([4, 3, 2], [
            "para quitar el 5 hago lo contrario, resto 5 en los dos lados",
            "divido entre 3 porque el 3 está multiplicando a la x",
            "comprobar no lo hice en todos, solo en el primero",
        ], ["Entiende por qué se usa la operación inversa", "Despeja con orden y explica cada paso"], ["Comprobar el resultado en todos los ejercicios"]),
        "luis": ([3, 3, 3], [
            "resto el 5 para que la x quede sola",
            "paso el 3 dividiendo al otro lado",
            "cambio la x por 5 y me da 20, entonces está bien",
        ], ["Resuelve y comprueba correctamente"], ["Explica el despeje como regla ('pasa dividiendo') más que por qué funciona"]),
        "sofia": ([1, 1, 1], [
            "no sé, así lo hice",
            "creo que se divide pero no me acuerdo por qué",
            "puse verificado porque así venía",
        ], ["Entregó a tiempo y con buena presentación"], ["No puede explicar los pasos que escribió", "No sabe qué significa comprobar"]),
        "diego": ([3, 2, 3], [
            "resto 5 a los dos lados para que se mantenga igual",
            "el 2x − 3x no sé si es 2x o x",
            "sustituyo y veo si da lo mismo",
        ], ["Comprende la idea de equilibrio de la ecuación"], ["Se confunde al agrupar términos con x en ambos lados"]),
        "valeria": ([2, 2, 1], [
            "le sumé 5 en vez de restarlo y luego lo arreglé",
            "divido entre 3 pero no estoy segura cuándo",
            "no comprobé ninguno",
        ], ["Detecta y corrige algunos errores propios"], ["Elige la operación inversa equivocada", "No comprueba resultados"]),
    },
    uid(102): {
        "camila": ([4, 4, 3], [
            "es directa porque si hay más personas se usa más harina en la misma razón",
            "multiplico en cruz: 300 por 10 y divido entre 4",
            "750 gramos tiene sentido porque es más del doble de 300",
        ], ["Justifica por qué la relación es directa", "Revisa si el resultado es razonable"], []),
        "luis": ([3, 2, 2], [
            "más personas, más harina",
            "multiplico los de abajo y divido, no sé bien cuál va arriba",
            "17,5 kilómetros, no sé si es mucho",
        ], ["Reconoce relaciones directas"], ["Duda al ubicar los datos en la regla de tres", "No valora si el resultado es razonable"]),
        "sofia": ([2, 1, 2], [
            "es directa porque es regla de tres",
            "no sé de dónde salió el 1,260",
            "el precio sube si compro más",
        ], [], ["No sabe cómo obtuvo los resultados escritos", "Confunde el método con la razón por la que funciona"]),
    },
}

RESUMEN_EST = {
    1: "Entregaste a tiempo, pero cuando te preguntamos cómo lo hiciste no pudiste explicarlo todavía. No pasa nada: la ruta de abajo te ayuda a entender cada paso con tus propias palabras.",
    2: "Vas en camino: entiendes partes de la tarea, pero algunos pasos todavía los haces sin estar seguro de por qué. Con la práctica de abajo los vas a dominar.",
    3: "¡Buen trabajo! Explicaste bien la mayoría de los pasos. Te falta un detalle que puedes reforzar con unos minutos de práctica.",
    4: "¡Excelente! Explicaste con claridad por qué funciona cada paso y revisaste tus resultados. Sigue con un reto para ir más allá.",
}
RESUMEN_DOC = {
    1: "Entregó la tarea completa, pero no pudo explicar ninguno de los pasos escritos. Posible copia o ayuda externa; conviene una conversación breve y repaso guiado.",
    2: "Comprensión parcial: resuelve con errores de procedimiento y no justifica las decisiones. Requiere práctica guiada en los conceptos marcados.",
    3: "Comprende y explica la mayoría de los pasos; un concepto aún débil.",
    4: "Dominio sólido: justifica el procedimiento y valida sus resultados.",
}


def nivel_global(niveles: list[int]) -> int:
    return max(1, min(4, round(sum(niveles) / len(niveles))))


def ruta_para(conceptos: list[str], niveles: list[int], tarea: dict) -> dict:
    debiles = [c for c, n in zip(conceptos, niveles) if n < 3]
    if not debiles:
        return {"entrega_id": "__ENTREGA__", "pasos": [{
            "titulo": "Reto: crea tu propio problema", "tipo": "ejercicio", "concepto": conceptos[-1], "minutos": 15,
            "descripcion": f"Inventa un problema parecido a «{tarea['titulo']}», resuélvelo y explica cómo sabes que tu resultado es correcto.",
        }]}
    pasos = []
    for c in debiles[:3]:
        pasos.append({"titulo": f"Idea clave: {c}", "tipo": "repaso", "concepto": c, "minutos": 5,
                      "descripcion": f"Escribe en 3 líneas, con tus palabras, qué significa «{c}» y para qué sirve en esta tarea."})
        pasos.append({"titulo": f"Practica: {c}", "tipo": "ejercicio", "concepto": c, "minutos": 10,
                      "descripcion": "Resuelve 3 ejercicios nuevos de la guía y explica en voz alta un paso de cada uno."})
    return {"entrega_id": "__ENTREGA__", "pasos": pasos[:6]}


def entrega_id(tarea: str, estudiante: str) -> str:
    return uid(200 + 10 * TAREAS.index(next(t for t in TAREAS if t["id"] == tarea)) + ESTUDIANTES.index(estudiante))


def sql_texto(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def generar() -> str:
    l: list[str] = []
    l.append("-- MuseLearn — datos de DEMO (100 % ficticios). Generado por supabase/demo/generar-seed-demo.py; no editar a mano.")
    l.append("-- Requiere `npm run seed:auth` antes. Idempotente: se puede ejecutar varias veces (SQL Editor de Supabase).")
    l.append("do $$\ndeclare\n  v_clase uuid;\n  v_est uuid;\nbegin")
    l.append("  select c.id into v_clase from clases c where c.codigo_inscripcion = 'MAT4KQ';")
    l.append("  if v_clase is null then raise exception 'Falta la clase MAT4KQ: ejecuta npm run seed:auth primero'; end if;")
    ids = ", ".join(sql_texto(t["id"]) for t in TAREAS)
    l.append(f"  delete from tareas where id in ({ids});  -- borra en cascada entregas, análisis, sesiones e informes de demo")
    l.append("  delete from planes where estudiante_id in (select p.id from perfiles p join auth.users u on u.id = p.id where u.email like '%@demo.muselearn');")
    for t in TAREAS:
        comp = "array[" + ", ".join(sql_texto(c) for c in t["competencias"]) + "]::text[]"
        l.append(
            f"  insert into tareas (id, clase_id, titulo, instrucciones, fecha_entrega, competencias, nivel_ayuda, creada_en) values "
            f"({sql_texto(t['id'])}, v_clase, {sql_texto(t['titulo'])}, {sql_texto(t['instrucciones'])}, "
            f"date_trunc('day', {t['fecha']}) + interval '23 hours 59 minutes', {comp}, {sql_texto(t['nivel_ayuda'])}, {t['creada']});"
        )
    for est in ESTUDIANTES:
        l.append(f"  select id into v_est from auth.users where email = '{est}@demo.muselearn';")
        l.append(f"  if v_est is not null then")
        for t in TAREAS:
            d, m, p = (a + b for a, b in zip(ANALISIS[t["id"]]["base"], AJUSTE[est]))
            analisis = {"tarea_id": t["id"], "estudiante_id": "__EST__", "dificultad": max(1, min(5, d)), "minutos_estimados": m,
                        "prioridad": max(0, min(100, p)), "conceptos": t["conceptos"], "pasos_sugeridos": ANALISIS[t["id"]]["pasos"],
                        "razon": RAZON[t["id"]]}
            l.append(f"    insert into analisis_tareas (tarea_id, estudiante_id, datos) values ({sql_texto(t['id'])}, v_est, "
                     f"replace({sql_texto(json.dumps(analisis, ensure_ascii=False))}, '__EST__', v_est::text)::jsonb);")
            texto = ENTREGAS.get(t["id"], {}).get(est)
            if texto is None:
                continue
            eid = entrega_id(t["id"], est)
            informe = INFORMES.get(t["id"], {}).get(est)
            estado = "verificada" if informe else "entregada"
            l.append(f"    insert into entregas (id, tarea_id, estudiante_id, contenido_texto, estado, entregada_en) values "
                     f"({sql_texto(eid)}, {sql_texto(t['id'])}, v_est, {sql_texto(texto)}, '{estado}', date_trunc('day', {t['fecha']}) + interval '20 hours');")
            if informe:
                niveles, evidencias, fortalezas, debilidades = informe
                g = nivel_global(niveles)
                inf = {"entrega_id": eid, "nivel_global": g,
                       "por_concepto": [{"concepto": c, "competencia": t["competencias"][0], "nivel": n, "evidencia": e}
                                        for c, n, e in zip(t["conceptos"], niveles, evidencias)],
                       "fortalezas": fortalezas, "debilidades": debilidades,
                       "resumen_estudiante": RESUMEN_EST[g], "resumen_docente": RESUMEN_DOC[g], "generado_en": "__FECHA__"}
                ruta = ruta_para(t["conceptos"], niveles, t)
                ruta["entrega_id"] = eid
                l.append(f"    insert into informes (entrega_id, informe, ruta, creado_en) values ({sql_texto(eid)}, "
                         f"replace({sql_texto(json.dumps(inf, ensure_ascii=False))}, '__FECHA__', to_char((date_trunc('day', {t['fecha']}) + interval '21 hours') at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'))::jsonb, "
                         f"{sql_texto(json.dumps(ruta, ensure_ascii=False))}::jsonb, date_trunc('day', {t['fecha']}) + interval '21 hours');")
        l.append("  end if;")
    l.append("end $$;")
    return "\n".join(l) + "\n"


def objetos_para_validar() -> dict:
    """Los mismos JSON que van al SQL, para validarlos con los esquemas Zod (supabase/demo/validar.test.ts)."""
    est_falso = "11111111-1111-4111-8111-111111111111"
    analisis, informes, rutas = [], [], []
    for t in TAREAS:
        for est in ESTUDIANTES:
            d, m, p = (a + b for a, b in zip(ANALISIS[t["id"]]["base"], AJUSTE[est]))
            analisis.append({"tarea_id": t["id"], "estudiante_id": est_falso, "dificultad": max(1, min(5, d)), "minutos_estimados": m,
                             "prioridad": max(0, min(100, p)), "conceptos": t["conceptos"], "pasos_sugeridos": ANALISIS[t["id"]]["pasos"],
                             "razon": RAZON[t["id"]]})
            inf = INFORMES.get(t["id"], {}).get(est)
            if inf:
                eid = entrega_id(t["id"], est)
                niveles, evidencias, fortalezas, debilidades = inf
                g = nivel_global(niveles)
                informes.append({"entrega_id": eid, "nivel_global": g,
                                 "por_concepto": [{"concepto": c, "competencia": t["competencias"][0], "nivel": n, "evidencia": e}
                                                  for c, n, e in zip(t["conceptos"], niveles, evidencias)],
                                 "fortalezas": fortalezas, "debilidades": debilidades,
                                 "resumen_estudiante": RESUMEN_EST[g], "resumen_docente": RESUMEN_DOC[g], "generado_en": "2026-10-25T21:00:00Z"})
                r = ruta_para(t["conceptos"], niveles, t)
                r["entrega_id"] = eid
                rutas.append(r)
    return {"analisis": analisis, "informes": informes, "rutas": rutas}


if __name__ == "__main__":
    (RAIZ / "supabase" / "seed-demo.sql").write_text(generar(), encoding="utf-8")
    (RAIZ / "supabase" / "demo" / "objetos.json").write_text(json.dumps(objetos_para_validar(), ensure_ascii=False, indent=1), encoding="utf-8")
    print("Escrito supabase/seed-demo.sql y supabase/demo/objetos.json")
