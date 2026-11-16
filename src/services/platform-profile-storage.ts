import { isPlatformId, PLATFORM_IDS } from "@/services/platforms/catalog";
import type {
  PlatformActivity,
  PlatformHandle,
  PlatformProfile,
  RecentSolve,
} from "@/services/platforms/types";

export const PLATFORM_PROFILE_HANDLES_KEY = "platform-profile-handles";
export const PLATFORM_PROFILE_HANDLES_EVENT =
  "cptracker:platform-handles-change";

const PLATFORM_PROFILE_RESULTS_KEY = "platform-profile-results";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface ProfileCache {
  savedAt: number;
  profiles: PlatformProfile[];
}

const EMPTY_CACHE: ProfileCache = { savedAt: 0, profiles: [] };

let cachedRaw: string | null | undefined;
let cachedValue: ProfileCache = EMPTY_CACHE;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function mergePlatformHandles(
  handles: PlatformHandle[],
): PlatformHandle[] {
  const handlesByPlatform = new Map(
    handles.map((item) => [item.platform, item.handle]),
  );

  return PLATFORM_IDS.map((platform) => ({
    platform,
    handle: handlesByPlatform.get(platform) ?? "",
  }));
}

export function readPlatformHandles(): PlatformHandle[] {
  const storage = getStorage();
  if (!storage) return mergePlatformHandles([]);

  try {
    const raw = storage.getItem(PLATFORM_PROFILE_HANDLES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) return mergePlatformHandles([]);

    const handles = parsed.filter(
      (item): item is PlatformHandle =>
        typeof item === "object" &&
        item !== null &&
        isPlatformId((item as PlatformHandle).platform) &&
        typeof (item as PlatformHandle).handle === "string",
    );

    return mergePlatformHandles(handles);
  } catch {
    return mergePlatformHandles([]);
  }
}

export function savePlatformHandles(
  handles: PlatformHandle[],
): PlatformHandle[] {
  const normalized = handles
    .map((item) => ({ platform: item.platform, handle: item.handle.trim() }))
    .filter((item) => item.handle);

  try {
    getStorage()?.setItem(
      PLATFORM_PROFILE_HANDLES_KEY,
      JSON.stringify(normalized),
    );
  } catch {
    // Storage can be full or blocked; the in-memory updates still apply.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PLATFORM_PROFILE_HANDLES_EVENT));
  }

  return mergePlatformHandles(normalized);
}

export function readPlatformProfileCache(): ProfileCache {
  const storage = getStorage();
  if (!storage) return EMPTY_CACHE;

  let raw: string | null;

  try {
    raw = storage.getItem(PLATFORM_PROFILE_RESULTS_KEY);
  } catch {
    return EMPTY_CACHE;
  }

  if (raw === cachedRaw) return cachedValue;

  cachedRaw = raw;
  cachedValue = EMPTY_CACHE;

  if (!raw) return cachedValue;

  try {
    const parsed = JSON.parse(raw) as unknown;

    // An older build stored a bare array without a timestamp.
    if (Array.isArray(parsed)) {
      cachedValue = { savedAt: 0, profiles: parsed.filter(isPlatformProfile) };
      return cachedValue;
    }

    const candidate = parsed as Partial<ProfileCache>;

    if (
      typeof candidate.savedAt !== "number" ||
      !Array.isArray(candidate.profiles)
    ) {
      return cachedValue;
    }

    cachedValue = {
      savedAt: candidate.savedAt,
      profiles: candidate.profiles.filter(isPlatformProfile),
    };

    return cachedValue;
  } catch {
    return cachedValue;
  }
}

export function savePlatformProfiles(profiles: PlatformProfile[]): void {
  try {
    getStorage()?.setItem(
      PLATFORM_PROFILE_RESULTS_KEY,
      JSON.stringify({ savedAt: Date.now(), profiles }),
    );
  } catch {
    // Cached results are best-effort; live data is already in memory.
  }
}

export function isCacheUsable(
  cache: ProfileCache,
  handles: readonly PlatformHandle[],
): boolean {
  if (!cache.savedAt || Date.now() - cache.savedAt >= CACHE_TTL_MS) {
    return false;
  }

  return handles.every((item) =>
    cache.profiles.some(
      (profile) =>
        profile.platform === item.platform &&
        profile.handle === item.handle.trim(),
    ),
  );
}

export function readCachedProfilesFor(
  cache: ProfileCache,
  handles: readonly PlatformHandle[],
): PlatformProfile[] {
  return handles.flatMap((item) => {
    const match = cache.profiles.find(
      (profile) =>
        profile.platform === item.platform &&
        profile.handle === item.handle.trim(),
    );

    return match ? [match] : [];
  });
}

function isActivityEntry(value: unknown): value is PlatformActivity {
  if (typeof value !== "object" || value === null) return false;

  const entry = value as Partial<PlatformActivity>;
  return typeof entry.date === "string" && Number.isFinite(Number(entry.count));
}

function isRecentSolve(value: unknown): value is RecentSolve {
  if (typeof value !== "object" || value === null) return false;

  const solve = value as Partial<RecentSolve>;
  return (
    typeof solve.id === "string" &&
    typeof solve.name === "string" &&
    isPlatformId(solve.platform) &&
    Array.isArray(solve.tags) &&
    typeof solve.sourceUrl === "string" &&
    typeof solve.solvedAt === "string"
  );
}

function isPlatformProfile(value: unknown): value is PlatformProfile {
  if (typeof value !== "object" || value === null) return false;

  const profile = value as Partial<PlatformProfile>;
  return (
    isPlatformId(profile.platform) &&
    typeof profile.handle === "string" &&
    typeof profile.profileUrl === "string" &&
    (profile.activity === undefined ||
      (Array.isArray(profile.activity) &&
        profile.activity.every(isActivityEntry))) &&
    (profile.recentSolves === undefined ||
      (Array.isArray(profile.recentSolves) &&
        profile.recentSolves.every(isRecentSolve)))
  );
}
