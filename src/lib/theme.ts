export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function resolveIsDark(pref: ThemePreference): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(pref: ThemePreference): void {
  document.documentElement.classList.toggle("dark", resolveIsDark(pref));
}

type Listener = () => void;
let listeners: Listener[] = [];

export function subscribeTheme(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function setStoredTheme(pref: ThemePreference): void {
  if (pref === "system") window.localStorage.removeItem(STORAGE_KEY);
  else window.localStorage.setItem(STORAGE_KEY, pref);
  applyTheme(pref);
  listeners.forEach((l) => l());
}

export function getThemeServerSnapshot(): ThemePreference {
  return "system";
}

// Inlined into a <script> tag rendered before body content, so the theme
// applies before first paint — avoids a flash of the wrong theme on load.
export const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var isDark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;
