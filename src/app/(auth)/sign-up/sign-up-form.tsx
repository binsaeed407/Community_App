"use client";

import { fieldClass } from "@/components/ui";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation/auth";
import { signUpAction } from "./actions";
import { emptyFormState } from "@/lib/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-control bg-ink text-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-55"
    >
      {pending ? "Creating your account…" : "Create account"}
    </button>
  );
}

/** A field error, wired to its input so a screen reader reads them together. */
function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="text-sm text-red-700 dark:text-red-300">
      {messages[0]}
    </p>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, emptyFormState);
  const { fieldErrors } = state;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.formError ? (
        <p
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-sm font-medium">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          required
          aria-describedby={
            fieldErrors.displayName ? "displayName-error" : "displayName-hint"
          }
          aria-invalid={Boolean(fieldErrors.displayName)}
          className={fieldClass}
        />
        <p id="displayName-hint" className="text-xs text-ink-faint">
          Shown on your reports. Your email address is never shown publicly.
        </p>
        <FieldError id="displayName-error" messages={fieldErrors.displayName} />
      </div>

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
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          aria-invalid={Boolean(fieldErrors.email)}
          className={fieldClass}
        />
        <FieldError id="email-error" messages={fieldErrors.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
          aria-invalid={Boolean(fieldErrors.password)}
          className={fieldClass}
        />
        <p id="password-hint" className="text-xs text-ink-faint">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
        <FieldError id="password-error" messages={fieldErrors.password} />
      </div>

      <SubmitButton />
    </form>
  );
}
