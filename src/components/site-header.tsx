import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { signOut } from "@/lib/auth";
import { ButtonLink, Button, Container, cx } from "@/components/ui";

/**
 * The header is a server component, so it reads the session while rendering
 * rather than fetching it from the browser after the page has already painted.
 * That is what avoids the half-second where a signed-in user is shown a
 * "Sign in" button.
 */

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-control px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
    >
      {children}
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-sm">
      <Container>
        <nav aria-label="Main" className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            {/* A mark rather than a logo file: two overlapping pins, drawn in
                CSS. Nothing to load, scales cleanly, and it is one less asset
                to explain the provenance of. */}
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-md bg-ink text-[11px] font-bold text-paper"
            >
              C
            </span>
            <span className="hidden sm:inline">Community App</span>
          </Link>

          <div className="flex items-center gap-1">
            <NavLink href="/issues">Issues</NavLink>
            <NavLink href="/issues/map">Map</NavLink>

            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <NavLink href="/admin">Dashboard</NavLink>
                ) : (
                  <NavLink href="/my-reports">My reports</NavLink>
                )}

                <span className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden="true" />

                {/* The display name, never the email — the same rule the public
                    pages follow, applied to the header too. */}
                <span
                  className={cx(
                    "hidden max-w-[12ch] truncate text-sm text-ink-faint md:inline",
                    user.role === "ADMIN" && "font-medium text-accent",
                  )}
                  title={user.role === "ADMIN" ? "Signed in as an administrator" : undefined}
                >
                  {user.displayName}
                </span>

                {/*
                  Sign-out is a form, not a link, because it changes state. A GET
                  request that ends your session can be triggered by anything that
                  embeds the URL — including an image tag on someone else's page.
                */}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <Button type="submit" variant="ghost" size="sm">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <ButtonLink href="/sign-in" size="sm" className="ml-1">
                Sign in
              </ButtonLink>
            )}
          </div>
        </nav>
      </Container>
    </header>
  );
}
