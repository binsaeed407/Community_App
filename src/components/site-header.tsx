import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { signOut } from "@/lib/auth";

/**
 * The header is a server component, so it reads the session directly rather
 * than fetching it from the client after the page has already painted. That
 * avoids the flash of a signed-out header on a signed-in page.
 */
export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4"
      >
        <Link href="/" className="font-semibold tracking-tight">
          Community App
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/issues"
            className="text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Issues
          </Link>

          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/my-reports"
                  className="text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  My reports
                </Link>
              )}

              {/* The display name, never the email — the same rule the public
                  pages follow, applied to the header too. */}
              <span className="hidden text-neutral-500 sm:inline">{user.displayName}</span>

              {/*
                Sign-out is a form rather than a link because it changes state.
                A GET request that logs you out can be triggered by any page that
                embeds the URL, which is how you end up signed out by an image tag.
              */}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
