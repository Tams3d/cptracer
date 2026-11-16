import { fetchJson, fetchOptionalJson } from "@/services/platforms/http";
import type {
  PlatformActivity,
  PlatformProfile,
  RecentSolve,
} from "@/services/platforms/types";

const BASE_URL = "https://alfa-leetcode-api.onrender.com";
const FALLBACK_PROFILE_URL = "https://leetcode-api-faisalshohag.vercel.app";
const DETAIL_CACHE_TTL_MS = 60 * 60 * 1000;
const DETAIL_FAILURE_TTL_MS = 2 * 60 * 1000;
const DETAIL_CONCURRENCY = 4;
const RECENT_SOLVE_LIMIT = 20;

interface LeetCodeSubmission {
  title?: string;
  titleSlug?: string;
  timestamp?: string;
  statusDisplay?: string;
  lang?: string;
}

interface LeetCodeProfileResponse {
  totalSolved?: number;
  ranking?: number;
  submissionCalendar?: string;
  recentSubmissions?: LeetCodeSubmission[];
}

interface LeetCodeCalendarResponse {
  submissionCalendar?: string;
}

interface LeetCodeRecentResponse {
  submission?: LeetCodeSubmission[];
}

interface LeetCodeProblemDetail {
  difficulty?: string;
  topicTags?: { name?: string }[];
  companyTagStats?: string | Record<string, unknown> | null;
}

interface CachedDetail {
  value: LeetCodeProblemDetail | null;
  expiresAt: number;
}

const detailCache = new Map<string, CachedDetail>();

function parseCalendar(value?: string): PlatformActivity[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as Record<string, number>;

    return Object.entries(parsed)
      .map(([timestamp, count]) => ({
        date: new Date(Number(timestamp) * 1000).toISOString().slice(0, 10),
        count: Number(count),
      }))
      .filter((entry) => Number.isFinite(entry.count) && entry.count > 0);
  } catch {
    return [];
  }
}

function parseCompanyTags(
  value: LeetCodeProblemDetail["companyTagStats"],
): string[] {
  if (!value) return [];

  let stats: unknown = value;

  if (typeof value === "string") {
    try {
      stats = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!stats || typeof stats !== "object") return [];

  const names = new Set<string>();

  for (const bucket of Object.values(stats as Record<string, unknown>)) {
    if (!Array.isArray(bucket)) continue;

    for (const entry of bucket) {
      if (!entry || typeof entry !== "object") continue;

      const tagName = (entry as { tagName?: unknown }).tagName;
      if (typeof tagName === "string" && tagName.trim()) {
        names.add(tagName.trim());
      }
    }
  }

  return [...names];
}

function parseTopics(detail: LeetCodeProblemDetail | null): string[] {
  return (detail?.topicTags ?? [])
    .map((tag) => tag.name?.trim())
    .filter((name): name is string => Boolean(name));
}

function formatDifficulty(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";

  return undefined;
}

async function fetchProblemDetail(
  titleSlug: string,
): Promise<LeetCodeProblemDetail | null> {
  const cached = detailCache.get(titleSlug);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const detail = await fetchOptionalJson<LeetCodeProblemDetail>(
    `${BASE_URL}/select?titleSlug=${encodeURIComponent(titleSlug)}`,
  );

  detailCache.set(titleSlug, {
    value: detail,
    expiresAt:
      Date.now() + (detail ? DETAIL_CACHE_TTL_MS : DETAIL_FAILURE_TTL_MS),
  });

  return detail;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        const item = items[index];
        if (item === undefined) return;
        results[index] = await mapper(item);
      }
    },
  );

  await Promise.all(workers);

  return results;
}

async function getRecentSolves(
  submissions: LeetCodeSubmission[],
): Promise<RecentSolve[]> {
  const accepted = submissions
    .filter(
      (submission) =>
        submission.statusDisplay === "Accepted" &&
        submission.titleSlug &&
        submission.timestamp,
    )
    .toSorted((a, b) => Number(b.timestamp) - Number(a.timestamp));

  const seenSlugs = new Set<string>();
  const uniqueSubmissions: LeetCodeSubmission[] = [];

  for (const submission of accepted) {
    const titleSlug = submission.titleSlug as string;
    if (seenSlugs.has(titleSlug)) continue;

    seenSlugs.add(titleSlug);
    uniqueSubmissions.push(submission);

    if (uniqueSubmissions.length === RECENT_SOLVE_LIMIT) break;
  }

  const details = await mapWithConcurrency(
    uniqueSubmissions,
    DETAIL_CONCURRENCY,
    (submission) => fetchProblemDetail(submission.titleSlug as string),
  );

  return uniqueSubmissions.map((submission, index) => {
    const titleSlug = submission.titleSlug as string;
    const detail = details[index] ?? null;
    const companies = parseCompanyTags(detail?.companyTagStats);
    const topics = parseTopics(detail);

    return {
      id: `${titleSlug}-${submission.timestamp}`,
      name: submission.title ?? titleSlug,
      platform: "leetcode",
      tags: companies.length ? companies : topics,
      difficulty: formatDifficulty(detail?.difficulty),
      sourceUrl: `https://leetcode.com/problems/${titleSlug}/`,
      solvedAt: new Date(Number(submission.timestamp) * 1000).toISOString(),
    };
  });
}

async function fetchProfile(
  handle: string,
  signal?: AbortSignal,
): Promise<LeetCodeProfileResponse> {
  const encoded = encodeURIComponent(handle);

  try {
    return await fetchJson<LeetCodeProfileResponse>(
      `${BASE_URL}/userProfile/${encoded}`,
      { signal },
    );
  } catch (error) {
    if (signal?.aborted) throw error;

    return fetchJson<LeetCodeProfileResponse>(
      `${FALLBACK_PROFILE_URL}/${encoded}`,
      { signal },
    );
  }
}

export async function fetchLeetcode(
  handle: string,
  signal?: AbortSignal,
): Promise<PlatformProfile> {
  const encoded = encodeURIComponent(handle);
  const profile = await fetchProfile(handle, signal);

  const [calendar, recent] = await Promise.all([
    fetchOptionalJson<LeetCodeCalendarResponse>(
      `${BASE_URL}/${encoded}/calendar`,
      { signal },
    ),
    fetchOptionalJson<LeetCodeRecentResponse>(
      `${BASE_URL}/${encoded}/submission`,
      { signal },
    ),
  ]);

  return {
    platform: "leetcode",
    handle,
    profileUrl: `https://leetcode.com/u/${encoded}/`,
    rank: profile.ranking === undefined ? undefined : `#${profile.ranking}`,
    solved:
      profile.totalSolved === undefined
        ? undefined
        : String(profile.totalSolved),
    activity: parseCalendar(
      calendar?.submissionCalendar ?? profile.submissionCalendar,
    ),
    recentSolves: await getRecentSolves(
      recent?.submission ?? profile.recentSubmissions ?? [],
    ),
  };
}
