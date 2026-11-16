import type { APIRoute } from "astro";

import { buildLlmsTxt } from "@/lib/site-content";

export const GET: APIRoute = ({ site }) =>
  new Response(buildLlmsTxt(site), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
