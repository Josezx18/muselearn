-- Velocidad de la verificación: la transcripción de las fotos del cuaderno se hace una sola vez al iniciar la
-- sesión y se guarda aquí, en lugar de volver a leer las imágenes con el modelo de visión en cada respuesta.
-- Solo la escribe el servidor (service_role); el estudiante solo puede leer sus sesiones (política existente).
alter table sesiones_verificacion add column if not exists cuaderno text;
