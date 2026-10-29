import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ProveedorToast } from "@/components/ui";
import { COLOR_BARRA, SCRIPT_TEMA, TEMA_POR_DEFECTO } from "@/lib/tema";
import "../globals.css";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "comun.app" });
  return { title: { default: t("nombre"), template: `%s · ${t("nombre")}` }, description: t("descripcion") };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: COLOR_BARRA[TEMA_POR_DEFECTO],
};

export default async function LayoutRaiz({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    // suppressHydrationWarning: el script de <head> pone data-tema antes de que React hidrate.
    <html lang={locale} data-tema={TEMA_POR_DEFECTO} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <ProveedorToast>{children}</ProveedorToast>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
