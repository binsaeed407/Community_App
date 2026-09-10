import Link from "next/link";
import { getSessionUser } from "@/lib/guards";

/**
 * The landing page.
 *
 * It states what the app is for and what currently works, and it links to the
 * things that exist. It gets replaced with the live issue list in Phase 3 —
 * until then, an honest "here is what is built" beats a page that advertises
 * buttons which lead nowhere.
 */
export default async function Home() {
  const user = await getSessionUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          Civic reporting, with receipts
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Community App</h1>
      </div>

      <div className="flex flex-col gap-4 text-lg text-neutral-700 dark:text-neutral-300">
        <p>
          Report a problem in your local area — a pothole, a broken streetlight, uncollected
          rubbish — and follow exactly what happens next.
        </p>
        <p className="text-base text-neutral-600 dark:text-neutral-400">
          Every report gets a public timeline: when it was submitted, who picked it up, what they
          did, and whether it was actually fixed. Status is never overwritten — each change appends
          a row with a required reason, so the history cannot be quietly rewritten. Administrators
          are accountable for handling issues, and citizens are accountable for reporting honestly.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="font-medium text-neutral-900 dark:text-neutral-100">How it works</p>
        <ul className="mt-3 space-y-1.5 text-neutral-600 dark:text-neutral-400">
          <li>
            <span aria-hidden="true">1.</span> Anyone can browse every report, as a list or on a
            map. No account needed.
          </li>
          <li>
            <span aria-hidden="true">2.</span> Sign in to report a problem, with a photo and a pin
            on the map.
          </li>
          <li>
            <span aria-hidden="true">3.</span> An administrator has to give a reason for every
            change, and a photo to close it.
          </li>
          <li>
            <span aria-hidden="true">4.</span> If it is not actually fixed, the person who
            reported it can reopen it — and the original claim stays on the record.
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {user ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Signed in as <span className="font-medium">{user.displayName}</span>
            {user.role === "ADMIN" ? " (administrator)" : ""}.
          </p>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Sign in with a demo account
          </Link>
        )}

        <Link
          href="/issues"
          className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Browse reports
        </Link>

        <Link
          href="/health"
          className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          System status
        </Link>
      </div>
    </main>
  );
}
