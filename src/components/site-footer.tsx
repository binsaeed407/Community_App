import Link from "next/link";

/**
 * The site footer.
 *
 * Restates what the app guarantees, because the claim is the product: the
 * record is append-only. A visitor who lands directly on one issue page from a
 * shared link should be able to find that out without going back to the
 * homepage.
 */

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Browse",
    links: [
      { label: "All issues", href: "/issues" },
      { label: "Map", href: "/issues/map" },
      { label: "Report a problem", href: "/report" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Create an account", href: "/sign-up" },
      { label: "Your profile", href: "/profile" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "System status", href: "/health" },
      { label: "Source code", href: "https://github.com/binsaeed407/Community_App" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface-sunken">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-on-brand"
              >
                C
              </span>
              Community App
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
              Report a problem in your area and follow exactly what happens to it. Every status
              change is appended to a permanent public record with the reason given at the time —
              nothing is ever edited or deleted.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                {column.title}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-faint">
          <p>
            A student project. Demonstration data only — these are not real reports to a real
            council.
          </p>
          <p>
            Map data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              className="underline underline-offset-2 hover:text-brand"
            >
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
        </div>
      </div>
    </footer>
  );
}
