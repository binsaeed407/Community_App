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

The demo database also contains five other residents who own the rest of the reports. That is
deliberate: when a single account owned all fifteen, signing in as it showed every report in the
system under "My reports". The filter was correct — the data made it look like a privacy leak,
which for an app about trust costs the same as one.

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

**Everywhere**: a light / dark / follow-the-system theme control, a profile page showing what the
service knows about you and what you have reported, and a layout that uses the whole width of the
screen instead of a narrow centred column.

---

## Architecture

```
                          ┌────────────────────────────────────┐
   Browser                │          Vercel (Next.js)          │
   ───────                │                                    │
   theme script  ────────▶│  app/layout.tsx                    │
   (pre-paint, inline)    │    header · footer · theme         │
                          │                                    │
   Leaflet map   ────────▶│  app/(app)/layout.tsx   ← sidebar  │
   (client only, ssr:false)    ├─ /issues        public        │
                          │    ├─ /issues/:id    timeline      │
   Report form   ────────▶│    ├─ /issues/map    public        │
   (server action)        │    ├─ /report        signed in     │
                          │    ├─ /my-reports    signed in     │
                          │    ├─ /profile       signed in     │
                          │    ├─ /admin         admin only    │
                          │    └─ /health        admin only    │
                          │                                    │
                          │  middleware      ── route guard    │
                          │  requireUser()   ── real check     │
                          │  server actions  ── every mutation │
                          │        │                           │
                          └────────┼───────────────────────────┘
                                   │ Prisma 7 + adapter-pg
                                   ▼
                          ┌────────────────────────────────────┐
                          │     Neon Postgres (eu-west-2)      │
                          │                                    │
                          │   User · Category · Issue          │
                          │   IssueStatusHistory  ◀── the point │
                          │   AuditLog · Attachment            │
                          │   AIAnalysis                       │
                          └────────────────────────────────────┘

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
| Theming | `light-dark()` + `color-scheme` | Every colour declared once for both themes, so the two cannot drift |
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

## How the interface works

### The layout uses the screen

Every page used to sit in a 1024px centred column, which on a 1920px monitor left roughly 450px of
dead margin on each side. App routes now live in an `(app)` route group with a persistent sidebar
on large screens and the same navigation as a drawer below that — one `<AppNav>` renders both, so
there is no desktop copy and mobile copy to fall out of step.

The sidebar only appears once you are signed in. A logged-out reader would get a wall of links they
cannot use, which is worse than no sidebar at all.

Prose pages stay deliberately narrower. Line length is a legibility constraint, not a stylistic
one — an issue description 1600px across is genuinely harder to read.

### Three theme states, one definition per colour

Light, dark, and follow-the-system. Three rather than two, because "dark mode on/off" silently
overrides a choice you already made at the operating-system level and gives you no way back to it.

Almost every implementation of this writes the dark palette out twice — once in a
`prefers-color-scheme` media query and again under a `[data-theme="dark"]` selector — and the two
copies drift. This uses `light-dark()` instead: each token declares both values once, and the CSS
`color-scheme` property decides which applies.

```css
:root                     { color-scheme: light dark; }  /* follow the OS  */
:root[data-theme="light"] { color-scheme: light; }       /* forced light   */
:root[data-theme="dark"]  { color-scheme: dark; }        /* forced dark    */

