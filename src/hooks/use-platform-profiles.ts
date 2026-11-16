import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { refreshPlatformProfiles } from "@/services/platform-profile-service";
import { readPlatformProfileCache } from "@/services/platform-profile-storage";
import type {
  PlatformHandle,
  PlatformId,
  PlatformProfile,
} from "@/services/platforms/types";

interface ProfilesState {
  profiles: PlatformProfile[];
  errors: Partial<Record<PlatformId, string>>;
}

interface ProfilesResult extends ProfilesState {
  requestKey: string;
}

function getRequestKey(handles: readonly PlatformHandle[]): string {
  return handles
    .map(({ platform, handle }) => `${platform}:${handle.trim()}`)
    .join("|");
}

function readCachedProfiles(
  handles: readonly PlatformHandle[],
): PlatformProfile[] {
  const activeHandles = new Map(
    handles.map(({ platform, handle }) => [platform, handle.trim()]),
  );

  return readPlatformProfileCache().profiles.filter(
    (profile) => activeHandles.get(profile.platform) === profile.handle,
  );
}

export function usePlatformProfiles(handles: PlatformHandle[]) {
  const [result, setResult] = useState<ProfilesResult | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const requestRef = useRef<AbortController | null>(null);
  const refreshTokenRef = useRef(0);

  const handlesKey = useMemo(() => getRequestKey(handles), [handles]);
  const hasHandles = useMemo(
    () => handles.some(({ handle }) => handle.trim().length > 0),
    [handles],
  );
  const cachedProfiles = useMemo(() => readCachedProfiles(handles), [handles]);

  const requestKey = `${handlesKey}#${refreshToken}`;

  const startRequest = useCallback(
    (useCache: boolean, key: string) => {
      requestRef.current?.abort();

      const controller = new AbortController();
      requestRef.current = controller;

      refreshPlatformProfiles(handles, {
        signal: controller.signal,
        useCache,
      })
        .then((next) => {
          if (!controller.signal.aborted)
            setResult({ ...next, requestKey: key });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResult({ requestKey: key, profiles: [], errors: {} });
          }
        });
    },
    [handles],
  );

  useEffect(() => {
    if (!hasHandles) return;

    startRequest(true, `${handlesKey}#${refreshTokenRef.current}`);

    return () => {
      requestRef.current?.abort();
    };
  }, [hasHandles, handlesKey, startRequest]);

  const refresh = useCallback(() => {
    if (!hasHandles) return;

    refreshTokenRef.current += 1;
    setRefreshToken(refreshTokenRef.current);
    startRequest(false, `${handlesKey}#${refreshTokenRef.current}`);
  }, [hasHandles, handlesKey, startRequest]);

  const isFetching = hasHandles && result?.requestKey !== requestKey;

  return {
    profiles: !hasHandles
      ? []
      : isFetching
        ? cachedProfiles
        : (result?.profiles ?? cachedProfiles),
    errors: hasHandles && !isFetching ? (result?.errors ?? {}) : {},
    isFetching,
    refresh,
  };
}
