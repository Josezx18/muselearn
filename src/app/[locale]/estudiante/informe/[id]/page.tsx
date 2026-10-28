import { Informe } from "@/components/informes/Informe";
export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/informe/[id]">) {
  const { id } = await params;
  return <Informe id={id} />;
}
