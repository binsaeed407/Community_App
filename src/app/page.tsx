export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          Work in progress
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Community App
        </h1>
      </div>

      <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
        Report a problem in your local area — a pothole, a broken streetlight,
        uncollected rubbish — and follow exactly what happens next.
      </p>

      <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
        Every report gets a public timeline: when it was submitted, who picked it
        up, what they did, and whether it was actually fixed. Administrators are
        accountable for handling issues, and citizens are accountable for
        reporting honestly.
      </p>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          Phase 0 —
        </span>{" "}
        foundations. The app is deployed and the database is being wired up.
        Reporting goes live in a later phase.
      </div>
    </main>
  );
}
