"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useHydrated } from "@/lib/use-hydrated";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  THEME_STORAGE_KEY,
  isThemePreference,
  resolveTheme,
  type ThemePreference,
} from "./theme";

let inMemoryPreference: ThemePreference | undefined;
const CHANGE_EVENT = "wallet-theme-change";

function readPreference(): ThemePreference {
  if (inMemoryPreference) return inMemoryPreference;
  try {
    const preference = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(preference) ? preference : "system";
  } catch {
    return "system";
  }
}

function applyPreference() {
  const theme = resolveTheme(
    readPreference(),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const update = () => {
    applyPreference();
    onChange();
  };
  const storage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      inMemoryPreference = undefined;
      update();
    }
  };
  window.addEventListener(CHANGE_EVENT, update);
  window.addEventListener("storage", storage);
  media.addEventListener("change", update);
  return () => {
    window.removeEventListener(CHANGE_EVENT, update);
    window.removeEventListener("storage", storage);
    media.removeEventListener("change", update);
  };
}

export function ThemeMenu() {
  const hydrated = useHydrated();
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    () => "system" as const,
  );
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  useEffect(applyPreference, []);
  const Icon =
    preference === "dark" ? Moon : preference === "light" ? Sun : Monitor;

  function changePreference(value: string) {
    if (!isThemePreference(value)) return;
    inMemoryPreference = value;
    let failed = false;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      failed = true;
    }
    setStorageUnavailable(failed);
    applyPreference();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div className="theme-control">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={!hydrated}
            aria-label="Color theme"
            className="theme-menu-button rounded-full"
          >
            <Icon aria-hidden="true" />
            <span className="theme-menu-label">
              {preference === "system"
                ? "System"
                : preference === "light"
                  ? "Light"
                  : "Dark"}
            </span>
            <ChevronDown aria-hidden="true" className="theme-menu-chevron" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={preference}
            onValueChange={changePreference}
            aria-label="Color theme"
          >
            <DropdownMenuRadioItem value="system">
              <Monitor aria-hidden="true" />
              System
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light">
              <Sun aria-hidden="true" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon aria-hidden="true" />
              Dark
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {storageUnavailable && (
        <span className="theme-storage-note" role="status">
          Theme applies for this visit; browser storage is unavailable.
        </span>
      )}
    </div>
  );
}
