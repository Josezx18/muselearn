import { FormularioRecuperar } from "@/components/auth/FormularioRecuperar";

export default async function PaginaRecuperar({ searchParams }: PageProps<"/[locale]/recuperar">) {
  const { error } = await searchParams;
  return <FormularioRecuperar enlaceVencido={error === "enlace"} />;
}
