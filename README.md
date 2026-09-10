# Community App

A civic problem-reporting and accountability platform.

People report problems in their local area — a pothole, a broken streetlight, uncollected
rubbish — and the relevant local administrator reviews, assigns, updates and resolves them.
Every report gets a public timeline, so anyone can see what actually happened after it was
submitted.

**🌍 Live demo: <https://community-app-five-eta.vercel.app>**
([`/health`](https://community-app-five-eta.vercel.app/health) shows the app reading a row from the database.)

> **Status: in development.** Phases 0 and 1 are complete — the app is live on Vercel,
> connected to a Postgres database on Neon, and redeploys automatically on every push to `main`.
> Reporting itself goes live in a later phase. See [Roadmap](#roadmap).

---

## Why this project

Most "report a problem" systems are a complaint box: you submit something and it disappears.
The interesting problem isn't storing reports — it's making the system **accountable to both
sides**.

- **Administrators** are accountable for handling issues. Every status change is timestamped
  and attributed, closing an issue requires a reason, and overdue issues are surfaced rather
  than buried.
- **Citizens** are accountable for reporting honestly. Duplicate detection, flagging, and
  moderation exist so the system isn't flooded with noise.

The design consequence is that **issue status is never overwritten**. It's an append-only
history table, and the current status is derived from the most recent entry. Reopening an
issue adds a row rather than resetting one, so nothing is ever quietly erased. That's the
only way a public timeline can actually be trusted.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Frontend and backend in one codebase and one deploy |
| Language | TypeScript (strict) | Catches mistakes at compile time |
| Styling | Tailwind CSS v4 | Styling stays next to the markup |
| Database | PostgreSQL (Neon) | Serverless, scales to zero, wakes on request |
| ORM | Prisma | The schema file doubles as documentation of the data model |
| Maps | Leaflet + OpenStreetMap | No API key, no billing |
| Category suggestion | Hand-written keyword classifier | No API key, no cost, and every decision is explainable |
| Hosting | Vercel | Deploys automatically on every push to `main` |

**Design constraint:** every service used is on a free tier that does not require a credit card,
and none of them suspend the app for inactivity. Total running cost is £0.00.

---

## How the data model works

The interesting part of this project is not storing reports. It is making the system
**accountable** — and that is a data modelling problem before it is a UI problem.

### Status is append-only

If an administrator can quietly edit or delete a status change, the public timeline is theatre
rather than evidence. So status is not a column that gets overwritten.

Every change appends a row to `IssueStatusHistory`, with the actor, the time, and a **required
reason**. The current status is the newest row. Reopening an issue appends a `REOPENED` row rather
than resetting anything, so the earlier history survives it. Nothing in the application ever issues
an `UPDATE` or a `DELETE` against that table.

### The status column on Issue is a cache, and it is kept honest

`Issue.status` does exist, because otherwise "show me every open issue" means a correlated subquery
against the history table for every row. It is a **cache of the newest history row, never the
source of truth**, and the rule that keeps it correct is that it is only ever written inside the
same transaction as the history row it mirrors — never on its own.

That rule is checked rather than trusted. `/health` re-verifies it across the fifty most recently
updated issues on every request, and a test asserts it in CI.

### Ordering by a sequence, not by the clock

The history is ordered by a database-assigned `sequence`, not by `createdAt`.

This was a real bug, found while writing the seed data. An issue reported, acknowledged and
resolved on the same day produced three rows sharing a timestamp, and ordering by `createdAt`
returned them in whatever order Postgres felt like — so the "current status" read back as
`SUBMITTED` while the cache said `RESOLVED`. Timestamps tie; a `SERIAL` cannot.

### The audit log is a different thing from the timeline

`IssueStatusHistory` is the **public** record, written for citizens and rendered on the issue page.
`AuditLog` is the **internal** record: who exercised authority, when, and why. It covers actions
that never appear publicly, and it is written in the same transaction as the action it describes,
so an action cannot exist without its audit entry.

---

## Demo accounts

The demo is seeded with two accounts. These credentials are public on purpose — the point is that
anyone can try the app without registering.

| Role | Email | Password |
|---|---|---|
| Citizen | `demo-citizen@example.com` | `demo1234` |
| Administrator | `demo-admin@example.com` | `demo1234` |

Passwords are stored as bcrypt hashes even for these accounts, because the app must only ever hold
hashes and a seed script is not an excuse to make an exception.

## Running locally

```bash
git clone https://github.com/binsaeed407/Community_App.git
cd Community_App
npm install
```

Copy the example environment file and fill in your own database connection
strings. A free Postgres database from [Neon](https://neon.tech) works:

```bash
cp .env.example .env
```

Neon gives you two connection strings for the same database, and both are
needed. `DATABASE_URL` is the **pooled** one (its host contains `-pooler`) and
is what the app uses at runtime. `DIRECT_URL` is the same URL **without**
`-pooler`, and is used only for migrations — the connection pooler does not
support the locks that schema changes need.

Create the tables and add a row to check the connection:

```bash
npm run db:migrate
npm run db:seed
```

Then start the app:

```bash
npm run dev
```

The app runs at http://localhost:3000, and http://localhost:3000/health confirms
the database connection is working.

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply schema changes to the database |
| `npm run db:seed` | Insert the health-check row |
| `npm run db:studio` | Browse the database in a GUI |

---

## Roadmap

- [x] **Phase 0 — Foundations.** Next.js scaffold, database connection, deployment pipeline.
- [x] **Phase 1 — Data model.** Issues, append-only status history, audit log, seed data.
- [ ] **Phase 2 — Authentication.** Citizen and administrator roles.
- [ ] **Phase 3 — Citizen features.** Submit a report with a photo and location; browse the map.
- [ ] **Phase 4 — Administrator features.** Dashboard, status changes with reasons, public updates.
- [ ] **Phase 5 — Category suggestion.** Suggests a category on submission, always editable by a human.
- [ ] **Phase 6 — Polish.** Tests, accessibility, documentation.

Later: community upvotes, duplicate detection, comments, notifications, analytics.

---

## A note on automated category suggestion

Category suggestion is an **assistive layer, not an authority**. The app suggests a category when
a report is submitted, but a human always makes the final call — the suggestion is pre-filled and
editable, never applied silently. It never rejects a report, never decides priority, and never
applies moderation. If suggestion fails for any reason, reporting still works normally.

The classifier is deliberately **our own code**, not a language-model API: weighted keyword
matching, written and tuned by hand. It costs nothing, needs no network, and every decision it
makes can be explained line by line. It sits behind a `suggestCategory()` interface, so a model-
based classifier could replace it without touching anything else.

---

## Licence

MIT
