"use client";

import { useSyncExternalStore } from "react";
import { cx } from "@/components/ui";

/**
 * Light / dark / follow-the-system.
 *
 * Three states, not two. "Dark mode on or off" quietly overrides a choice the
 * visitor has already made at the operating-system level, and there is then no
 * way back to it — so following the system is a real option and it is the
 * default.
 *
 * The chosen mode is written to `document.documentElement.dataset.theme`, which
 * flips the CSS `color-scheme` property, which is what `light-dark()` in
 * globals.css reads. Removing the attribute returns to following the system.
 */

export const THEME_STORAGE_KEY = "community-app-theme";

type Theme = "system" | "light" | "dark";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "system", label: "System", icon: "◐" },
  { value: "dark", label: "Dark", icon: "☾" },
];

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/**
 * The store the toggle reads from.
 *
 * localStorage is external state that React does not own, and useSyncExternalStore
 * is the supported way to read it: the server snapshot is always "system", the
 * client snapshot is whatever is stored, and React reconciles the difference
 * after hydration without a mismatch warning.
 *
 * Reading it with useState + useEffect instead means writing state inside an
 * effect purely to re-render — which is the pattern this hook exists to replace.
 */
const THEME_EVENT = "community-app-theme-change";

function subscribe(onChange: () => void) {
  // "storage" fires when ANOTHER tab writes, so changing the theme in one tab
  // updates the others. The custom event covers this tab, which "storage"
  // deliberately does not fire for.
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function readStored(): Theme {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    // Storage can throw outright in a locked-down browser or a private window.
    // A theme preference is not worth a crash.
    return "system";
  }
}

/** What the server renders, before any browser storage exists. */
function readServer(): Theme {
  return "system";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readStored, readServer);

  function choose(next: Theme) {
    apply(next);
    try {
      if (next === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The theme still applies for this page; it just will not survive a reload.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface-sunken p-0.5"
    >
      {OPTIONS.map((option) => {
        const selected = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => choose(option.value)}
            className={cx(
              "grid h-7 w-7 place-items-center rounded-full text-xs transition-colors",
              selected
                ? "bg-brand text-on-brand"
                : "text-ink-faint hover:bg-surface hover:text-ink",
            )}
          >
            <span aria-hidden="true">{option.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Runs before the first paint, so an explicitly chosen theme is applied while
 * the page is still blank rather than a moment after it has been drawn in the
 * wrong colours.
 *
 * It has to be inline and synchronous. An external script, a deferred one, or
 * anything React renders would run after the browser has already painted, and
 * the flash is exactly what this exists to prevent.
 *
 * Deliberately tiny and wrapped in try/catch: it blocks rendering, and it runs
 * before any error boundary exists.
 */
export function ThemeScript() {
  const script = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
