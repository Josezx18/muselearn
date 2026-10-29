import { FormularioRegistro } from "@/components/auth/FormularioRegistro";
import { googleActivo } from "@/lib/auth/externo";

export default function PaginaRegistro() {
  return <FormularioRegistro conGoogle={googleActivo()} />;
}
