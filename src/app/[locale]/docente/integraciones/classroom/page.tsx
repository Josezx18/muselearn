import { ImportarClassroom } from "@/components/integraciones/ImportarClassroom";

export default async function Pagina({ searchParams }: PageProps<"/[locale]/docente/integraciones/classroom">) {
  const { error } = await searchParams;
  return <ImportarClassroom errorInicial={typeof error === "string" ? error : undefined} />;
}
