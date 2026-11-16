import { useMemo } from "react";
import { ExternalLink, RefreshCw, UsersRound } from "lucide-react";

import { PlatformActivityGraphs } from "@/components/platform-activity-graphs";
import { PlatformLogo } from "@/components/platform-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePlatformHandles } from "@/hooks/use-platform-handles";
import { usePlatformProfiles } from "@/hooks/use-platform-profiles";
import { cn } from "@/lib/utils";
import type { PlatformId, PlatformProfile } from "@/services/platforms/types";
import { PLATFORM_LABELS } from "@/services/platforms/catalog";

export function PlatformProfileSummary() {
  const handles = usePlatformHandles();
  const { profiles, errors, isFetching, refresh } =
    usePlatformProfiles(handles);

  const errorPlatforms = Object.keys(errors) as PlatformId[];

  const metrics = useMemo(() => {
    let solved = 0;
    let rated = 0;
    let topRating = 0;

    for (const profile of profiles) {
      solved += toNumber(profile.solved);

      const rating = toNumber(profile.rating);
      if (rating > 0) {
        rated += 1;
        topRating = Math.max(topRating, rating);
      }
    }

    return { solved, connected: profiles.length, rated, topRating };
  }, [profiles]);

  const isEmpty = profiles.length === 0 && errorPlatforms.length === 0;
  const isLoading = isFetching && profiles.length === 0;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Card className="min-w-0 gap-2 border border-border bg-background p-2 ring-0">
        <CardHeader className="grid gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_minmax(308px,1fr)]">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center bg-primary/10 text-primary">
                <UsersRound className="size-3.5" />
              </div>

              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <CardTitle className="shrink-0 text-sm">
                    Platform overview
                  </CardTitle>
                  <CardDescription className="min-w-0 text-xs">
                    Statistics from connected handles, cached for five minutes.
                  </CardDescription>
                </div>

                <div className="mt-1 flex max-w-full flex-wrap items-center gap-1 text-2xs">
                  <SummaryMetric
                    label="Solved"
                    value={metrics.solved.toLocaleString()}
                  />
                  <SummaryMetric
                    label="Connected"
                    value={String(metrics.connected)}
                  />
                  <SummaryMetric label="Rated" value={String(metrics.rated)} />
                  <SummaryMetric
                    label="Top rating"
                    value={
                      metrics.topRating
                        ? metrics.topRating.toLocaleString()
                        : "-"
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              className="shrink-0 self-end sm:self-auto"
              title={isFetching ? "Loading" : "Refresh"}
              aria-label={isFetching ? "Loading" : "Refresh"}
              onClick={refresh}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("size-3.5", isFetching && "animate-spin")}
              />
            </Button>
          </div>

          <div className="min-w-0 border-l border-border p-2">
            <div className="mb-1 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              Connected platforms
            </div>

            <div className="flex min-w-0 flex-row flex-wrap items-center gap-2 overflow-hidden">
              {profiles.map((profile) => (
                <PlatformLink key={profile.platform} profile={profile} />
              ))}

              {errorPlatforms.map((platform) => (
                <span
                  key={platform}
                  className="flex flex-row items-center gap-2 text-muted-foreground"
                >
                  <PlatformLogo platform={platform} />
                  <span className="text-xs font-medium">
                    {PLATFORM_LABELS[platform]}
                  </span>
                  <span className="text-2xs">unavailable</span>
                </span>
              ))}

              {isEmpty && !isFetching && (
                <span className="text-2xs text-muted-foreground">
                  No connected platforms
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        {(isEmpty || isLoading) && (
          <p className="p-2 text-xs text-muted-foreground">
            {isLoading
              ? "Loading platform statistics..."
              : "Connect a handle on the profile page to load platform statistics."}
          </p>
        )}
      </Card>

      {profiles.length > 0 && <PlatformActivityGraphs profiles={profiles} />}
    </div>
  );
}

function PlatformLink({ profile }: { profile: PlatformProfile }) {
  return (
    <a
      href={profile.profileUrl}
      target="_blank"
      rel="noreferrer"
      className="flex max-w-full min-w-0 flex-row items-center gap-2 transition-colors hover:text-primary"
      aria-label={`Open ${PLATFORM_LABELS[profile.platform]} profile`}
    >
      <PlatformLogo platform={profile.platform} />
      <span className="shrink-0 text-xs font-medium">
        {PLATFORM_LABELS[profile.platform]}
      </span>
      <span className="min-w-0 truncate text-2xs text-muted-foreground">
        {profile.handle}
      </span>
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

function toNumber(value?: string): number {
  if (!value) return 0;

  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1 border-r border-border px-1 leading-none whitespace-nowrap last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
