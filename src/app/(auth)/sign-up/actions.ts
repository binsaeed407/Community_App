"use server";

import { hash } from "bcryptjs";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { signUpSchema } from "@/lib/validation/auth";
import { emptyFormState, type FormState } from "@/lib/form-state";

/** Matches the work factor used by the seed, so every account is hashed alike. */
const BCRYPT_ROUNDS = 10;

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function signUpAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    // The same schema the form uses, re-run on the server — because the client
    // check is a convenience and anyone can post to this endpoint directly.
    return { ...emptyFormState, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, displayName, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });

  if (existing) {
    // This does confirm that an address has an account, which the sign-in page
    // deliberately avoids doing. Hiding it properly means sending a "someone
    // tried to register with your address" email, and this project has no email
    // delivery — so the honest options are to leak it here or to fail with a
    // message that helps nobody. Leaking it on the registration form only is
    // the smaller cost, and it is written down rather than pretended away.
    return {
      ...emptyFormState,
      fieldErrors: { email: ["An account with that email already exists."] },
    };
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  await db.user.create({
    data: {
      email,
      displayName,
      passwordHash,
      // Role is never taken from the form. Accepting it would let anyone POST
      // themselves an administrator account.
      role: "CITIZEN",
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // The account exists at this point, so a failure here is a sign-in problem,
    // not a registration one. Send them to the sign-in page rather than losing
    // the account they just created.
    return { ...emptyFormState, formError: "Your account was created, but signing you in failed. Please sign in." };
  }

  return emptyFormState;
}
