import type { APIRoute } from "astro";

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bingbot",
  "DuckDuckBot",
  "Amazonbot",
];

export const GET: APIRoute = ({ site }) => {
  const sitemap = site ? new URL("sitemap-index.xml", site).href : null;

  const lines = [
    "User-agent: *",
    "Allow: /",
    "Allow: /llms.txt",
    "Allow: /llms-full.txt",
    "",
    ...AI_CRAWLERS.flatMap((crawler) => [
      `User-agent: ${crawler}`,
      "Allow: /",
      "",
    ]),
    ...(sitemap ? [`Sitemap: ${sitemap}`, ""] : []),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
