import type { NextAuthConfig } from "next-auth";

/**
 * The half of the auth configuration that is safe to run in middleware.
 *
 * Middleware runs on Vercel's edge runtime, which has no Node APIs — so it
 * cannot load Prisma or bcrypt. Auth.js is therefore split in two:
 *
 *   - this file: routing rules and token shaping, no database, no crypto
 *   - `auth.ts`: the same config plus the credentials provider, used by the
 *     server where Node is available
 *
 * Without the split, importing the full config into `middleware.ts` fails at
 * build time with a module-not-found error for Node built-ins.
 */
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },

  session: {
    // JWT rather than database sessions. A database session would mean a query
    // on every request just to know who is asking, and the app does not need
    // server-side revocation for a demo. The trade-off is that a role change
    // does not take effect until the token refreshes.
    strategy: "jwt",
  },

  callbacks: {
    /**
     * Copy the role and id onto the token at sign-in, so later requests can
     * read them without touching the database.
     *
     * `user` is only present on the request where the sign-in happened; on
     * every subsequent request the token is passed through unchanged.
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.displayName = user.displayName;
      }
      return token;
    },

    /** Expose those same fields to `auth()` and `useSession()`. */
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      if (token.displayName) session.user.displayName = token.displayName;
      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;
