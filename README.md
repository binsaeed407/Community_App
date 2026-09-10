# Community App

A civic problem-reporting and accountability platform.

People report problems in their local area — a pothole, a broken streetlight, uncollected
rubbish — and the relevant local administrator reviews, assigns, updates and resolves them.
Every report gets a public timeline, so anyone can see what actually happened after it was
submitted.

**🌍 Live demo: <https://community-app-five-eta.vercel.app>**
([`/health`](https://community-app-five-eta.vercel.app/health) shows the app reading a row from the database.)

> **Status: in development.** Phase 0 (foundations) is complete — the app is live on Vercel,
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
- [ ] **Phase 1 — Data model.** Issues, append-only status history, audit log, seed data.
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
