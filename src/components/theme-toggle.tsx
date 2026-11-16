import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

const THEME_KEY = "cptracer-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function applyTheme(dark: boolean) {
  const root = document.documentElement;

  if (root.classList.contains("dark") === dark) {
    emitChange();
    return;
  }

  const update = () => {
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    emitChange();
  };

  // CSS transitions handle the visual change smoothly and synchronously for
  // every element at once. View transitions cause desync and lag on in-page
  // theme toggles because they snapshot and crossfade the whole document.
  update();
}

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function resolveTheme(): boolean {
  const stored = readStoredTheme();

  if (stored === "dark") return true;
  if (stored === "light") return false;

  return window.matchMedia(DARK_QUERY).matches;
}

function setTheme(theme: "light" | "dark") {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }

  applyTheme(theme === "dark");
}

function handleStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== THEME_KEY) return;
  applyTheme(resolveTheme());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  const media = window.matchMedia(DARK_QUERY);

  const handleMediaChange = () => {
    // An explicit choice wins over the system preference.
    if (readStoredTheme() === null) applyTheme(media.matches);
  };

  media.addEventListener("change", handleMediaChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", handleMediaChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="relative flex size-4 items-center justify-center">
        <Sun className="theme-icon theme-icon-sun size-4" />
        <Moon className="theme-icon theme-icon-moon size-4" />
      </span>
    </Button>
  );
}
