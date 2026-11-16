import { useMemo, useState, type SubmitEvent } from "react";

import { ProfileCard, ProfileErrorCard } from "@/components/profile-cards";
import { ProfileHandleForm } from "@/components/profile-handle-form";
import { Card, CardContent } from "@/components/ui/card";
import { usePlatformHandles } from "@/hooks/use-platform-handles";
import { usePlatformProfiles } from "@/hooks/use-platform-profiles";
import { savePlatformHandles } from "@/services/platform-profile-storage";
import type { PlatformHandle, PlatformId } from "@/services/platforms/types";

export function ProfilePage() {
  const storedHandles = usePlatformHandles();
  const [edits, setEdits] = useState<Partial<Record<PlatformId, string>>>({});
  const { profiles, errors, isFetching, refresh } =
    usePlatformProfiles(storedHandles);

  const handles = useMemo<PlatformHandle[]>(
    () =>
      storedHandles.map((item) => ({
        platform: item.platform,
        handle: edits[item.platform] ?? item.handle,
      })),
    [storedHandles, edits],
  );

  const errorEntries = Object.entries(errors) as [PlatformId, string][];

  function updateHandle(platform: PlatformId, handle: string) {
    setEdits((current) => ({ ...current, [platform]: handle }));
  }

  function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    savePlatformHandles(handles);
    setEdits({});
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <ProfileHandleForm
        handles={handles}
        errors={errors}
        isFetching={isFetching}
        onChange={updateHandle}
        onSave={handleSave}
        onRefresh={refresh}
      />

      {(profiles.length > 0 || errorEntries.length > 0) && (
        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.platform} profile={profile} />
          ))}
          {errorEntries.map(([platform, message]) => (
            <ProfileErrorCard
              key={platform}
              platform={platform}
              message={message}
            />
          ))}
        </section>
      )}

      {profiles.length === 0 && errorEntries.length === 0 && (
        <Card className="gap-2 border border-border bg-background p-2 ring-0">
          <CardContent className="p-2 text-xs text-muted-foreground">
            Add a handle above to load ratings, solved counts, and recent
            activity.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
