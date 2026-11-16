import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays, formatDayMonth, getToday, toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import type {
  PlatformActivity,
  PlatformId,
  PlatformProfile,
} from "@/services/platforms/types";
import { PLATFORM_IDS, PLATFORM_LABELS } from "@/services/platforms/catalog";

// Palette tokens keep each platform identifiable in both themes.
const PLATFORM_COLORS: Record<PlatformId, string> = {
  codeforces: "var(--chart-codeforces)",
  atcoder: "var(--chart-atcoder)",
  leetcode: "var(--chart-leetcode)",
};

const TREND_RANGES = [
  {
    id: "default",
    label: "Default",
    days: 0,
    description: "the last 30 active days",
  },
  { id: "1m", label: "1M", days: 30, description: "the last 30 days" },
  { id: "3m", label: "3M", days: 90, description: "the last 3 months" },
  { id: "1y", label: "1Y", days: 365, description: "the last 12 months" },
] as const;

type TrendRangeId = (typeof TREND_RANGES)[number]["id"];
type SeriesKey = "total" | PlatformId;
type TrendRow = Record<string, number | string>;

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--popover-foreground)",
  fontSize: 12.1,
} as const;

interface RecentTrendCardProps {
  profiles: PlatformProfile[];
  activity: PlatformActivity[];
}

export function RecentTrendCard({ profiles, activity }: RecentTrendCardProps) {
  const [hidden, setHidden] = useState<ReadonlySet<SeriesKey>>(() => new Set());
  const [rangeId, setRangeId] = useState<TrendRangeId>("default");

  const range =
    TREND_RANGES.find((option) => option.id === rangeId) ?? TREND_RANGES[0];

  const { lineData, platforms, availablePlatforms } = useMemo(() => {
    const countsByPlatform = new Map<PlatformId, Map<string, number>>();

    for (const profile of profiles) {
      const counts = countsByPlatform.get(profile.platform) ?? new Map();
      for (const entry of profile.activity ?? []) {
        const count = Number(entry.count);
        if (!Number.isFinite(count) || count <= 0) continue;
        counts.set(entry.date, (counts.get(entry.date) ?? 0) + count);
      }
      countsByPlatform.set(profile.platform, counts);
    }

    const connectedPlatforms = PLATFORM_IDS.filter((platform) =>
      countsByPlatform.has(platform),
    );

    // A connected platform can still return no activity (rate limit, empty
    // history, or a platform without a usable activity feed). Keep its legend
    // entry visible but disabled instead of drawing a flat line with no data.
    const available = connectedPlatforms.filter(
      (platform) => (countsByPlatform.get(platform)?.size ?? 0) > 0,
    );

    const buildRow = (date: string): TrendRow => {
      const row: TrendRow = { date: formatDayMonth(date) };
      let total = 0;

      for (const platform of available) {
        const count = countsByPlatform.get(platform)?.get(date) ?? 0;
        row[platform] = count;
        total += count;
      }

      row.total = total;
      return row;
    };

    if (range.days === 0) {
      return {
        lineData: activity.slice(-30).map(({ date }) => buildRow(date)),
        platforms: connectedPlatforms,
        availablePlatforms: available,
      };
    }

    const end = getToday();
    const start = addDays(end, -(range.days - 1));
    const rows: TrendRow[] = [];

    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      rows.push(buildRow(toDateKey(cursor)));
    }

    return {
      lineData: rows,
      platforms: connectedPlatforms,
      availablePlatforms: available,
    };
  }, [activity, profiles, range.days]);

  const series = useMemo(() => {
    const available = new Set(availablePlatforms);

    return [
      {
        key: "total" as const,
        label: "Total",
        color: "var(--chart-total)",
        available: true,
      },
      ...platforms.map((platform) => ({
        key: platform,
        label: PLATFORM_LABELS[platform],
        color: PLATFORM_COLORS[platform],
        available: available.has(platform),
      })),
    ];
  }, [availablePlatforms, platforms]);

  function toggleSeries(key: SeriesKey) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Recharts paints in DOM order, so the series are reversed below to keep
  // Total above the platform lines where they overlap.
  return (
    <Card className="min-w-0 gap-2 border border-border bg-background p-2 ring-0">
      <CardHeader className="p-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm">Recent trend</CardTitle>
            <p className="text-2xs text-muted-foreground">
              Daily accepted submissions over {range.description}.
            </p>
          </div>

          <fieldset className="flex shrink-0 items-center gap-1">
            <legend className="sr-only">Trend range</legend>
            {TREND_RANGES.map((option) => {
              const active = option.id === rangeId;

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  title={`Show ${option.description}`}
                  onClick={() => setRangeId(option.id)}
                  className={cn(
                    "h-6 border px-2 text-[0.756rem] font-medium transition-colors",
                    "hover:border-border hover:bg-muted hover:text-foreground",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "border-border bg-accent text-accent-foreground"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </fieldset>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 p-2">
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          {series.map(({ key, label, color, available }) => {
            const visible = !hidden.has(key);

            return (
              <button
                key={key}
                type="button"
                role="switch"
                aria-checked={visible}
                aria-label={
                  available
                    ? undefined
                    : `${label} activity data is unavailable`
                }
                disabled={!available}
                title={
                  available
                    ? undefined
                    : `${label} activity data is unavailable`
                }
                onClick={() => toggleSeries(key)}
                className={cn(
                  "inline-flex h-6 items-center gap-2 border border-transparent px-2 text-[0.756rem] font-medium transition-colors",
                  available
                    ? [
                        "hover:border-border hover:bg-muted hover:text-foreground",
                        "active:border-border active:bg-accent active:text-accent-foreground",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        visible
                          ? "text-foreground"
                          : "text-muted-foreground opacity-40",
                      ]
                    : "cursor-not-allowed text-muted-foreground opacity-40",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            );
          })}
        </div>

        <div className="h-48 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lineData}
              margin={{ top: 8.8, right: 8.8, bottom: 0, left: -17.6 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={range.days === 0 ? 5 : 24}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "var(--foreground)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
              />
              {series
                .filter((item) => item.available)
                .toReversed()
                .map(({ key, label, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={label}
                    stroke={color}
                    strokeWidth={key === "total" ? 2.75 : 1.925}
                    dot={false}
                    hide={hidden.has(key)}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
