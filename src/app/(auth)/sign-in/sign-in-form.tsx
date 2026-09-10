"use client";

import { fieldClass } from "@/components/ui";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

function SubmitButton() {
  // useFormStatus reads the pending state of the form this button sits inside,
  // which is why it has to be its own component — a hook cannot see a form it
  // is rendered alongside rather than within.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-control bg-ink text-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-55"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function SignInForm() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        // role="alert" so a screen reader announces the failure instead of the
        // message appearing silently below a form the user is still reading.
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
