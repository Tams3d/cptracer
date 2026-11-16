import type { APIRoute } from "astro";

import { buildHomeMarkdown } from "@/lib/site-content";

export const GET: APIRoute = ({ site }) =>
  new Response(buildHomeMarkdown(site), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
