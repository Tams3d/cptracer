import type { APIRoute } from "astro";

import { buildAboutMarkdown } from "@/lib/site-content";

export const GET: APIRoute = ({ site }) =>
  new Response(buildAboutMarkdown(site), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
