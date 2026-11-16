import { fetchJson, fetchOptionalJson } from "@/services/platforms/http";
import type {
  PlatformActivity,
  PlatformProfile,
  RecentSolve,
} from "@/services/platforms/types";

const SUBMISSION_PAGE_LIMIT = 6;
const SUBMISSION_PAGE_SIZE = 500;
const PROBLEM_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RECENT_SOLVE_FALLBACK_SECONDS = 3 * 365 * 24 * 60 * 60;

interface AtCoderUserInfo {
  accepted_count?: number;
  accepted_count_rank?: number;
  rated_point_sum?: number;
}

interface AtCoderSubmission {
  epoch_second?: number;
  problem_id?: string;
  contest_id?: string;
  result?: string;
}

interface AtCoderProblem {
  id?: string;
  contest_id?: string;
  problem_index?: string;
  name?: string;
  title?: string;
}

interface AtCoderProblemModel {
  difficulty?: number;
  is_experimental?: boolean;
}

interface AtCoderProblemInfo {
  id: string;
  contestId?: string;
  problemIndex?: string;
  name: string;
  difficulty?: number;
}

interface ProblemCatalog {
  problems: Map<string, AtCoderProblemInfo>;
  expiresAt: number;
}

let problemCatalogPromise: Promise<ProblemCatalog> | null = null;
let problemCatalog: ProblemCatalog | null = null;

function getStartOfYearSeconds(): number {
  const year = new Date().getUTCFullYear();
  return Math.floor(Date.UTC(year, 0, 1) / 1000);
}

async function loadProblemCatalog(): Promise<ProblemCatalog> {
  if (problemCatalog && problemCatalog.expiresAt > Date.now()) {
    return problemCatalog;
  }

  if (problemCatalogPromise) return problemCatalogPromise;

  problemCatalogPromise = (async () => {
    const [problems, models] = await Promise.all([
      fetchOptionalJson<AtCoderProblem[]>(
        "https://kenkoooo.com/atcoder/resources/problems.json",
      ),
      fetchOptionalJson<Record<string, AtCoderProblemModel>>(
        "https://kenkoooo.com/atcoder/resources/problem-models.json",
      ),
    ]);

    const problemMap = new Map<string, AtCoderProblemInfo>();

    for (const problem of problems ?? []) {
      if (!problem.id) continue;

      const difficulty = models?.[problem.id]?.difficulty;

      problemMap.set(problem.id, {
        id: problem.id,
        contestId: problem.contest_id,
        problemIndex: problem.problem_index,
        name: problem.name ?? problem.title ?? problem.id,
        difficulty:
          typeof difficulty === "number" && Number.isFinite(difficulty)
            ? Math.max(0, Math.round(difficulty))
            : undefined,
      });
    }

    const catalog: ProblemCatalog = {
      problems: problemMap,
      expiresAt: problemMap.size > 0 ? Date.now() + PROBLEM_CACHE_TTL_MS : 0,
    };

    problemCatalog = catalog;
    return catalog;
  })().finally(() => {
    problemCatalogPromise = null;
  });

  return problemCatalogPromise;
}

async function fetchSubmissions(
  handle: string,
  fromSecond: number,
  signal?: AbortSignal,
): Promise<AtCoderSubmission[]> {
  const submissions: AtCoderSubmission[] = [];

  for (let page = 0; page < SUBMISSION_PAGE_LIMIT; page += 1) {
    const batch = await fetchJson<AtCoderSubmission[]>(
      `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(
        handle,
      )}&from_second=${fromSecond}`,
      { signal },
    );

    if (!Array.isArray(batch) || batch.length === 0) break;

    submissions.push(...batch);

    const lastSecond = batch[batch.length - 1]?.epoch_second;
    if (batch.length < SUBMISSION_PAGE_SIZE || lastSecond === undefined) break;

    fromSecond = lastSecond + 1;
  }

  return submissions;
}

