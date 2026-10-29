-- Apariencia guardada en el usuario (no solo en el navegador): paleta de colores y mascota.
-- El usuario puede cambiar estas dos columnas, además de nombre e idioma. El rol sigue sin poder editarse.
alter table perfiles
  add column if not exists tema text not null default 'muse' check (tema in ('cuaderno', 'meta', 'muse')),
  add column if not exists mascota text not null default 'pagi' check (mascota in ('pagi', 'chispa', 'orbi'));

revoke update on perfiles from authenticated, anon;
grant update (nombre, idioma, tema, mascota) on perfiles to authenticated;
