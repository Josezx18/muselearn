const id = n => `18000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const datosMaterial = `insert into materiales_estudio(tarea_id,contenido,publicado) values
('${id(21)}','{}',false),('${id(22)}','{}',true);`;
export const casosMaterial = [
  { usuario: id(1), nombre: 'Material: docente ve su borrador', sql: `select count(*) from materiales_estudio where tarea_id='${id(21)}';`, esperado: 1 },
  { usuario: id(1), nombre: 'Material: docente no ve clase ajena', sql: `select count(*) from materiales_estudio where tarea_id='${id(22)}';`, esperado: 0 },
  { usuario: id(3), nombre: 'Material: inscrito no ve borrador', sql: `select count(*) from materiales_estudio;`, esperado: 0 },
  { usuario: id(5), nombre: 'Material: inscrito ve publicado', sql: `select count(*) from materiales_estudio where tarea_id='${id(22)}';`, esperado: 1 },
  { usuario: id(3), nombre: 'Material: publicado ajeno invisible', sql: `select count(*) from materiales_estudio where tarea_id='${id(22)}';`, esperado: 0 },
  { usuario: id(5), nombre: 'Material: borrador ajeno invisible', sql: `select count(*) from materiales_estudio where tarea_id='${id(21)}';`, esperado: 0 },
  { rol: 'anon', nombre: 'Material: anon no lee', sql: 'select * from materiales_estudio;', denegado: true },
  ...[1, 3, 5].flatMap(n => [
    { usuario: id(n), nombre: `Material: ${n} no inserta`, sql: `insert into materiales_estudio(tarea_id,contenido) values ('${id(21)}','{}');`, denegado: true },
    { usuario: id(n), nombre: `Material: ${n} no actualiza`, sql: `update materiales_estudio set publicado=true;`, denegado: true },
    { usuario: id(n), nombre: `Material: ${n} no elimina`, sql: 'delete from materiales_estudio;', denegado: true },
  ]),
  { rol: 'service_role', nombre: 'Material: servidor publica', sql: `update materiales_estudio set publicado=true where tarea_id='${id(21)}'; select count(*) from materiales_estudio where publicado;`, esperado: 2 },
  { rol: 'service_role', nombre: 'Material: nuevo uso IA permitido', sql: `insert into uso_ia_docente(docente_id,funcion) values ('${id(1)}','material_estudio'); select count(*) from uso_ia_docente where funcion='material_estudio';`, esperado: 1 },
];
