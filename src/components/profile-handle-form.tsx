import type { SubmitEvent } from "react";
import { ArrowLeft, RefreshCw, Save, UserRound } from "lucide-react";

import { PlatformLogo } from "@/components/platform-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PlatformHandle, PlatformId } from "@/services/platforms/types";
import { PLATFORM_LABELS } from "@/services/platforms/catalog";

const MAX_HANDLE_LENGTH = 64;

interface ProfileHandleFormProps {
  handles: PlatformHandle[];
  errors: Partial<Record<PlatformId, string>>;
  isFetching: boolean;
  onChange: (platform: PlatformId, handle: string) => void;
  onSave: (event: SubmitEvent<HTMLFormElement>) => void;
  onRefresh: () => void;
}

export function ProfileHandleForm({
  handles,
  errors,
  isFetching,
  onChange,
  onSave,
  onRefresh,
}: ProfileHandleFormProps) {
  return (
    <Card className="gap-2 border border-border bg-background p-2 ring-0">
      <CardHeader className="p-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center bg-primary/10 text-primary">
              <UserRound className="size-3.5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm">Platform handles</CardTitle>
              <CardDescription className="text-xs">
                Handles stay in this browser. Saved results load instantly and
                stay fresh for five minutes. Refresh fetches new data.
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </a>
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={onSave}>
        <CardContent className="grid gap-2 p-2 sm:grid-cols-3">
          {handles.map((item) => (
            <HandleField
              key={item.platform}
              item={item}
              error={errors[item.platform]}
              onChange={onChange}
            />
          ))}
        </CardContent>

        <div className="flex flex-wrap gap-2 px-2 pb-2">
          <Button type="submit" size="sm" disabled={isFetching}>
            <Save className="size-3.5" />
            Save handles
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("size-3.5", isFetching && "animate-spin")}
            />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface HandleFieldProps {
  item: PlatformHandle;
  error?: string;
  onChange: (platform: PlatformId, handle: string) => void;
}

function HandleField({ item, error, onChange }: HandleFieldProps) {
  const inputId = `handle-${item.platform}`;
  const errorId = `${inputId}-error`;
  const label = PLATFORM_LABELS[item.platform];

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        <PlatformLogo platform={item.platform} className="size-4" />
        <Label htmlFor={inputId}>{label}</Label>
      </div>
      <Input
        id={inputId}
        name={item.platform}
        value={item.handle}
        placeholder={`${label} handle`}
        maxLength={MAX_HANDLE_LENGTH}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(item.platform, event.target.value)}
      />
      {error && (
        <p id={errorId} className="text-2xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