function getActivity(
  submissions: AtCoderSubmission[],
  catalog: ProblemCatalog,
): PlatformActivity[] {
  const byDate = new Map<string, PlatformActivity>();

  for (const submission of submissions) {
    if (submission.result !== "AC" || !submission.epoch_second) continue;

    const date = new Date(submission.epoch_second * 1000)
      .toISOString()
      .slice(0, 10);
    const current = byDate.get(date) ?? { date, count: 0 };
    const difficulty = submission.problem_id
      ? catalog.problems.get(submission.problem_id)?.difficulty
      : undefined;

    current.count += 1;

    if (difficulty) {
      current.difficulty = Math.max(current.difficulty ?? 0, difficulty);
    }

    byDate.set(date, current);
  }

  return [...byDate.values()];
}

function getRecentSolves(
  submissions: AtCoderSubmission[],
  catalog: ProblemCatalog,
): RecentSolve[] {
  const accepted = submissions
    .filter(
      (submission) => submission.result === "AC" && submission.epoch_second,
    )
    .toSorted((a, b) => (b.epoch_second ?? 0) - (a.epoch_second ?? 0));

  const seen = new Set<string>();
  const recent: RecentSolve[] = [];

  for (const submission of accepted) {
    const problemId = submission.problem_id;
    const solvedAtSeconds = submission.epoch_second;
    if (!problemId || seen.has(problemId) || !solvedAtSeconds) continue;

    seen.add(problemId);

    const problem = catalog.problems.get(problemId);
    const contestId = submission.contest_id ?? problem?.contestId;
    if (!contestId) continue;

    const problemIndex = problem?.problemIndex?.toUpperCase();
    const problemName = problem?.name ?? problemId;

    const tags = [contestId.toUpperCase(), problemIndex].filter(
      (tag): tag is string => Boolean(tag),
    );

    recent.push({
      id: `${problemId}-${solvedAtSeconds}`,
      name: problemIndex ? `${problemIndex} - ${problemName}` : problemName,
      platform: "atcoder",
      tags,
      difficulty:
        problem?.difficulty === undefined
          ? undefined
          : String(problem.difficulty),
      sourceUrl: `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`,
      solvedAt: new Date(solvedAtSeconds * 1000).toISOString(),
    });

    if (recent.length === 20) break;
  }

  return recent;
}

export async function fetchAtcoder(
  handle: string,
  signal?: AbortSignal,
): Promise<PlatformProfile> {
  const encoded = encodeURIComponent(handle);
  const yearStart = getStartOfYearSeconds();

  const [info, yearSubmissions, catalog] = await Promise.all([
    fetchJson<AtCoderUserInfo>(
      `https://kenkoooo.com/atcoder/atcoder-api/v3/user_info?user=${encoded}`,
      { signal },
    ),
    fetchSubmissions(handle, yearStart, signal),
    loadProblemCatalog(),
  ]);

  let submissions = yearSubmissions;
  let recentSolves = getRecentSolves(submissions, catalog);

  if (!recentSolves.length) {
    submissions = await fetchSubmissions(
      handle,
      yearStart - RECENT_SOLVE_FALLBACK_SECONDS,
      signal,
    );
    recentSolves = getRecentSolves(submissions, catalog);
  }

  const yearSubmissionsOnly = submissions.filter(
    (submission) => (submission.epoch_second ?? 0) >= yearStart,
  );

  return {
    platform: "atcoder",
    handle,
    profileUrl: `https://atcoder.jp/users/${encoded}`,
    solved:
      info.accepted_count === undefined
        ? undefined
        : String(info.accepted_count),
    rank:
      info.accepted_count_rank === undefined
        ? undefined
        : `#${info.accepted_count_rank}`,
    extra:
      info.rated_point_sum === undefined
        ? undefined
        : `${info.rated_point_sum.toLocaleString()} points`,
    activity: getActivity(yearSubmissionsOnly, catalog),
    recentSolves,
  };
}
