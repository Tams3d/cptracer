import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heatmap } from "@/components/ui/heatmap";
import { formatDayMonth, toDateKey } from "@/lib/date";
import type { PlatformActivity } from "@/services/platforms/types";

const ACTIVITY_COLORS = [
  "var(--heatmap-count-1)",
  "var(--heatmap-count-2)",
  "var(--heatmap-count-3)",
  "var(--heatmap-count-4)",
];

const DIFFICULTY_COLORS = [
  "var(--heatmap-difficulty-1)",
  "var(--heatmap-difficulty-2)",
  "var(--heatmap-difficulty-3)",
  "var(--heatmap-difficulty-4)",
  "var(--heatmap-difficulty-5)",
];

interface ActivityHeatmapsProps {
  activity: PlatformActivity[];
  difficultyActivity: { date: string; count: number }[];
  startDate: Date;
  endDate: Date;
}

export function ActivityHeatmaps({
  activity,
  difficultyActivity,
  startDate,
  endDate,
}: ActivityHeatmapsProps) {
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  const isVisibleDate = (date: string) => date >= startKey && date <= endKey;

  // Count only entries inside the rendered range so the total always agrees
  // with the coloured cells.
  const totalActivity = activity.reduce(
    (total, entry) => (isVisibleDate(entry.date) ? total + entry.count : total),
    0,
  );
  const visibleDifficultyActivity = difficultyActivity.filter((entry) =>
    isVisibleDate(entry.date),
  );

  return (
    <div className="grid min-w-0 gap-2 md:grid-cols-2">
      <Card className="min-w-0 gap-2 border border-border bg-background p-2 ring-0">
        <CardHeader className="p-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <CardTitle className="text-sm">Activity heatmap</CardTitle>
              <p className="mt-0.5 text-2xs text-muted-foreground">
                Accepted submissions this year.
              </p>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {totalActivity.toLocaleString()} accepted
            </span>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 overflow-hidden p-2">
          <Heatmap
            data={activity}
            startDate={startDate}
            endDate={endDate}
            colors={ACTIVITY_COLORS}
            emptyColor="var(--heatmap-empty)"
            cellSize={11}
            cellGap={2.2}
            fit
          />
        </CardContent>
      </Card>

      <Card className="min-w-0 gap-2 border border-border bg-background p-2 ring-0">
        <CardHeader className="p-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <CardTitle className="text-sm">Difficulty heatmap</CardTitle>
              <p className="mt-0.5 text-2xs text-muted-foreground">
                Highest problem rating solved each day.
              </p>
            </div>
            {!visibleDifficultyActivity.length && (
              <span className="text-xs text-muted-foreground">Unavailable</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="min-w-0 overflow-hidden p-2">
          {visibleDifficultyActivity.length ? (
            <Heatmap
              data={visibleDifficultyActivity}
              startDate={startDate}
              endDate={endDate}
              colors={DIFFICULTY_COLORS}
              emptyColor="var(--heatmap-empty)"
              cellSize={11}
              cellGap={2.2}
              fit
              getColorIndex={(rating) => {
                if (rating < 1000) return 0;
                if (rating < 1300) return 1;
                if (rating < 1600) return 2;
                if (rating < 2000) return 3;
                return 4;
              }}
              renderTooltip={(date, rating) =>
                `${formatDayMonth(date)}: ${rating} difficulty`
              }
            />
          ) : (
            <p className="p-2 text-xs text-muted-foreground">
              No official difficulty data is available for the connected
              platforms.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
