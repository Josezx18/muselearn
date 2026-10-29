import { FormularioLogin } from "@/components/auth/FormularioLogin";
import { googleActivo } from "@/lib/auth/externo";

export default async function PaginaLogin({ searchParams }: PageProps<"/[locale]/login">) {
  const { error } = await searchParams;
  return <FormularioLogin conGoogle={googleActivo()} errorGoogle={error === "google"} />;
}
