# cptracker

A local-first dashboard for competitive programming profiles. Connect your Codeforces, AtCoder, and LeetCode handles, then view live ratings, solved counts, activity heatmaps, trends, and recent accepted problems. All handles and cached results stay in your browser.

## Features

- **Platform profiles** - Codeforces, AtCoder, and LeetCode handles, editable at any time
- **Live statistics** - Rating, rank, solved count, points, and profile links
- **Activity heatmaps** - Daily accepted submissions and highest difficulty for the current year
- **Recent trend** - Daily accepted submissions per platform with Default, 1M, 3M, and 1Y ranges, plus toggleable series; a connected platform without usable activity keeps a disabled legend entry
- **Recent solves** - Paginated table with tags, difficulty, and source links
- **Local-first** - Handles and cached results live in `localStorage`; there is no account, server, or database
- **Collapsible sidebar** - Desktop navigation collapses to icons and remembers the choice
- **Synchronized theme switch** - Every colour transitions together at one duration; motion-sensitive visitors get an instant swap
- **Accessible** - Light and dark themes, keyboard-visible focus, reduced-motion support, semantic markup
- **MIT licensed** - Permissive terms with no source-disclosure requirement

Only platforms with a reliable public API and browser CORS support are supported.

## Tech stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| Framework       | Astro 7.4 with static output          |
| UI islands      | React 19 + TypeScript 5.9             |
| Styling         | Tailwind CSS 4                        |
| Primitives      | Radix UI (button slot and label only) |
| Charts          | Recharts 3                            |
| Icons           | Lucide React                          |
| Fonts           | JetBrains Mono and Inter, self-hosted |
| Package manager | Bun 1.3                               |
| Lint/format     | Oxlint, Oxfmt                         |

Astro renders every page to static HTML. The app shell, navigation, and About page are plain Astro. Only the dashboard summary, the profile form, and the theme toggle hydrate as React islands. There is no client-side router: navigation is a normal MPA page load, with Astro viewport prefetching. A CSS cross-document view transition smooths the hand-off between pages where the browser supports it, and motion-sensitive visitors get an instant swap instead.

## Getting started

### Prerequisites

- Bun 1.3+ or Node.js 22.23.4+

### Commands

```bash
bun install        # install dependencies
bun run dev        # start the development server
bun run check      # type-check Astro and TypeScript files
bun run lint       # lint TypeScript and TSX files
bun run lint:fix   # apply safe lint fixes
bun run fmt        # format every supported file
bun run fmt:check  # check formatting without writing
bun run build      # type-check, then build to dist/
bun run preview    # preview the production build
```

`bun run build` runs `astro check` before `astro build`, so type errors stop the build. Oxlint does not parse `.astro` files; `astro check` covers them. Oxfmt formats Astro, TypeScript, JavaScript, JSON, CSS, and Markdown, and sorts Tailwind classes.

## Routes

Astro uses file-based routes in `src/pages/`:

| Route                                   | Contents                                          |
| --------------------------------------- | ------------------------------------------------- |
| `/`                                     | Platform overview, heatmaps, trend, recent solves |
| `/profile/`                             | Platform handle configuration                     |
| `/about/`                               | Static explanation and FAQ                        |
| `/index.md`, `/profile.md`, `/about.md` | Markdown versions of each page                    |
| `/llms.txt`, `/llms-full.txt`           | Crawler and agent indexes                         |
| `/robots.txt`, `/sitemap-index.xml`     | Crawler rules and sitemap                         |

## Data

All data stays in the browser.

| Key                        | Contents                               |
| -------------------------- | -------------------------------------- |
| `platform-profile-handles` | Saved handles per platform             |
| `platform-profile-results` | Cached profile statistics and activity |
| `cptracker-theme`          | Selected light or dark theme           |

`usePlatformHandles` subscribes to `localStorage` with `useSyncExternalStore`, so every island sees the same saved handles. `usePlatformProfiles` renders stored results immediately and reuses them for five minutes, so reloads and route changes do not call the public APIs again. A result is reused only when it is younger than five minutes and covers every saved handle; otherwise the populated handles are refreshed in the background, and the refresh button always fetches new data. Requests abort when the handles change or the island unmounts, and cached values are validated before use.

## Project structure

