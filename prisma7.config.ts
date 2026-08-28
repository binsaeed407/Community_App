import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a DIRECT connection, not a pooled one.
    //
    // The app itself uses Neon's pooled connection string, which is right for
    // serverless: many short-lived functions sharing a small pool. But the
    // pooler (PgBouncer) does not support the advisory locks and session state
    // that `prisma migrate` relies on, so schema changes must bypass it.
    //
    // DIRECT_URL is the same database without "-pooler" in the host name.
    // Falls back to DATABASE_URL so a plain Postgres setup still works.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
