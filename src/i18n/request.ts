import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { espacios } from "./espacios";

// Une messages/<idioma>/<espacio>.json en un solo objeto { comun: {...}, tareas: {...}, ... }
export default getRequestConfig(async ({ requestLocale }) => {
  const pedido = await requestLocale;
  const locale = hasLocale(routing.locales, pedido) ? pedido : routing.defaultLocale;

  const partes = await Promise.all(
    espacios.map(async (espacio) => {
      const modulo = await import(`../../messages/${locale}/${espacio}.json`);
      return [espacio, modulo.default] as const;
    }),
  );

  return { locale, messages: Object.fromEntries(partes) };
});
