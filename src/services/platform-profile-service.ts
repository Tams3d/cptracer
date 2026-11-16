import { fetchAtcoder } from "@/services/platforms/atcoder";
import { fetchCodeforces } from "@/services/platforms/codeforces";
import { fetchLeetcode } from "@/services/platforms/leetcode";
import {
  isCacheUsable,
  readCachedProfilesFor,
  readPlatformProfileCache,
  savePlatformProfiles,
} from "@/services/platform-profile-storage";
import type {
  PlatformHandle,
  PlatformId,
  PlatformProfile,
  PlatformProfileRefreshResult,
} from "@/services/platforms/types";

type RefreshOutcome =
  | { profile: PlatformProfile }
  | { platform: PlatformId; error: string };

async function fetchPlatformProfile(
  platform: PlatformId,
  handle: string,
  signal?: AbortSignal,
): Promise<PlatformProfile> {
  const normalizedHandle = handle.trim();

  if (!normalizedHandle) {
    throw new Error("A handle is required");
  }

  switch (platform) {
    case "codeforces":
      return fetchCodeforces(normalizedHandle, signal);
    case "atcoder":
      return fetchAtcoder(normalizedHandle, signal);
    case "leetcode":
      return fetchLeetcode(normalizedHandle, signal);
  }
}

interface RefreshOptions {
  signal?: AbortSignal;
  // Reuse the saved cache while it is younger than five minutes and covers
  // every requested handle. Manual refreshes pass `false`.
  useCache?: boolean;
}

export async function refreshPlatformProfiles(
  handles: PlatformHandle[],
  { signal, useCache = false }: RefreshOptions = {},
): Promise<PlatformProfileRefreshResult> {
  const populatedHandles = handles.filter((item) => item.handle.trim());

  if (useCache) {
    const cache = readPlatformProfileCache();

    if (isCacheUsable(cache, populatedHandles)) {
      return {
        profiles: readCachedProfilesFor(cache, populatedHandles),
        errors: {},
      };
    }
  }

  const outcomes = await Promise.all(
    populatedHandles.map(async (item): Promise<RefreshOutcome> => {
      try {
        const profile = await fetchPlatformProfile(
          item.platform,
          item.handle,
          signal,
        );
        return { profile };
      } catch (error) {
        if (signal?.aborted) throw error;

        return {
          platform: item.platform,
          error:
            error instanceof Error ? error.message : "Unable to load profile",
        };
      }
    }),
  );

  const profiles: PlatformProfile[] = [];
  const errors: Partial<Record<PlatformId, string>> = {};

  for (const outcome of outcomes) {
    if ("profile" in outcome) {
      profiles.push(outcome.profile);
    } else {
      errors[outcome.platform] = outcome.error;
    }
  }

  savePlatformProfiles(profiles);

  return { profiles, errors };
}
