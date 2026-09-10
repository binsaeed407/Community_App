/**
 * Seed script — fills an empty database with the data the demo needs.
 *
 * Run with `npm run db:seed`. It is safe to run repeatedly: every write is an
 * upsert keyed on something stable, so re-running updates rather than
 * duplicating. That matters because the demo database will be reset more than
 * once before this project is finished.
 */
import "dotenv/config";
import { hashSync } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SEED_ISSUES, type Actor } from "./seed-issues";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * The password for both demo accounts. This is published in the README on
 * purpose: the whole point is that a reviewer can sign in without registering.
 *
 * It is still hashed rather than stored in plain text, because the app must
 * only ever hold hashes — a seed file is not an excuse to make an exception,
 * and the login path has to work the same way for demo users as for real ones.
 */
const DEMO_PASSWORD = "demo1234";

/**
 * bcrypt work factor. 10 is the usual default: slow enough to be expensive to
 * brute-force, fast enough that signing in still feels instant.
 */
const BCRYPT_ROUNDS = 10;

const CATEGORIES = [
  { slug: "roads", name: "Roads and potholes", icon: "🕳️", sortOrder: 1 },
  { slug: "streetlight", name: "Street lighting", icon: "💡", sortOrder: 2 },
  { slug: "waste", name: "Waste and fly-tipping", icon: "🗑️", sortOrder: 3 },
  { slug: "pavement", name: "Pavements and footpaths", icon: "🚶", sortOrder: 4 },
  { slug: "drainage", name: "Drainage and flooding", icon: "💧", sortOrder: 5 },
  { slug: "graffiti", name: "Graffiti and vandalism", icon: "🎨", sortOrder: 6 },
  { slug: "parks", name: "Parks and trees", icon: "🌳", sortOrder: 7 },
  { slug: "other", name: "Something else", icon: "❓", sortOrder: 8 },
];

const USERS = [
  {
    email: "demo-citizen@example.com",
    displayName: "Demo Citizen",
    role: "CITIZEN" as const,
  },
  {
    email: "demo-admin@example.com",
    displayName: "Demo Administrator",
    role: "ADMIN" as const,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** A date `days` before now, at the current time of day. */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

async function main() {
  const passwordHash = hashSync(DEMO_PASSWORD, BCRYPT_ROUNDS);

  for (const category of CATEGORIES) {
    await db.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
  }
  console.log(`Categories: ${CATEGORIES.length}`);

  for (const user of USERS) {
    await db.user.upsert({
      where: { email: user.email },
      // Re-seeding resets the demo password, which is what you want after
      // people have been poking at the live demo.
      create: { ...user, passwordHash },
      update: { ...user, passwordHash },
    });
  }
  console.log(`Users: ${USERS.map((u) => u.email).join(", ")}`);

  // Look up the ids the issues need, once, rather than per row.
  const categoryIdBySlug = new Map(
    (await db.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );
  const citizen = await db.user.findUniqueOrThrow({ where: { email: USERS[0].email } });
  const admin = await db.user.findUniqueOrThrow({ where: { email: USERS[1].email } });
  const actorId: Record<Actor, string> = { citizen: citizen.id, admin: admin.id };

  let historyRows = 0;
  let auditRows = 0;

  for (const issue of SEED_ISSUES) {
    const categoryId = categoryIdBySlug.get(issue.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${issue.categorySlug}`);

    const reportedAt = daysAgo(issue.reportedDaysAgo);
    const stepDate = (afterDays: number) => new Date(reportedAt.getTime() + afterDays * DAY_MS);

    const lastStep = issue.timeline[issue.timeline.length - 1];

    // Written as one transaction on purpose. The rule this project is built
    // around is that Issue.status and the newest IssueStatusHistory row can
    // never disagree, and the way that rule is kept is that they are always
    // written together. The seed follows the same rule as the app so the demo
    // data cannot be the thing that breaks the invariant.
    await db.$transaction(async (tx) => {
      const data = {
        title: issue.title,
        description: issue.description,
        latitude: issue.latitude,
        longitude: issue.longitude,
        addressLabel: issue.addressLabel,
        categoryId,
        reporterId: citizen.id,
        // The cache. Always the status of the final timeline step.
        status: lastStep.status,
        createdAt: reportedAt,
        updatedAt: stepDate(lastStep.afterDays),
      };

      await tx.issue.upsert({
        where: { id: issue.id },
        create: { id: issue.id, ...data },
        update: data,
      });

      for (const [index, step] of issue.timeline.entries()) {
        const id = `${issue.id}-h${index + 1}`;
        const row = {
          issueId: issue.id,
          status: step.status,
          reason: step.reason,
          actorId: actorId[step.actor],
          createdAt: stepDate(step.afterDays),
        };
        await tx.issueStatusHistory.upsert({
          where: { id },
          create: { id, ...row },
          update: row,
        });
        historyRows += 1;

        // The audit log covers administrative actions. A citizen's own report
        // and reopen are already fully described by the issue and its history,
        // and duplicating them here would make the audit log noise rather than
        // a record of who exercised authority.
        if (step.actor !== "admin") continue;

        const auditId = `${issue.id}-a${index + 1}`;
        const audit = {
          actorId: admin.id,
          action: "issue.status_changed",
          entityType: "Issue",
          entityId: issue.id,
          reason: step.reason,
          createdAt: stepDate(step.afterDays),
        };
        await tx.auditLog.upsert({
          where: { id: auditId },
          create: { id: auditId, ...audit },
          update: audit,
        });
        auditRows += 1;
      }
    });
  }

  console.log(`Issues: ${SEED_ISSUES.length}`);
  console.log(`Status history rows: ${historyRows}`);
  console.log(`Audit log rows: ${auditRows}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
