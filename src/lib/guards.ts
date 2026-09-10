import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

/**
 * Who is asking, or null if nobody is signed in.
 *
 * Use this when a page renders differently for signed-in visitors but does not
 * require one — the public issue list, for example.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    displayName: session.user.displayName,
    role: session.user.role,
  };
}

/**
 * Require a signed-in user, or send them to sign in.
 *
 * Middleware already redirects unauthenticated visitors away from the protected
 * routes, so in normal use this never fires. It is called anyway at the top of
 * every mutation, because **middleware is not authorisation**: it guards page
 * navigations, and a server action can be invoked directly by anyone who knows
 * its endpoint. The redirect is the backstop; this call is the real check.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * Require an administrator.
 *
 * A signed-in citizen who reaches an admin route gets a 404 rather than a
 * "forbidden" page, so the existence of the admin area is not confirmed to
 * someone who has no business there.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/not-found");
  return user;
}

/** True when this user may act on behalf of the whole service. */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}
