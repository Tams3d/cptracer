import type { APIRoute } from "astro";

const DESCRIPTION =
  "Local-first dashboard for Codeforces, AtCoder, and LeetCode profiles.";

const RESOURCES = [
  { path: "/index.md", name: "Dashboard", mimeType: "text/markdown" },
  { path: "/profile.md", name: "Profile setup", mimeType: "text/markdown" },
  { path: "/about.md", name: "About and FAQ", mimeType: "text/markdown" },
  {
    path: "/llms-full.txt",
    name: "Full site documentation",
    mimeType: "text/plain",
  },
];

export const GET: APIRoute = ({ site }) => {
  const absolute = (path: string) => (site ? new URL(path, site).href : path);

  const payload = {
    name: "cptracker",
    description: DESCRIPTION,
    version: "0.1.1",
    kind: "static-resource-index",
    protocolVersion: "2026-07-28",
    homepage: absolute("/"),
    documentation: absolute("/llms.txt"),
    resources: RESOURCES.map(({ path, name, mimeType }) => ({
      uri: absolute(path),
      name,
      mimeType,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
