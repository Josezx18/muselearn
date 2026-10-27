import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Usa estos en lugar de los de next/link y next/navigation: conservan el idioma en la URL.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
