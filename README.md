# Community App

A civic problem-reporting and accountability platform.

People report problems in their local area — a pothole, a broken streetlight, uncollected
rubbish — and the relevant administrator reviews, updates and resolves them. Every report gets a
public timeline, so anyone can see what actually happened after it was submitted.

**🌍 Live demo: <https://community-app-five-eta.vercel.app>**

| Sign in as | Email | Password |
|---|---|---|
| Citizen | `demo-citizen@example.com` | `demo1234` |
| Administrator | `demo-admin@example.com` | `demo1234` |

These credentials are public on purpose — the point is that you can try the whole thing without
registering. Browsing reports needs no account at all.

---

## Why this project

Plenty of councils have a "report a pothole" form. What almost none of them have is a way for you
to find out what happened next. The report goes in, and you either notice the repair one day or
you don't.

The interesting problem here is not storing reports. It is **making the system accountable in both
directions**: administrators are accountable for how they handle issues, and citizens are
accountable for reporting honestly. That turns out to be a data modelling problem before it is a
user interface problem, and it is what most of the design below is about.

---

## What it does

**As a resident**, without an account: browse every report as a list or on a map, filter by status
and category, and open any one of them to read its full history.

**With an account**: report a problem — category, description, a pin on a map, up to three
photos — and follow it. If it gets marked resolved and it is not actually fixed, you can reopen it
and say why.

**As an administrator**: a dashboard of what needs a decision, what is being worked on, what has
been waiting too long, and what was recently closed. Moving an issue between statuses requires
writing a reason, and marking something resolved requires a photo of the finished work.

---

## Architecture

```
                        ┌──────────────────────────────┐
   Browser              │        Vercel (Next.js)      │
   ───────              │                              │
   Leaflet map  ───────▶│  Server Components           │
   (client only)        │    ├─ /issues     public     │
                        │    ├─ /issues/:id timeline   │
   Report form  ───────▶│    ├─ /report     guarded    │
   (server action)      │    └─ /admin      admin only │
                        │                              │
                        │  middleware  ── route guard  │
                        │  server actions ── mutations │
                        │      │                       │
                        └──────┼───────────────────────┘
                               │ Prisma 7 + adapter-pg
                               ▼
                        ┌──────────────────────────────┐
                        │   Neon Postgres (eu-west-2)  │
                        │                              │
                        │   User · Category · Issue    │
                        │   IssueStatusHistory ◀── the │
                        │   AuditLog · Attachment      │
                        │   AIAnalysis                 │
                        └──────────────────────────────┘

   Photos never pass through the server:
   browser ──▶ /api/uploads/sign ──▶ browser ──▶ Cloudinary
```

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Frontend and backend in one codebase and one deploy |
| Language | TypeScript, strict | Catches mistakes at compile time |
| Styling | Tailwind CSS v4 | Styling stays next to the markup |
| Database | PostgreSQL on Neon | Free, and scales to zero without *pausing* — the demo is still alive months later |
| ORM | Prisma 7 with `@prisma/adapter-pg` | The schema file doubles as documentation of the data model |
| Auth | Auth.js v5, credentials + bcryptjs | So the login path is something I can explain, not a black box |
| Validation | Zod | One definition of valid input, shared by the form and the server |
| Maps | Leaflet + OpenStreetMap | No API key, no credit card, no billing risk |
| Photos | Cloudinary, signed uploads | The file never touches our server |
| Category suggestion | A keyword classifier I wrote | No API key, no cost, and every decision is explainable |
| Tests | Vitest | 45 tests on the rules that are easy to break by accident |
| Hosting | Vercel | Every push to `main` is live in about a minute |

**Total running cost: £0.00.** Every service is on a free tier that does not require a card, and
none of them suspend the app for inactivity.

---

## How the data model works

### Status is append-only

If an administrator can quietly edit or delete a status change, the public timeline is theatre
rather than evidence. So status is not a column that gets overwritten.

Every change appends a row to `IssueStatusHistory` with the actor, the time, and a **required
reason**. The current status is the newest row. Reopening an issue appends a `REOPENED` row rather
than resetting anything, so the resolution being contested stays visible above the objection.
Nothing in the application ever issues an `UPDATE` or a `DELETE` against that table.

