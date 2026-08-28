import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 talks to the database through a "driver adapter" rather than a
// built-in engine, so the Postgres driver is passed in explicitly. PrismaPg is
// the standard Postgres adapter, which keeps this working against any Postgres
// database rather than tying us to one host.

function createClient() {
  // Deliberately does NOT throw when DATABASE_URL is missing.
  //
  // This module is imported at the top of any page that touches the database,
  // and `next build` evaluates those modules to collect route config. Throwing
  // here would fail the build rather than the request — which is what happens
  // on a first deploy, before the environment variable has been set.
  //
  // The adapter only opens a connection when a query actually runs, so a
  // missing or wrong URL surfaces as a query error that the page can catch and
  // display.
  const connectionString = process.env.DATABASE_URL ?? "";

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// In development Next.js re-evaluates this module on every file change. Without
// the cache below, each edit would create another client and open another pool
// of connections, until the database refused new ones. In production the module
// is evaluated once, so this is a no-op.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
