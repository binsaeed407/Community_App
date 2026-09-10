import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { signOut } from "@/lib/auth";
import { ButtonLink, cx } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileMenu } from "@/components/profile-menu";
import { MobileNav } from "@/components/mobile-nav";

/**
 * The top bar, on every page.
 *
 * A server component, so it reads the session while rendering rather than
 * fetching it from the browser after the page has painted. That is what avoids
 * the half-second where a signed-in user is shown a "Sign in" button.
 *
 * It spans the full width rather than sitting inside a centred container,
 * because a header that stops short of the screen edges makes the whole app
 * look like it is floating in the middle of a large monitor.
 */
export async function SiteHeader() {
  const user = await getSessionUser();

  // Defined here rather than inside ProfileMenu because `signOut` only runs on
  // the server. The menu is a client component, so it receives the rendered
  // form as a child instead of trying to import a server action it cannot hold.
  const signOutForm = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="w-full rounded-control px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
      >
        Sign out
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        {user ? <MobileNav role={user.role} /> : null}

        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-on-brand"
          >
            C
          </span>
          <span className="hidden sm:inline">Community App</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {/* Kept in the header for signed-out visitors, who have no sidebar. */}
          {!user ? (
            <nav aria-label="Main" className="mr-1 hidden items-center gap-1 sm:flex">
              {[
                { href: "/issues", label: "Issues" },
                { href: "/issues/map", label: "Map" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-control px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <ThemeToggle />

          {user ? (
            <ProfileMenu
              displayName={user.displayName}
              email={user.email}
              role={user.role}
              signOutForm={signOutForm}
            />
          ) : (
            <ButtonLink href="/sign-in" size="sm">
              Sign in
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}

/** Shown under the header on the app pages, as the desktop sidebar's twin. */
export function HeaderSpacer({ className }: { className?: string }) {
  return <div className={cx("h-14", className)} aria-hidden="true" />;
}
