import { getTranslations } from "next-intl/server";
import { ComoFunciona } from "@/components/legal/ComoFunciona";

export async function generateMetadata() {
  const t = await getTranslations("legal.comoFunciona");
  return { title: t("titulo"), description: t("intro") };
}

export default function PaginaComoFunciona() {
  return <ComoFunciona />;
}
