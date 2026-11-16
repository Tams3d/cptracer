import { RecentSolvesTable } from "@/components/recent-solves-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentSolve } from "@/services/platforms/types";

interface RecentSolvesCardProps {
  solves: RecentSolve[];
}

export function RecentSolvesCard({ solves }: RecentSolvesCardProps) {
  return (
    <Card className="min-w-0 gap-2 border border-border bg-background p-2 ring-0">
      <CardHeader className="p-2">
        <CardTitle className="text-sm">Recently solved</CardTitle>
        <p className="text-2xs text-muted-foreground">
          Latest accepted problems from connected platforms.
        </p>
      </CardHeader>
      <CardContent className="min-w-0 p-2">
        {solves.length ? (
          <RecentSolvesTable solves={solves} />
        ) : (
          <p className="text-xs text-muted-foreground">
            No recent solve data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
