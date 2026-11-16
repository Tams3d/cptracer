import type { APIRoute } from "astro";

import { buildLlmsFullTxt } from "@/lib/site-content";

export const GET: APIRoute = ({ site }) =>
  new Response(buildLlmsFullTxt(site), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
