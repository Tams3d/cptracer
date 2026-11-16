import type { APIRoute } from "astro";

import { buildProfileMarkdown } from "@/lib/site-content";

export const GET: APIRoute = ({ site }) =>
  new Response(buildProfileMarkdown(site), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
