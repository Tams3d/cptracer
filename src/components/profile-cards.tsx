import { ExternalLink } from "lucide-react";

import { PlatformLogo } from "@/components/platform-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlatformId, PlatformProfile } from "@/services/platforms/types";
import { PLATFORM_LABELS } from "@/services/platforms/catalog";

export function ProfileCard({ profile }: { profile: PlatformProfile }) {
  return (
    <Card className="gap-2 border border-border bg-background p-2 ring-0">
      <CardHeader className="p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <PlatformLogo platform={profile.platform} />
            <div className="min-w-0">
              <CardTitle className="text-sm">
                {PLATFORM_LABELS[profile.platform]}
              </CardTitle>
              <CardDescription className="truncate text-xs">
                {profile.handle}
              </CardDescription>
            </div>
          </div>
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${PLATFORM_LABELS[profile.platform]} profile`}
            className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-1 p-2">
        {profile.rating && <Metric label="Rating" value={profile.rating} />}
        {profile.rank && <Metric label="Rank" value={profile.rank} />}
        {profile.solved && <Metric label="Solved" value={profile.solved} />}
        {profile.extra && <Metric label="Points" value={profile.extra} />}
        {!profile.rating &&
          !profile.rank &&
          !profile.solved &&
          !profile.extra && (
            <span className="text-2xs text-muted-foreground">
              No public statistics available.
            </span>
          )}
      </CardContent>
    </Card>
  );
}

export function ProfileErrorCard({
  platform,
  message,
}: {
  platform: PlatformId;
  message: string;
}) {
  return (
    <Card className="gap-2 border border-border bg-background p-2 ring-0">
      <CardHeader className="p-2">
        <div className="flex items-center gap-2">
          <PlatformLogo platform={platform} />
          <div className="min-w-0">
            <CardTitle className="text-sm">
              {PLATFORM_LABELS[platform]}
            </CardTitle>
            <CardDescription className="text-xs">Unavailable</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 text-2xs text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 border-r border-border pr-2 text-2xs last:border-0 last:pr-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
