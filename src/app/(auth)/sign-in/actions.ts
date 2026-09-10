"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { credentialsSchema } from "@/lib/validation/auth";

/**
 * Next.js signals a redirect by throwing a special error. There is no public
 * helper to identify one, and the internal import path moves between versions,
 * so it is matched on its digest instead — which is part of the framework's
 * observable behaviour rather than its internals.
 */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export type SignInState = { error: string | null };

/**
 * One message for every kind of failure — bad email, unknown account, wrong
 * password — because a more helpful message is also more helpful to someone
 * working out which email addresses have accounts.
 */
const GENERIC_FAILURE = "That email and password do not match an account.";

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: GENERIC_FAILURE };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    // A successful sign-in redirects, and Next.js signals a redirect by
    // throwing. Swallowing it here would leave the user sitting on the form
    // after having actually signed in, so it has to be re-thrown before the
    // AuthError check.
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) return { error: GENERIC_FAILURE };
    throw error;
  }

  return { error: null };
}
