"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/generated/prisma/enums";
import { AppNav } from "@/components/app-nav";

/**
 * The sidebar, as a drawer, for screens too narrow to hold it permanently.
 *
 * Below the large breakpoint the sidebar is hidden and this button opens the
 * same navigation over the page. Both render the identical <AppNav>, so there
 * is one list of links rather than a desktop copy and a mobile copy that drift.
 */
export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    // Stop the page behind the drawer scrolling when a touch drags past its
    // edge — otherwise the drawer feels like it is floating on a moving page.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-control border border-line text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink lg:hidden"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ☰
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto border-r border-line bg-surface p-4 shadow-raised">
            <div className="flex items-center justify-between">
              <span className="font-semibold tracking-tight">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="grid h-8 w-8 place-items-center rounded-control text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <AppNav role={role} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
