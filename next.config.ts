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
  // Cabeceras de seguridad en todas las respuestas. La CSP es parcial a propósito: impide que otra página meta
  // la app en un iframe y bloquea plugins y <base> ajenos, sin restringir scripts (Next los inyecta en línea).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
    ];
  },
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "12mb" }, // fotos del cuaderno y adjuntos
  },
};

export default withNextIntl(nextConfig);
