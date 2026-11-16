import path from "node:path";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

function resolveSite(): string | undefined {
  const origin =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  return origin ? `https://${origin}` : undefined;
}

const site = resolveSite();
const integrations: AstroIntegration[] = [react()];

if (site) integrations.push(sitemap());

export default defineConfig({
  site,
  output: "static",
  compressHTML: true,
  trailingSlash: "ignore",
  integrations,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  },
});
