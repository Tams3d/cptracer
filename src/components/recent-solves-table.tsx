import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RecentSolve } from "@/services/platforms/types";
import { PLATFORM_LABELS } from "@/services/platforms/catalog";

const PAGE_SIZE = 10;

const DIFFICULTY_CLASSES: Record<string, string> = {
  Easy: "text-difficulty-easy",
  Medium: "text-difficulty-medium",
  Hard: "text-difficulty-hard",
};

function getTagColorIndex(tag: string): number {
  let hash = 0;
  for (const character of tag) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return Math.abs(hash) % 6;
}

export function RecentSolvesTable({ solves }: { solves: RecentSolve[] }) {
  const [requestedPage, setRequestedPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(solves.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount - 1);
  const start = page * PAGE_SIZE;
  const rows = solves.slice(start, start + PAGE_SIZE);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="min-w-0 border border-border">
        <Table className="w-full min-w-[37.4rem] table-fixed">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[34%]" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Problem</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Platform</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((solve) => (
              <TableRow key={solve.id}>
                <TableCell className="min-w-0">
                  <a
                    href={solve.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-medium text-primary underline-offset-2 hover:underline"
                    title={solve.name}
                  >
                    {solve.name}
                  </a>
                </TableCell>
                <TableCell className="min-w-0">
                  {solve.tags.length ? (
                    <div
                      className="flex min-w-0 flex-nowrap items-center gap-1"
                      title={solve.tags.join(", ")}
                    >
                      {solve.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            `tag-color-${getTagColorIndex(tag)}`,
                            "min-w-0 truncate border bg-transparent px-1.5 py-1 text-2xs",
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                      {solve.tags.length > 3 && (
                        <span className="shrink-0 text-2xs text-muted-foreground tabular-nums">
                          +{solve.tags.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "tabular-nums",
                    solve.difficulty && DIFFICULTY_CLASSES[solve.difficulty],
                  )}
                >
                  {solve.difficulty ?? "-"}
                </TableCell>
                <TableCell
                  className="truncate text-muted-foreground"
                  title={PLATFORM_LABELS[solve.platform]}
                >
                  {PLATFORM_LABELS[solve.platform]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="text-muted-foreground tabular-nums">
          {solves.length
            ? `${start + 1}-${Math.min(start + PAGE_SIZE, solves.length)} of ${solves.length}`
            : "0 solves"}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label="Previous page"
            onClick={() => setRequestedPage(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="min-w-20 text-center font-medium tabular-nums">
            Page {page + 1} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label="Next page"
            onClick={() => setRequestedPage(page + 1)}
            disabled={page >= pageCount - 1}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
