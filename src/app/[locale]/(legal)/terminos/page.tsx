import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DocumentoLegal } from "@/components/legal/DocumentoLegal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("terminos.titulo") };
}

export default function PaginaTerminos() {
  return <DocumentoLegal tipo="terminos" />;
}
