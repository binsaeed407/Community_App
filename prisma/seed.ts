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

/** bcrypt work factor. 10 is the usual default: slow enough to be expensive to
 *  brute-force, fast enough that signing in still feels instant. */
const BCRYPT_ROUNDS = 10;

const CATEGORIES = [
  { slug: "roads",       name: "Roads and potholes",     icon: "🕳️", sortOrder: 1 },
  { slug: "streetlight", name: "Street lighting",        icon: "💡", sortOrder: 2 },
  { slug: "waste",       name: "Waste and fly-tipping",  icon: "🗑️", sortOrder: 3 },
  { slug: "pavement",    name: "Pavements and footpaths", icon: "🚶", sortOrder: 4 },
  { slug: "drainage",    name: "Drainage and flooding",  icon: "💧", sortOrder: 5 },
  { slug: "graffiti",    name: "Graffiti and vandalism", icon: "🎨", sortOrder: 6 },
  { slug: "parks",       name: "Parks and trees",        icon: "🌳", sortOrder: 7 },
  { slug: "other",       name: "Something else",         icon: "❓", sortOrder: 8 },
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
      // someone has been poking at the live demo.
      create: { ...user, passwordHash },
      update: { ...user, passwordHash },
    });
  }
  console.log(`Users: ${USERS.map((u) => u.email).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