```text
cptracker/
+-- .github/
|   +-- workflows/ci.yml        # Format, lint, type-check, and build
|   +-- dependabot.yml
|   \-- ISSUE_TEMPLATE/
+-- public/
|   +-- logos/                  # Platform brand marks
|   +-- favicon.svg
|   \-- site.webmanifest
+-- src/
|   +-- assets/brand/           # Build-time Open Graph image
|   +-- components/
|   |   +-- ui/                 # Generated shadcn primitives
|   |   +-- activity-heatmaps.tsx        # Activity and difficulty heatmaps
|   |   +-- platform-activity-graphs.tsx # Container for the activity cards
|   |   +-- platform-profile-summary.tsx # Dashboard overview card
|   |   +-- profile-cards.tsx            # Profile and error cards
|   |   +-- profile-handle-form.tsx      # Handle fields and actions
|   |   +-- profile-page.tsx             # Profile page container
|   |   +-- recent-solves-card.tsx       # Recently solved wrapper
|   |   +-- recent-solves-table.tsx      # Paginated solves table
|   |   +-- recent-trend-card.tsx        # Trend chart and legend
|   |   \-- seo.astro, theme-toggle.tsx, ...
|   +-- hooks/                  # Handle storage and profile fetching
|   +-- layouts/                # Base document and app shell
|   +-- lib/                    # Site copy, date helpers, and class helper
|   +-- pages/                  # Routes, Markdown endpoints, MCP discovery
|   +-- services/
|   |   +-- platforms/          # API clients, catalog, and shared types
|   |   +-- platform-profile-service.ts  # Cache-aware refresh orchestration
|   |   \-- platform-profile-storage.ts  # Handles and cached results
|   \-- index.css
+-- astro.config.ts
+-- .oxlintrc.json
+-- .oxfmtrc.json
+-- .vercelignore
+-- vercel.json
+-- package.json
+-- CONTRIBUTING.md
+-- SECURITY.md
\-- LICENSE
```

## UI components

`src/components/ui` contains shadcn primitives generated with the `radix-lyra` style. Treat that folder as generated code: do not hand-edit it. Pass layout and appearance overrides through `className` at the usage site, for example `<Button className="self-end" />`. To change a primitive, reinstall it instead of editing it:

```bash
bunx shadcn@latest add button card input label table --overwrite --yes
```

## Public APIs

| Platform   | Source                             |
| ---------- | ---------------------------------- |
| Codeforces | `codeforces.com/api`               |
| AtCoder    | `kenkoooo.com/atcoder/atcoder-api` |
| LeetCode   | `alfa-leetcode-api.onrender.com`   |

Requests run directly from the browser to the platform APIs. Each request has a 15-second timeout. If a platform is rate-limited or unreachable, its card is marked unavailable and the rest of the dashboard keeps working.

## Security and privacy

- No account, server, database, analytics, or third-party script.
- No handle ever leaves the browser except to the platform API it belongs to.
- `vercel.json` sets a Content Security Policy, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and immutable caching for hashed assets.
- The policy allows inline styles and scripts because Astro inlines the theme bootstrap script and component styles. All other sources are restricted to the site origin and the three public APIs.

## SEO and AI discovery

- Canonical URLs, Open Graph, Twitter cards, and JSON-LD are generated by `src/components/seo.astro`.
- The 1200 x 630 Open Graph image is optimised at build time with `getImage`.
- `/llms.txt` and `/llms-full.txt` describe the site for language models.
- Markdown versions of each page are linked with `rel="alternate" type="text/markdown"`.
- `/.well-known/mcp.json` lists machine-readable resources for MCP clients.
- `robots.txt` allows crawlers and points to the sitemap.

Canonical URLs, Open Graph tags, JSON-LD, the sitemap, and MCP discovery use the deployment origin, which Vercel exposes to the build. No domain is hard-coded and no environment variable is required.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull request. It installs from `bun.lock` with `--frozen-lockfile`, then runs formatting, lint, type-check, and build in that order. A failing step stops the run. Dependabot groups weekly dependency and GitHub Actions updates.

## Deployment

The build outputs static files to `dist/`. Any static host works. `vercel.json` pins the install, build, and output commands, and adds the security and cache headers.

To deploy on Vercel:

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Keep the detected Astro settings. Vercel reads the commands and `dist` output from `vercel.json`.
3. Deploy. Later pushes to `main` redeploy automatically.

There is nothing to configure. The deployment origin comes from Vercel's build environment, and a custom domain is picked up the same way, so canonical URLs, Open Graph tags, JSON-LD, the sitemap, and MCP discovery stay correct. `.vercelignore` keeps the upload small while retaining `bun.lock`, so installs stay reproducible. No server, database, or secret key is involved.

To deploy with the CLI instead:

```bash
bunx vercel --prod
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, and conventions. Report security problems privately as described in [SECURITY.md](SECURITY.md).

## Language

All user-facing copy and repository documentation use English (India). The document language is `en-IN`, and the Open Graph locale is `en_IN`.

## License

MIT - see [LICENSE](LICENSE).
