import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui";

/** Marcador de pantalla pendiente. La ficha dueña la reemplaza por la pantalla real. */
export async function EnConstruccion({ ficha, titulo }: { ficha: string; titulo: string }) {
  const t = await getTranslations("comun.enConstruccion");
  return (
    <section className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">{titulo}</h1>
      <Card className="border-dashed text-center">
        <p className="font-semibold">{t("titulo")}</p>
        <p className="mt-1 text-sm text-tinta-suave">{t("detalle", { ficha })}</p>
      </Card>
    </section>
  );
}
