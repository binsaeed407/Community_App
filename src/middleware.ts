import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Route protection.
 *
 * Deliberately built from `auth.config.ts` rather than `auth.ts`: middleware
 * runs on the edge runtime, where Prisma and bcrypt cannot load. Importing the
 * full config here fails the build.
 *
 * The matcher lists only the routes that need a session. Everything else — the
 * public issue list, the map, an individual issue page — stays readable to a
 * logged-out visitor, which is the whole point of a transparency app.
 */
// Next.js scans this file statically for its entry point and does not
// recognise a destructured export, so the handler is named first and then
// exported on its own line.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/report", "/report/:path*", "/my-reports/:path*", "/my-reports"],
};
