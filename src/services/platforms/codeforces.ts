import { fetchJson } from "@/services/platforms/http";
import type {
  PlatformActivity,
  PlatformProfile,
  RecentSolve,
} from "@/services/platforms/types";

const MIN_REQUEST_INTERVAL_MS = 2_100;

interface CodeforcesUser {
  rating?: number;
  rank?: string;
}

interface CodeforcesResponse<T> {
  status?: string;
  comment?: string;
  result?: T;
}

interface CodeforcesSubmission {
  verdict?: string;
  creationTimeSeconds?: number;
  problem?: {
    contestId?: number;
    index?: string;
    name?: string;
    rating?: number;
    tags?: string[];
  };
}

interface SolvedCodeforcesSubmission extends CodeforcesSubmission {
  creationTimeSeconds: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
    rating?: number;
    tags?: string[];
  };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isSolvedSubmission(
  submission: CodeforcesSubmission,
): submission is SolvedCodeforcesSubmission {
  return (
    submission.verdict === "OK" &&
    typeof submission.creationTimeSeconds === "number" &&
    typeof submission.problem?.contestId === "number" &&
    typeof submission.problem.index === "string" &&
    typeof submission.problem.name === "string"
  );
}

function countSolvedProblems(submissions: CodeforcesSubmission[]): number {
  const solved = new Set<string>();

  for (const submission of submissions) {
    if (!isSolvedSubmission(submission)) continue;

    solved.add(`${submission.problem.contestId}-${submission.problem.index}`);
  }

  return solved.size;
}

function getActivity(submissions: CodeforcesSubmission[]): PlatformActivity[] {
  const byDate = new Map<string, PlatformActivity>();

  for (const submission of submissions) {
    if (
      submission.verdict !== "OK" ||
      submission.creationTimeSeconds === undefined
    ) {
      continue;
    }

    const date = new Date(submission.creationTimeSeconds * 1000)
      .toISOString()
      .slice(0, 10);
    const current = byDate.get(date) ?? { date, count: 0 };

    current.count += 1;
    if (submission.problem?.rating) {
      current.difficulty = Math.max(
        current.difficulty ?? 0,
        submission.problem.rating,
      );
    }

    byDate.set(date, current);
  }

  return [...byDate.values()];
}

function getRecentSolves(submissions: CodeforcesSubmission[]): RecentSolve[] {
  return submissions
    .filter(isSolvedSubmission)
    .toSorted((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)
    .slice(0, 20)
    .map((submission): RecentSolve => {
      const { contestId, index, name, rating, tags } = submission.problem;

      return {
        id: `${contestId}-${index}-${submission.creationTimeSeconds}`,
        name,
        platform: "codeforces",
        tags: tags ?? [],
        difficulty: rating === undefined ? undefined : String(rating),
        sourceUrl: `https://codeforces.com/contest/${contestId}/problem/${index}`,
        solvedAt: new Date(submission.creationTimeSeconds * 1000).toISOString(),
      };
    });
}

export async function fetchCodeforces(
  handle: string,
  signal?: AbortSignal,
): Promise<PlatformProfile> {
  const encoded = encodeURIComponent(handle);
  const userResponse = await fetchJson<CodeforcesResponse<CodeforcesUser[]>>(
    `https://codeforces.com/api/user.info?handles=${encoded}`,
    { signal },
  );
  const user = userResponse.result?.[0];

  if (userResponse.status !== "OK" || !user) {
    throw new Error(userResponse.comment ?? "Codeforces user was not found");
  }

  await wait(MIN_REQUEST_INTERVAL_MS);

  const submissionsResponse = await fetchJson<
    CodeforcesResponse<CodeforcesSubmission[]>
  >(`https://codeforces.com/api/user.status?handle=${encoded}`, { signal });

  if (
    submissionsResponse.status !== "OK" ||
    !Array.isArray(submissionsResponse.result)
  ) {
    throw new Error(
      submissionsResponse.comment ?? "Codeforces submissions are unavailable",
    );
  }

  const submissions = submissionsResponse.result;

  return {
    platform: "codeforces",
    handle,
    profileUrl: `https://codeforces.com/profile/${encoded}`,
    rating: user.rating === undefined ? undefined : String(user.rating),
    rank: user.rank,
    solved: String(countSolvedProblems(submissions)),
    activity: getActivity(submissions),
    recentSolves: getRecentSolves(submissions),
  };
}
