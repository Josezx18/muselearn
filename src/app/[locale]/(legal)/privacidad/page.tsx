import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DocumentoLegal } from "@/components/legal/DocumentoLegal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("privacidad.titulo") };
}

export default function PaginaPrivacidad() {
  return <DocumentoLegal tipo="privacidad" />;
}
