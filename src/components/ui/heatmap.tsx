import { useMemo, useRef, type MouseEvent as ReactMouseEvent } from "react";

import { formatDayMonth } from "@/lib/date";
import { cn } from "@/lib/utils";

interface HeatmapData<T = unknown> {
  date: string;
  count: number;
  meta?: T;
}

interface HeatmapProps<T = unknown> {
  data: HeatmapData<T>[];
  startDate: Date;
  endDate: Date;
  colors: string[];
  emptyColor?: string;
  cellSize?: number;
  cellGap?: number;
  fit?: boolean;
  getColorIndex?: (count: number, maxCount: number) => number;
  renderTooltip?: (date: string, count: number, meta?: T) => string;
  className?: string;
}

const DAYS_IN_WEEK = 7;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TOOLTIP_OFFSET = 13.2;

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getWeekStart(date: Date): Date {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function getDefaultColorIndex(
  count: number,
  maxCount: number,
  colorCount: number,
): number {
  if (count === 0) return -1;
  if (maxCount === 0) return 0;

  const ratio = count / maxCount;
  return Math.min(Math.floor(ratio * colorCount), colorCount - 1);
}

function renderDefaultTooltip(date: string, count: number): string {
  return `${formatDayMonth(date)}: ${count}`;
}

export function Heatmap<T = unknown>({
  data,
  startDate,
  endDate,
  colors,
  emptyColor = "var(--heatmap-empty)",
  cellSize = 13.2,
  cellGap = 3.3,
  fit = false,
  getColorIndex,
  renderTooltip = renderDefaultTooltip,
  className,
}: HeatmapProps<T>) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const { weeks, dataMap, maxCount, monthLabels } = useMemo(() => {
    const entries = new Map<string, HeatmapData<T>>();
    let highestCount = 0;

    for (const entry of data) {
      entries.set(entry.date, entry);
      if (entry.count > highestCount) highestCount = entry.count;
    }

    const weekStart = getWeekStart(startDate);
    const generatedWeeks: Date[][] = [];
    let cursor = weekStart;

    while (cursor <= endDate) {
      const week: Date[] = [];
      for (let day = 0; day < DAYS_IN_WEEK; day += 1) {
        week.push(new Date(cursor));
        cursor = addDays(cursor, 1);
      }
      generatedWeeks.push(week);
    }

    const monthWeekIndex = new Map<string, number>();

    generatedWeeks.forEach((week, weekIndex) => {
      for (const date of week) {
        if (date < startDate || date > endDate) continue;

        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthWeekIndex.has(key)) monthWeekIndex.set(key, weekIndex);
      }
    });

    const labels: { label: string; weekIndex: number }[] = [];
    const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const monthCount =
      (lastMonth.getFullYear() - startDate.getFullYear()) * 12 +
      lastMonth.getMonth() -
      startDate.getMonth();

    for (let offset = 0; offset <= monthCount; offset += 1) {
      const month = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + offset,
        1,
      );
      const key = `${month.getFullYear()}-${month.getMonth()}`;

      labels.push({
        label: MONTH_LABELS[month.getMonth()] ?? "",
        weekIndex: monthWeekIndex.get(key) ?? 0,
      });
    }

    return {
      weeks: generatedWeeks,
      dataMap: entries,
      maxCount: highestCount,
      monthLabels: labels,
    };
  }, [data, startDate, endDate]);

  const totalWidth = weeks.length * (cellSize + cellGap);
  const weekdayLabelWidth = 35.2;
  const gapSize = fit ? 2.2 : cellGap;

  function getCellColor(date: Date): string {
    const count = dataMap.get(toDateKey(date))?.count ?? 0;
    if (count === 0) return emptyColor;

    const index = getColorIndex
      ? getColorIndex(count, maxCount)
      : getDefaultColorIndex(count, maxCount, colors.length);

    return colors[Math.min(index, colors.length - 1)] ?? emptyColor;
  }

  function isInRange(date: Date): boolean {
    return date >= startDate && date <= endDate;
  }

  function handleMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const cell = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-heatmap-date]",
    );
    const date = cell?.dataset.heatmapDate;
    if (!date) {
      tooltip.style.display = "none";
      return;
    }

    const entry = dataMap.get(date);
    tooltip.textContent = renderTooltip(date, entry?.count ?? 0, entry?.meta);
    tooltip.style.display = "block";

    const maxLeft = Math.max(
      TOOLTIP_OFFSET,
      window.innerWidth - tooltip.offsetWidth - TOOLTIP_OFFSET,
    );
    const maxTop = Math.max(
      TOOLTIP_OFFSET,
      window.innerHeight - tooltip.offsetHeight - TOOLTIP_OFFSET,
    );

    tooltip.style.left = `${Math.min(event.clientX + TOOLTIP_OFFSET, maxLeft)}px`;
    tooltip.style.top = `${Math.min(event.clientY + TOOLTIP_OFFSET, maxTop)}px`;
  }

  function handleMouseLeave() {
    if (tooltipRef.current) tooltipRef.current.style.display = "none";
  }

  return (
    <div
      className={cn("relative max-w-full min-w-0 overflow-hidden", className)}
      style={
        fit
          ? { width: "100%", minWidth: 0 }
          : { minWidth: totalWidth + weekdayLabelWidth }
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="text-2xs leading-none text-muted-foreground"
        style={{
          display: "grid",
          gridTemplateColumns: fit
            ? `${weekdayLabelWidth}px repeat(${weeks.length}, minmax(0, 1fr))`
            : `${weekdayLabelWidth}px repeat(${weeks.length}, ${cellSize}px)`,
          gridTemplateRows: fit
            ? `15.4px repeat(${DAYS_IN_WEEK}, auto)`
            : `15.4px repeat(${DAYS_IN_WEEK}, ${cellSize}px)`,
          columnGap: gapSize,
          rowGap: gapSize,
        }}
      >
        {monthLabels.map(({ label, weekIndex }) => (
          <span
            key={`${label}-${weekIndex}`}
            className="self-end whitespace-nowrap"
            style={{
              gridRow: 1,
              gridColumnStart: weekIndex + 2,
              justifySelf: weekIndex >= weeks.length - 2 ? "end" : "start",
            }}
          >
            {label}
          </span>
        ))}

        {WEEKDAY_LABELS.map((label, dayIndex) =>
          label ? (
            <span
              key={label}
              className="self-center justify-self-end pr-1"
              style={{ gridRow: dayIndex + 2, gridColumn: 1 }}
            >
              {label}
            </span>
          ) : null,
        )}

        {weeks.map((week, weekIndex) =>
          week.map((date, dayIndex) => {
            const inRange = isInRange(date);

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                data-heatmap-date={inRange ? toDateKey(date) : undefined}
                className={cn(
                  inRange &&
                    "cursor-pointer transition-all hover:ring-2 hover:ring-foreground/20",
                )}
                style={{
                  gridRow: dayIndex + 2,
                  gridColumn: weekIndex + 2,
                  width: fit ? "100%" : cellSize,
                  height: fit ? undefined : cellSize,
                  aspectRatio: fit ? "1" : undefined,
                  backgroundColor: inRange ? getCellColor(date) : undefined,
                }}
              />
            );
          }),
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
        <span>Less</span>
        <div
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: emptyColor,
          }}
        />
        {colors.map((color) => (
          <div
            key={color}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: color,
            }}
          />
        ))}
        <span>More</span>
      </div>

      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-50 hidden max-w-56 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
      />
    </div>
  );
}
