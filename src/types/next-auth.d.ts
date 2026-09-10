import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Auth.js ships a deliberately minimal `User` and `Session` shape (name, email,
 * image). This project needs the role and the display name on every request, so
 * the types are widened here rather than casting at each call site — a cast
 * would compile happily even after the callback that populates these fields was
 * removed.
 */
declare module "next-auth" {
  interface User {
    role: Role;
    displayName: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      displayName: string;
    } & DefaultSession["user"];
  }
}

// `next-auth/jwt` only re-exports `@auth/core/jwt`, so augmenting the former
// merges into nothing. The declaration has to name the module that actually
// defines the interface.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    displayName?: string;
  }
}
