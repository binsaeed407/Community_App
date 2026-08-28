import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 talks to the database through a "driver adapter" rather than a
// built-in engine, so the Postgres driver is passed in explicitly.
// PrismaPg is the standard Postgres adapter, which keeps this code working
// against any Postgres database, not just our hosted one.

function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add your connection string.",
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// In development Next.js reloads this module on every file change. Without the
// cache below, each reload would create another client and open another pool of
// database connections, until the database refused new ones.
//
// Stashing the client on globalThis keeps a single instance alive across
// reloads. In production the module is evaluated once, so this is a no-op.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
