import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Decisión T00: `cacheComponents` y `partialPrefetching` quedan desactivados.
// La app es casi toda dinámica y por usuario (sesión, plan, tutor), y esos modos
// exigen <Suspense> o "use cache" alrededor de cada lectura de cookies.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" }, // fotos del cuaderno y adjuntos
  },
};

export default withNextIntl(nextConfig);
