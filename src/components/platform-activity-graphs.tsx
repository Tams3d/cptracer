import { useMemo } from "react";

import { ActivityHeatmaps } from "@/components/activity-heatmaps";
import { RecentSolvesCard } from "@/components/recent-solves-card";
import { RecentTrendCard } from "@/components/recent-trend-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getToday } from "@/lib/date";
import type {
  PlatformActivity,
  PlatformProfile,
} from "@/services/platforms/types";

function getHeatmapRange() {
  const year = getToday().getFullYear();

  return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
}

export function PlatformActivityGraphs({
  profiles,
}: {
  profiles: PlatformProfile[];
}) {
  const activity = useMemo(() => {
    const byDate = new Map<string, PlatformActivity>();

    for (const profile of profiles) {
      for (const entry of profile.activity ?? []) {
        const count = Number(entry.count);
        if (!Number.isFinite(count) || count <= 0) continue;

        const current = byDate.get(entry.date) ?? {
          date: entry.date,
          count: 0,
        };
        current.count += count;
        current.difficulty =
          Math.max(current.difficulty ?? 0, entry.difficulty ?? 0) || undefined;
        byDate.set(entry.date, current);
      }
    }

    return [...byDate.values()].toSorted((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [profiles]);

  const difficultyActivity = useMemo(
    () =>
      activity
        .filter((entry) => (entry.difficulty ?? 0) > 0)
        .map((entry) => ({ date: entry.date, count: entry.difficulty ?? 0 })),
    [activity],
  );

  const recentSolves = useMemo(
    () =>
      profiles
        .flatMap((profile) => (profile.recentSolves ?? []).slice(0, 5))
        .toSorted((a, b) => Date.parse(b.solvedAt) - Date.parse(a.solvedAt)),
    [profiles],
  );

  const heatmapRange = useMemo(() => getHeatmapRange(), []);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {activity.length ? (
        <>
          <ActivityHeatmaps
            activity={activity}
            difficultyActivity={difficultyActivity}
            startDate={heatmapRange.start}
            endDate={heatmapRange.end}
          />
          <RecentTrendCard profiles={profiles} activity={activity} />
        </>
      ) : (
        <Card className="min-w-0 gap-2 border border-border bg-background p-2 ring-0">
          <CardHeader className="p-2">
            <CardTitle className="text-sm">Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-2 text-xs text-muted-foreground">
            Connect a platform with recent activity to populate the graphs.
          </CardContent>
        </Card>
      )}
      <RecentSolvesCard solves={recentSolves} />
    </div>
  );
}
