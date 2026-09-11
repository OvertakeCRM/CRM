"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import {
  applyTheme,
  getStoredTheme,
  getThemeServerSnapshot,
  setStoredTheme,
  subscribeTheme,
  type ThemePreference,
} from "@/lib/theme";

const ORDER: ThemePreference[] = ["light", "dark", "system"];
const ICONS = { light: Sun, dark: Moon, system: MonitorSmartphone };
const LABELS = { light: "Light", dark: "Dark", system: "System" };

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const pref = useSyncExternalStore(subscribeTheme, getStoredTheme, getThemeServerSnapshot);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    setStoredTheme(next);
  }

  const Icon = ICONS[pref];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[pref]}. Click to change.`}
      title={`Theme: ${LABELS[pref]}`}
      className={`flex items-center gap-1.5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 ${className}`}
    >
      <Icon size={18} />
    </button>
  );
}