--app-paper: light-dark(#f7f8fa, #0b0f19);               /* declared once  */
```

An inline script applies the stored choice before the first paint. It has to be inline and
synchronous: anything React renders runs after the browser has already drawn the page, and that
flash is the whole thing it exists to prevent. The toggle reads `localStorage` through
`useSyncExternalStore`, which is the supported way to read state React does not own, and gets
cross-tab syncing as a side effect.

### Two Tailwind v4 traps, both hit for real

Worth writing down, because in both cases the source looked correct and only the **built**
stylesheet showed the problem.

**`@theme` cannot live inside a media query.** Tailwind reads it at build time and collapses it to
one set of values, so a nested one does not scope — it silently overwrites. That shipped: the
built CSS contained exactly one definition of `--color-paper`, the dark one, and every visitor got
dark colours regardless of their setting. The fix is to point `@theme` at plain custom properties
and let those carry the theme-dependent values.

**`dark:` also compiles to a media query.** So it follows the operating system and ignores an
in-app toggle. There were 75 `dark:` utilities here — status badges, timeline chips, alert
panels — and every one would have stayed in system mode while the tokenised colours around them
switched, breaking the toggle in exactly the places colour carries meaning.
`@custom-variant dark` redefines it to match the explicit attribute, or the system preference when
no explicit choice has been made.

### Colour is allowed to mean things

Two colour systems run side by side without colliding, because **shape** keeps them apart: a status
is always a pill with a dot and a text label, a category is always a rounded square with an emoji.

- **Six status colours** carry the only meaning colour is allowed to carry. SUBMITTED and REJECTED
  used to be two shades of the same grey, so "nobody has looked at this yet" and "this was
  considered and closed" — the two states a reporter most needs told apart — were indistinguishable.
  They are now a cool slate and a warm stone.
- **Eight category tints** are a taxonomy, not a state. They make a list of grey squares scannable.
- **One indigo brand colour** for the service and its controls, sitting far enough from every status
  hue that a primary button is never mistaken for a status.

Colour is never the only signal. Every badge carries its label as text and a solid dot, so the
system survives greyscale, a screenshot, and a reader who cannot distinguish the hues. Contrast is
measured rather than eyeballed — a colour that looked fine measured 4.10:1 against the page
background, failing WCAG AA, and it was the meta line on every single issue card.

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
- **"My reports" filters in the query**, not in the page, so another user's rows are never loaded
  into memory in the first place.
- **The profile page is the only screen that renders an email address**, and only your own.

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

**Read the build output, not the source.** Two theming bugs shipped to production while the source
looked perfectly correct: a palette that collapsed to one theme, and a dark-mode variant that
ignored the toggle. Both were obvious the moment I read the generated CSS, and invisible before
that. Reviewing my own source had already failed to catch either.

**Data that looks broken is broken.** Signing in as the demo citizen showed all fifteen reports
under "My reports". Nothing was leaking — the query filtered correctly — but one account had been
seeded as the reporter of everything. For an app whose entire subject is whether a record can be
trusted, looking like a privacy leak costs the same as being one.

**Never change data behind the app's back.** I deleted some test rows straight from the database,
which meant `revalidatePath` never ran and the cached page kept serving a report that no longer
existed. The app is the only thing that knows what to invalidate.

**Measure contrast, do not judge it.** A grey I had chosen by eye for the smallest, most-repeated
text in the app measured 4.10:1 and failed WCAG AA. It looked fine to me on the monitor I built it
on, which is exactly the problem.

---

## Roadmap

- [x] **Phase 0 — Foundations.** Next.js scaffold, database connection, deployment pipeline.
- [x] **Phase 1 — Data model.** Issues, append-only status history, audit log, seed data.
- [x] **Phase 2 — Authentication.** Citizen and administrator roles.
- [x] **Phase 3 — Citizen features.** Report with photo and location; browse the list and map.
- [x] **Phase 4 — Administrator features.** Dashboard, status changes with reasons, evidence.
- [x] **Phase 5 — Category suggestion.** Suggests a category, always editable by a human.
- [x] **Phase 6 — Polish.** Tests, accessibility, documentation.
- [x] **Interface pass.** Design tokens, light/dark/system theming, sidebar shell, profile page,
      footer, and a colour system that carries meaning.

Not built, and deliberately so: upvotes, duplicate detection, comments, notifications, analytics.
Each one is a reasonable idea and none of them make the accountability argument any stronger.

---

## Licence

MIT.
