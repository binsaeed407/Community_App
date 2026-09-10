"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { cx } from "@/components/ui";

/**
 * The primary navigation, shared by the desktop sidebar and the mobile drawer.
 *
 * A client component only because it needs `usePathname` to mark the current
 * page. Everything it renders is a plain link, so it still works with no
 * JavaScript — the highlight is the only thing that depends on hydration.
 */

export type NavAudience = "public" | "citizen" | "admin";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Lowest privilege that can see this. */
  audience: NavAudience;
  description?: string;
};

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Browse",
    items: [
      { label: "All issues", href: "/issues", icon: "▤", audience: "public", description: "Every report" },
      { label: "Map", href: "/issues/map", icon: "◎", audience: "public", description: "Reports by location" },
    ],
  },
  {
    title: "You",
    items: [
      { label: "Report a problem", href: "/report", icon: "＋", audience: "citizen" },
      { label: "My reports", href: "/my-reports", icon: "★", audience: "citizen" },
      { label: "Profile", href: "/profile", icon: "◍", audience: "citizen" },
    ],
  },
  {
    title: "Council",
    items: [
      { label: "Triage", href: "/admin", icon: "▦", audience: "admin" },
      { label: "System status", href: "/health", icon: "◈", audience: "admin" },
    ],
  },
];

/** Whether this viewer is allowed to see a given item. */
export function canSee(item: NavItem, role: Role | null): boolean {
  if (item.audience === "public") return true;
  if (item.audience === "citizen") return role !== null;
  return role === "ADMIN";
}

export function AppNav({
  role,
  onNavigate,
}: {
  role: Role | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="flex flex-col gap-6">
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter((item) => canSee(item, role));
        if (items.length === 0) return null;

        return (
          <div key={section.title}>
            <h2 className="px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              {section.title}
            </h2>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {items.map((item) => {
                // `/issues` must not stay highlighted while you are on
                // `/issues/map`, so the parent only matches exactly.
                const active =
                  pathname === item.href ||
                  (item.href !== "/issues" && pathname.startsWith(`${item.href}/`));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex items-center gap-2.5 rounded-control px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand-soft font-medium text-brand"
                          : "text-ink-soft hover:bg-surface-sunken hover:text-ink",
                      )}
                    >
                      <span aria-hidden="true" className="w-4 text-center text-base leading-none">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
