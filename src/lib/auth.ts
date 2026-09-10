import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { credentialsSchema } from "@/lib/validation/auth";
import { db } from "@/lib/db";

/**
 * The full auth configuration, including the part that touches the database.
 *
 * Imported by server components, route handlers and server actions — never by
 * middleware, which gets `auth.config.ts` instead because bcrypt and Prisma
 * cannot run on the edge runtime.
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      /**
       * Returns the user on success, or null on any failure.
       *
       * Two deliberate choices here:
       *
       * 1. Every failure returns the same null, and the sign-in page shows one
       *    message for all of them. Saying "no account with that email" would
       *    let anyone test which addresses are registered.
       *
       * 2. When no user is found we still run a bcrypt comparison against a
       *    throwaway hash. Returning early would make "unknown email" measurably
       *    faster than "wrong password", and that timing difference is itself a
       *    way to enumerate accounts.
       */
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            displayName: true,
            role: true,
          },
        });

        // A valid bcrypt hash of a value nobody can supply, so the comparison
        // costs the same as a real one but can never succeed.
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const correct = await compare(password, hash);

        if (!user || !correct) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          displayName: user.displayName,
          role: user.role,
        };
      },
    }),
  ],
});

/** bcrypt hash of a random string, used only to keep failed logins constant-time. */
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.aTBRfPGCRTaKKQXqZ0Bd0Rn7WBTC";
