import { cn } from "@/lib/utils";
import type { PlatformId } from "@/services/platforms/types";

const LOGO_SIZE = 20;

// Brand marks live in `public/logos` so they are copied verbatim instead of
// being emitted into both the client and prerender asset directories.
const LOGO_SOURCES = {
  atcoderDark: "/logos/atcoder-dark.png",
  atcoderLight: "/logos/atcoder-light.png",
  codeforces: "/logos/codeforces.svg",
  leetcodeDark: "/logos/leetcode-dark.png",
  leetcodeLight: "/logos/leetcode-light.png",
} as const;

interface PlatformLogoProps {
  platform: PlatformId;
  className?: string;
}

export function PlatformLogo({ platform, className }: PlatformLogoProps) {
  const logoClassName = cn("size-5 shrink-0 object-contain", className);

  if (platform === "codeforces") {
    return (
      <img
        src={LOGO_SOURCES.codeforces}
        alt=""
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        loading="lazy"
        decoding="async"
        className={logoClassName}
      />
    );
  }

  if (platform === "atcoder") {
    return (
      <>
        <img
          src={LOGO_SOURCES.atcoderDark}
          alt=""
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          loading="lazy"
          decoding="async"
          className={cn(logoClassName, "dark:hidden")}
        />
        <img
          src={LOGO_SOURCES.atcoderLight}
          alt=""
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          loading="lazy"
          decoding="async"
          className={cn(logoClassName, "hidden dark:block")}
        />
      </>
    );
  }

  return (
    <>
      <img
        src={LOGO_SOURCES.leetcodeDark}
        alt=""
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        loading="lazy"
        decoding="async"
        className={cn(logoClassName, "dark:hidden")}
      />
      <img
        src={LOGO_SOURCES.leetcodeLight}
        alt=""
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        loading="lazy"
        decoding="async"
        className={cn(logoClassName, "hidden dark:block")}
      />
    </>
  );
}
