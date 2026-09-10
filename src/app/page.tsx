import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { db } from "@/lib/db";
import { ButtonLink, Card, Container, Stat } from "@/components/ui";

/**
 * The landing page.
 *
 * It has one job: explain in about ten seconds why this is different from every
 * other "report a pothole" form, and get the visitor into the issue list.
 *
 * The counts are read live rather than hardcoded. A number on a landing page
 * that does not move is decoration; one that matches what you find when you
 * click through is evidence.
 */
async function getHeadlineNumbers() {
  try {
    const [issues, updates, resolved] = await Promise.all([
      db.issue.count(),
      db.issueStatusHistory.count(),
      db.issue.count({ where: { status: "RESOLVED" } }),
    ]);
    return { issues, updates, resolved };
  } catch {
    // The landing page must render even if the database is unreachable. A
    // homepage that 500s because a count failed is a worse outcome than one
    // that quietly omits three numbers.
    return null;
  }
}

const STEPS = [
  {
    n: "01",
    title: "Anyone can look",
    body: "The issue list and the map need no account. Reading what your council has been asked to fix should not require signing up.",
  },
  {
    n: "02",
    title: "Report it in a minute",
    body: "A category, a description, a pin on the map and a photo. The category is suggested from what you write, and you can always change it.",
  },
  {
    n: "03",
    title: "Every change needs a reason",
    body: "An administrator cannot move an issue without writing why, and cannot mark it resolved without a photo of the finished work.",
  },
  {
    n: "04",
    title: "Nothing can be quietly rewritten",
    body: "Status is never overwritten — each change appends to a permanent record. If it is not actually fixed, you reopen it, and the original claim stays visible above your objection.",
  },
];

export default async function Home() {
  const [user, numbers] = await Promise.all([getSessionUser(), getHeadlineNumbers()]);

  return (
    <div className="flex flex-1 flex-col">
      {/* ------------------------------------------------------------ hero */}
      <section className="border-b border-line bg-surface">
        <Container className="py-16 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Civic reporting, with receipts
          </p>

          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Report a problem. Then actually find out what happened to it.
          </h1>

          <p className="prose-body mt-6 text-lg text-ink-soft">
            Most councils will let you report a pothole. Almost none will tell you what happened
            next. This one keeps a public, permanent record of every decision — who made it, when,
            and the reason they gave.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/issues">Browse every report</ButtonLink>
            {user ? (
              <ButtonLink href="/report" variant="secondary">
                Report a problem
              </ButtonLink>
            ) : (
              <ButtonLink href="/sign-in" variant="secondary">
                Sign in with a demo account
              </ButtonLink>
            )}
          </div>

          {numbers ? (
            <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6 border-t border-line pt-8">
              <Stat label="Reports" value={numbers.issues} />
              <Stat label="Recorded updates" value={numbers.updates} />
              <Stat label="Resolved" value={numbers.resolved} />
              <Stat label="Deleted, ever" value="0" />
            </div>
          ) : null}
        </Container>
      </section>

      {/* ----------------------------------------------------------- steps */}
      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {STEPS.map((step) => (
              <li key={step.n}>
                <Card className="h-full p-6">
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs font-semibold tracking-widest text-accent"
                  >
                    {step.n}
                  </span>
                  <h3 className="mt-3 font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* --------------------------------------------------- the argument */}
      <section className="border-t border-line bg-surface-sunken py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              Why the record is append-only
            </h2>
            <p className="prose-body mt-4 text-ink-soft">
              If an administrator can quietly edit or delete a status change, then the public
              timeline is theatre rather than evidence — and a transparency tool that can be
              rewritten is worse than none, because it looks like proof.
            </p>
            <p className="prose-body mt-4 text-ink-soft">
              So status is not a field this app overwrites. Every change appends a row with the
              actor, the time and a required reason. Reopening an issue adds to the record instead
              of resetting it, so a resolution someone disagrees with stays visible next to the
              disagreement. It costs more code. It is the only version where the timeline can be
              trusted.
            </p>
            <p className="mt-6 text-sm">
              <Link href="/health" className="font-medium text-accent underline underline-offset-4">
                See the live consistency check
              </Link>
              <span className="text-ink-faint">
                {" "}
                — the app re-verifies that claim against its own database on every request.
              </span>
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
