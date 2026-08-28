# Community App

A civic problem-reporting and accountability platform.

People report problems in their local area — a pothole, a broken streetlight, uncollected
rubbish — and the relevant local administrator reviews, assigns, updates and resolves them.
Every report gets a public timeline, so anyone can see what actually happened after it was
submitted.

> **Status: in development.** Phase 0 (foundations) — the app is deployed and the database
> layer is being wired up. Reporting goes live in a later phase. See [Roadmap](#roadmap).

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
| AI | Claude (Haiku) | Suggests a category from the description — always editable |
| Hosting | Vercel | Deploys automatically on every push to `main` |

**Design constraint:** every service used is on a free tier that does not require a credit
card, and none of them suspend the app for inactivity.

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

- [ ] **Phase 0 — Foundations.** Next.js scaffold, database connection, deployment pipeline.
- [ ] **Phase 1 — Data model.** Issues, append-only status history, audit log, seed data.
- [ ] **Phase 2 — Authentication.** Citizen and administrator roles.
- [ ] **Phase 3 — Citizen features.** Submit a report with a photo and location; browse the map.
- [ ] **Phase 4 — Administrator features.** Dashboard, status changes with reasons, public updates.
- [ ] **Phase 5 — AI assistance.** Category suggestion on submission, always editable by a human.
- [ ] **Phase 6 — Polish.** Tests, accessibility, documentation.

Later: community upvotes, duplicate detection, comments, notifications, analytics.

---

## A note on AI in this project

AI is an **assistive layer, not an authority**. It suggests a category and can summarise a long
report, but a human always makes the final call. AI never rejects a report, never decides
priority on its own, and never applies moderation. If the AI service is unavailable, reporting
still works normally.

---

## Licence

MIT
