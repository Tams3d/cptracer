import type { PlatformId } from "./types";

export const PLATFORM_IDS = [
  "codeforces",
  "atcoder",
  "leetcode",
] as const satisfies readonly PlatformId[];

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  codeforces: "Codeforces",
  atcoder: "AtCoder",
  leetcode: "LeetCode",
};

export function isPlatformId(value: unknown): value is PlatformId {
  return PLATFORM_IDS.includes(value as PlatformId);
}
