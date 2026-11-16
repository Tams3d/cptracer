import { useSyncExternalStore } from "react";

import {
  mergePlatformHandles,
  PLATFORM_PROFILE_HANDLES_EVENT,
  PLATFORM_PROFILE_HANDLES_KEY,
  readPlatformHandles,
} from "@/services/platform-profile-storage";
import type { PlatformHandle } from "@/services/platforms/types";

const EMPTY_HANDLES = mergePlatformHandles([]);

let cachedRaw: string | null | undefined;
let cachedHandles: PlatformHandle[] = EMPTY_HANDLES;

function getSnapshot(): PlatformHandle[] {
  if (typeof window === "undefined") return EMPTY_HANDLES;

  let raw: string | null;

  try {
    raw = window.localStorage.getItem(PLATFORM_PROFILE_HANDLES_KEY);
  } catch {
    return EMPTY_HANDLES;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedHandles = readPlatformHandles();
  }

  return cachedHandles;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PLATFORM_PROFILE_HANDLES_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PLATFORM_PROFILE_HANDLES_EVENT, onStoreChange);
  };
}

export function usePlatformHandles(): PlatformHandle[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_HANDLES);
}
