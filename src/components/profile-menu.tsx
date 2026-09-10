"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Role } from "@/generated/prisma/enums";
import { cx } from "@/components/ui";

/**
 * The account menu in the header.
 *
 * Hand-written rather than a headless-menu dependency, because the behaviour is
 * short enough to read: open on click, close on outside click, close on Escape,
 * and return focus to the button when it closes so a keyboard user is not
 * dropped at the top of the document.
 *
 * Sign-out is a `<form>` passed in from the server component that owns it,
 * because signing out is a state change and must not be a GET request — a link
 * that ends your session can be triggered by any page that embeds the URL.
 */
export function ProfileMenu({
  displayName,
  email,
  role,
  signOutForm,
}: {
  displayName: string;
  email: string;
  role: Role;
  signOutForm: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Initials rather than an avatar image. There is no avatar field on the user,
  // and inventing one would mean an upload flow, a storage bucket and a
  // moderation problem for a decoration.
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-sm transition-colors hover:border-line-strong"
      >
        <span
          aria-hidden="true"
          className={cx(
            "grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold",
            role === "ADMIN" ? "bg-brand text-on-brand" : "bg-surface-sunken text-ink-soft",
          )}
        >
          {initials}
        </span>
        <span className="hidden max-w-[10ch] truncate sm:inline">{displayName}</span>
        <span aria-hidden="true" className="text-[10px] text-ink-faint">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-card border border-line bg-surface-raised shadow-raised"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {/* The email appears here and nowhere else in the app — this is the
                one screen where you are looking at your own account. */}
            <p className="truncate text-xs text-ink-faint">{email}</p>
            <span
              className={cx(
                "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                role === "ADMIN"
                  ? "bg-brand-soft text-brand"
                  : "bg-surface-sunken text-ink-soft",
              )}
            >
              {role === "ADMIN" ? "Administrator" : "Resident"}
            </span>
          </div>

          <div className="flex flex-col p-1.5">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-control px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              Your profile
            </Link>
            <Link
              href="/my-reports"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-control px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              My reports
            </Link>
            {role === "ADMIN" ? (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="rounded-control px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                Triage dashboard
              </Link>
            ) : null}
          </div>

          <div className="border-t border-line p-1.5">{signOutForm}</div>
        </div>
      ) : null}
    </div>
  );
}
