// Identidades y contenido exclusivamente ficticios, independientes del seed de demo.
const id = (n) => `18000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const q = (n) => `'${id(n)}'`;
const docentes = [1, 2];
const estudiantes = [3, 4, 5];
const clase = (n) => n === 5 ? 12 : 11;
const tarea = (n) => n === 5 ? 22 : 21;
export const datos = `
insert into auth.users (id,email) values ${[...docentes, ...estudiantes].map(n => `(${q(n)}, 'rls${n}@example.invalid')`).join(',')};
insert into perfiles (id,rol,nombre,terminos_version) values ${[...docentes, ...estudiantes].map(n => `(${q(n)}, '${n < 3 ? 'docente' : 'estudiante'}', 'Persona ficticia ${n}', 'v1')`).join(',')};
insert into clases (id,docente_id,nombre,materia,grado,codigo_inscripcion) values
(${q(11)},${q(1)},'Clase A','Prueba','4','RLS001'),(${q(12)},${q(2)},'Clase B','Prueba','4','RLS002');
insert into inscripciones (clase_id,estudiante_id) values ${estudiantes.map(n => `(${q(clase(n))},${q(n)})`).join(',')};
insert into tareas (id,clase_id,titulo,instrucciones,fecha_entrega) values
(${q(21)},${q(11)},'Tarea A','Ficticia',now()),(${q(22)},${q(12)},'Tarea B','Ficticia',now());
insert into clases_vinculadas (clase_id,docente_id,proveedor,externo_id) values
(${q(11)},${q(1)},'classroom','curso-a'),(${q(12)},${q(2)},'classroom','curso-b');
insert into tareas_vinculadas (tarea_id,clase_id,proveedor,externo_id) values
(${q(21)},${q(11)},'classroom','tarea-a'),(${q(22)},${q(12)},'classroom','tarea-b');
insert into storage.objects (bucket_id,owner,name) values ('adjuntos',${q(3)},'ficticio-a'),('adjuntos',${q(5)},'ficticio-b');
${estudiantes.map(n => `
insert into entregas (id,tarea_id,estudiante_id,contenido_texto) values (${q(n+30)},${q(tarea(n))},${q(n)},'Trabajo ficticio');
insert into informes (entrega_id,informe) values (${q(n+30)},'{}');
insert into sesiones_verificacion (entrega_id) values (${q(n+30)});
insert into comentarios_entrega (entrega_id,docente_id,texto) values (${q(n+30)},${q(n === 5 ? 2 : 1)},'Comentario ficticio');
insert into calificaciones (entrega_id,docente_id,nota) values (${q(n+30)},${q(n === 5 ? 2 : 1)},75);
insert into avisos (usuario_id,tipo,titulo,enlace) values (${q(n)},'nota','Aviso ficticio','/');
insert into analisis_tareas (tarea_id,estudiante_id,datos) values (${q(tarea(n))},${q(n)},'{}');
insert into planes (estudiante_id,semana_inicio,datos) values (${q(n)},'2026-10-26','{}');
insert into preferencias_estudio (estudiante_id,datos) values (${q(n)},'{}');
insert into conversaciones_tutor (tarea_id,estudiante_id) values (${q(tarea(n))},${q(n)});
`).join('\n')}
insert into uso_ia_docente (docente_id,funcion) values (${q(1)},'proponer_tarea'),(${q(2)},'proponer_tarea');
`;
export const casos = [];
const agregar = (usuario, nombre, sql, esperado = 0) => casos.push({usuario: id(usuario), nombre, sql, esperado});
const rechazar = (usuario, nombre, sql) => casos.push({usuario: id(usuario), nombre, sql, denegado: true});
const contar = (tabla, filtro = 'true') => `select count(*) from ${tabla} where ${filtro};`;
const cambiar = (tabla, campo, filtro) => `with filas as (update ${tabla} set ${campo} where ${filtro} returning 1) select count(*) from filas;`;
const borrar = (tabla, filtro) => `with filas as (delete from ${tabla} where ${filtro} returning 1) select count(*) from filas;`;
for (const n of estudiantes) {
  const prefijo = `Estudiante ${n}`;
  for (const tabla of ['clases', 'tareas']) {
    const propio = tabla === 'clases' ? clase(n) : tarea(n);
    agregar(n, `${prefijo}: ${tabla} propias`, contar(tabla, `id=${q(propio)}`), 1);
    agregar(n, `${prefijo}: ${tabla} ajenas invisibles`, contar(tabla, `id<>${q(propio)}`));
  }
  for (const tabla of ['entregas', 'informes', 'comentarios_entrega', 'calificaciones', 'sesiones_verificacion']) {
    const clave = tabla === 'entregas' ? 'id' : 'entrega_id';
    agregar(n, `${prefijo}: ${tabla} propias`, contar(tabla, `${clave}=${q(n+30)}`), 1);
    agregar(n, `${prefijo}: ${tabla} ajenas invisibles`, contar(tabla, `${clave}<>${q(n+30)}`));
  }
  for (const tabla of ['avisos', 'analisis_tareas', 'planes', 'preferencias_estudio', 'conversaciones_tutor']) {
    const clave = tabla === 'avisos' ? 'usuario_id' : 'estudiante_id';
    agregar(n, `${prefijo}: ${tabla} propias`, contar(tabla, `${clave}=${q(n)}`), 1);
    agregar(n, `${prefijo}: ${tabla} ajenas invisibles`, contar(tabla, `${clave}<>${q(n)}`));
  }
  rechazar(n, `${prefijo}: rol protegido`, `update perfiles set rol='docente' where id=${q(n)};`);
  rechazar(n, `${prefijo}: términos protegidos`, `update perfiles set terminos_version='falso' where id=${q(n)};`);
  agregar(n, `${prefijo}: nombre editable`, cambiar('perfiles', "nombre='Nuevo nombre'", `id=${q(n)}`), 1);
  agregar(n, `${prefijo}: entrega propia editable`, cambiar('entregas', "contenido_texto='Revisión'", `id=${q(n+30)}`), 1);
  agregar(n, `${prefijo}: entrega ajena no editable`, cambiar('entregas', "contenido_texto='Ataque'", `id<>${q(n+30)}`));
  rechazar(n, `${prefijo}: no traslada entrega a tarea de clase ajena`, `update entregas set tarea_id=${q(n === 5 ? 21 : 22)} where id=${q(n+30)};`);
  for (const tabla of ['comentarios_entrega', 'calificaciones']) {
    const campo = tabla === 'calificaciones' ? 'nota=100' : "texto='Ataque'";
    agregar(n, `${prefijo}: no actualiza ${tabla}`, cambiar(tabla, campo, 'true'));
    agregar(n, `${prefijo}: no borra ${tabla}`, borrar(tabla, 'true'));
    // RLS debe rechazar antes de que ON CONFLICT pueda ocultar la escritura.
    const extra = tabla === 'calificaciones' ? "nota) values" : "texto) values";
    const valor = tabla === 'calificaciones' ? '100' : "'Ataque'";
    rechazar(n, `${prefijo}: no inserta ${tabla}`, `insert into ${tabla} (entrega_id,docente_id,${extra} (${q(n+30)},${q(n)},${valor}) on conflict (entrega_id) do nothing;`);
  }
  rechazar(n, `${prefijo}: no ejecuta devolver_entrega`, `select devolver_entrega(${q(n+30)},${q(1)},'Corrección');`);
  agregar(n, `${prefijo}: marca su aviso`, cambiar('avisos', 'leido=true', `usuario_id=${q(n)}`), 1);
  agregar(n, `${prefijo}: no marca aviso ajeno`, cambiar('avisos', 'leido=true', `usuario_id<>${q(n)}`));
  rechazar(n, `${prefijo}: título de aviso protegido`, "update avisos set titulo='Ataque';");
}
for (const n of docentes) {
  const prefijo = `Docente ${n}`;
  const propia = n === 1 ? 11 : 12;
  const entregaPropia = n === 1 ? 33 : 35;
  const entregaAjena = n === 1 ? 35 : 33;
  const cantidad = n === 1 ? 2 : 1;
  for (const tabla of ['clases','tareas']) {
    const filtro = tabla === 'clases' ? `id=${q(propia)}` : `clase_id=${q(propia)}`;
    agregar(n, `${prefijo}: lee ${tabla} propias`, contar(tabla, filtro), 1);
    agregar(n, `${prefijo}: no lee ${tabla} ajenas`, contar(tabla, `not (${filtro})`));
    const campo = tabla === 'clases' ? "nombre='Cambio'" : "titulo='Cambio'";
    agregar(n, `${prefijo}: edita ${tabla} propias`, cambiar(tabla, campo, filtro), 1);
    agregar(n, `${prefijo}: no edita ${tabla} ajenas`, cambiar(tabla, campo, `not (${filtro})`));
    agregar(n, `${prefijo}: no borra ${tabla} ajenas`, borrar(tabla, `not (${filtro})`));
  }
  for (const tabla of ['entregas','informes','sesiones_verificacion','comentarios_entrega','calificaciones','analisis_tareas']) {
    agregar(n, `${prefijo}: solo evidencia de su clase (${tabla})`, contar(tabla), cantidad);
  }
  agregar(n, `${prefijo}: solo perfiles propios y estudiantes`, contar('perfiles'), cantidad+1);
  for (const tabla of ['clases_vinculadas','tareas_vinculadas']) agregar(n, `${prefijo}: solo vínculos propios (${tabla})`, contar(tabla),1);
  for (const tabla of ['planes','preferencias_estudio','conversaciones_tutor','avisos']) agregar(n, `${prefijo}: no lee datos privados (${tabla})`, contar(tabla));
  rechazar(n, `${prefijo}: uso IA privado`, contar('uso_ia_docente'));
  for (const tabla of ['comentarios_entrega','calificaciones']) {
    const campo = tabla === 'calificaciones' ? 'nota=90' : "texto='Buen progreso'";
    agregar(n, `${prefijo}: edita ${tabla} propias`, cambiar(tabla,campo,`entrega_id=${q(entregaPropia)}`),1);
    agregar(n, `${prefijo}: no edita ${tabla} ajenas`, cambiar(tabla,campo,`entrega_id=${q(entregaAjena)}`));
    agregar(n, `${prefijo}: borra ${tabla} propias`, borrar(tabla,`entrega_id=${q(entregaPropia)}`),1);
    agregar(n, `${prefijo}: no borra ${tabla} ajenas`, borrar(tabla,`entrega_id=${q(entregaAjena)}`));
    const col = tabla === 'calificaciones' ? 'nota' : 'texto';
    const valor = tabla === 'calificaciones' ? '90' : "'Buen progreso'";
    agregar(n, `${prefijo}: inserta ${tabla} propias`, `delete from ${tabla} where entrega_id=${q(entregaPropia)}; with filas as (insert into ${tabla} (entrega_id,docente_id,${col}) values (${q(entregaPropia)},${q(n)},${valor}) returning 1) select count(*) from filas;`,1);
    rechazar(n, `${prefijo}: no inserta ${tabla} ajenas`, `insert into ${tabla} (entrega_id,docente_id,${col}) values (${q(entregaAjena)},${q(n)},${valor}) on conflict (entrega_id) do nothing;`);
  }
  rechazar(n, `${prefijo}: no crea tarea en clase ajena`, `insert into tareas (clase_id,titulo,instrucciones,fecha_entrega) values (${q(n === 1 ? 12 : 11)},'Ataque','Ataque',now());`);
  rechazar(n, `${prefijo}: no ejecuta RPC de servidor`, `select devolver_entrega(${q(entregaPropia)},${q(n)},'Corrección');`);
}
const tablas = ['perfiles','clases','inscripciones','tareas','entregas','analisis_tareas','planes','preferencias_estudio','conversaciones_tutor','sesiones_verificacion','informes','clases_vinculadas','tareas_vinculadas','comentarios_entrega','calificaciones','uso_ia_docente','avisos','storage.objects'];
for (const tabla of tablas) {
  // Anon puede recibir 42501 o cero filas, ambos impiden leer datos.
  casos.push({rol:'anon', nombre:`Anon: no lee ${tabla}`, sql:`do $$ begin if exists (select 1 from ${tabla}) then raise exception 'anon leyó datos'; end if; exception when insufficient_privilege then null; end $$; select 0;`, esperado:0});
}