### `Issue.status` is a cache, and it is kept honest

`Issue.status` does exist, because otherwise "show me every open issue" means a correlated
subquery for every row. It is a **cache of the newest history row, never the source of truth**, and
the rule that keeps it correct is that it is only ever written inside the same transaction as the
history row it mirrors — never on its own.

That rule is checked rather than trusted. [`/health`](https://community-app-five-eta.vercel.app/health)
re-verifies it across the fifty most recently updated issues on every request, and a test asserts
it against the whole table.

### Ordering by a sequence, not by the clock

The history is ordered by a database-assigned `sequence`, not by `createdAt`.

This was a real bug, found while writing the seed data. An issue reported, acknowledged and
resolved on the same day produced three rows sharing a timestamp, and ordering by `createdAt`
returned them in whatever order Postgres felt like — so the derived status read `SUBMITTED` while
the cache said `RESOLVED`. **Timestamps tie; a `SERIAL` cannot.**

### The audit log is a different thing from the timeline

`IssueStatusHistory` is the **public** record, written for citizens and rendered on the issue page.
`AuditLog` is the **internal** record: who exercised authority, when, and why. It is written in the
same transaction as the action it describes, so an action cannot exist without its audit entry.

### Who is allowed to do what

Transitions live in [`src/lib/transitions.ts`](src/lib/transitions.ts) as a plain lookup table, so
the rules can be read in one sitting and tested exhaustively. Two of them are worth stating:

- **An administrator cannot reopen an issue they resolved.** That is the reporter's call. An
  outcome you can withdraw at will is not an outcome.
- **A citizen's only power over status is to reopen their own report.** Enough to contest a
  result, not enough to drive the workflow.

---

## Security notes

Things that are deliberate rather than accidental:

- **Middleware is not authorisation.** It guards page navigations; a server action is an endpoint
  anyone can post to directly. Every mutation calls `requireUser()` or `requireAdmin()` as its
  first line.
- **Sign-in failures are indistinguishable.** Unknown email and wrong password return the same
  message, and an unknown email still runs a bcrypt comparison against a dummy hash — otherwise
  the timing difference is itself a way to enumerate accounts.
- **The role is never read from a form.** Registration hardcodes `CITIZEN`.
- **Reporter emails never leave the database.** One shared `select` decides what the public pages
  receive, and a test asserts it still returns only `id` and `displayName`.
- **Photo URLs are restricted to `https://res.cloudinary.com`.** `z.url()` alone accepts
  `javascript:alert(1)`, which a test caught.
- **Cloudinary's API secret stays on the server.** The browser gets a signature valid for one
  upload with the folder and timestamp already fixed.
- **Rate limiting is a database count** — five reports per account per hour. No Redis. It counts
  per account rather than per IP, which is worth knowing about.

---

## Running locally

You need Node 20.9+ and a PostgreSQL database. [Neon](https://neon.tech) is free and needs no card.

```bash
git clone https://github.com/binsaeed407/Community_App.git
cd Community_App
npm install
cp .env.example .env      # then fill it in — see below
npm run db:migrate        # creates the tables
npm run db:seed           # categories, demo accounts, 15 sample reports
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** connection string (the host contains `-pooler`) |
| `DIRECT_URL` | yes | The same database **without** `-pooler`. Migrations need it: the pooler does not support the advisory locks `prisma migrate` takes |
| `AUTH_SECRET` | yes | Any random 32-byte string. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `CLOUDINARY_CLOUD_NAME` | no | Photo uploads. Without these three the app works fine and reports are text-only |
| `CLOUDINARY_API_KEY` | no | |
| `CLOUDINARY_API_SECRET` | no | Server-only. Never prefix this `NEXT_PUBLIC_` |

### Useful commands

```bash
npm run dev         # development server
npm run build       # production build
npm start           # run the production build locally
npm test            # 45 tests
npm run lint        # eslint
npm run db:migrate  # apply schema changes
npm run db:seed     # reset the demo data
npm run db:studio   # browse the database
```

---

## Tests

45 tests, deliberately narrow: pure functions, validation rules, and one file that checks the
database. Rendering React in a fake DOM to assert that a heading says "Sign in" would cost more to
maintain than it could catch.

What they cover, and why each one exists:

- **Validation** — including that emails are normalised *before* being validated, because
  `z.email().trim()` rejects an address pasted with a trailing space rather than cleaning it.
- **Coordinates** — `0, 0` is in the Atlantic and is exactly what a form posts when a hidden field
  was never populated.
- **Photo URLs** — that `javascript:alert(1)` is rejected.
- **Transitions** — every status against every actor, including that nobody may transition an
  issue to the status it is already in.
- **Overdue** — measured from the report, not the last update, so an issue cannot be kept
  permanently "not overdue" by commenting on it every six days.
- **The classifier** — 13 of the 15 sample reports categorised correctly.
- **Stored data** — that no issue's status cache disagrees with its history, that no issue exists
  without history, and that the public query still exposes no email address.

---

## Automated category suggestion

The app suggests a category from what you type. The suggestion is pre-filled and clearly labelled,
it is always editable, and once you choose for yourself nothing overrules you again. If it fails,
the form still submits.

The classifier is **my own code**, not a language-model API: weighted keyword matching, about a
hundred lines, in [`src/lib/classify/rules.ts`](src/lib/classify/rules.ts). It costs nothing, needs
no network, and every decision it makes can be traced to a specific line. A wrong suggestion here
can be fixed; a wrong suggestion from a model can only be prompted at.

It gets **13 of the 15** sample reports right. Both misses are genuinely ambiguous — an overgrown
hedge blocking a pavement is arguably a parks problem, and a car parked across a dropped kerb is
not really any of the eight categories — and both came out at low confidence, which is the system
reporting uncertainty rather than being confidently wrong. Below a confidence of 0.35 it suggests
nothing at all, because a bad guess is worse than no guess.

Every suggestion is stored in `AIAnalysis` along with whether the user kept it, so the accuracy
figure above is a measurement rather than a claim.

It sits behind a `suggestCategory()` interface, so swapping in a model-backed classifier later is a
change to one file.

---

## What I learned

**Writing the seed data found a bug in my own design.** I wrote a throwaway script to check that
`Issue.status` always matched the newest history row, and it failed — three rows sharing a
timestamp came back in an arbitrary order. I had been treating "ordered by time" and "ordered by
insertion" as the same thing. They are not, and for an append-only log only the second one is
correct.

**Tests are most useful when they fail immediately.** Three of the tests here caught real problems
the first time they ran: the email normalisation, the `javascript:` URL, and the coordinate
bounds. None of those were things I set out to find.

**A missing environment variable is a deployment bug, not a code bug.** Twice — `DATABASE_URL`, then
`AUTH_SECRET` — everything worked locally and failed in production for the same reason. Now the
`.env.example` lists every variable and says which are required.

**Framework rules are not suggestions.** A file marked `"use server"` may only export async
functions. I exported a constant from four of them, which does not fail the build; it fails at
runtime, in production, with an error message that points nowhere near the cause.

**Deploying on day one was the single best decision.** Every deployment problem I hit was caused by
the change I had just made, because everything before it was already known to work.

---

## Roadmap

- [x] **Phase 0 — Foundations.** Next.js scaffold, database connection, deployment pipeline.
- [x] **Phase 1 — Data model.** Issues, append-only status history, audit log, seed data.
- [x] **Phase 2 — Authentication.** Citizen and administrator roles.
- [x] **Phase 3 — Citizen features.** Report with photo and location; browse the list and map.
- [x] **Phase 4 — Administrator features.** Dashboard, status changes with reasons, evidence.
- [x] **Phase 5 — Category suggestion.** Suggests a category, always editable by a human.
- [x] **Phase 6 — Polish.** Tests, accessibility, documentation.

Not built, and deliberately so: upvotes, duplicate detection, comments, notifications, analytics.
Each one is a reasonable idea and none of them make the accountability argument any stronger.

---

## Licence

MIT.
