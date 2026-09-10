"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { REASON_MIN } from "@/lib/validation/admin";
import { reopenIssueAction } from "@/app/admin/issues/[id]/actions";
import { emptyFormState } from "@/lib/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-control bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-55"
    >
      {pending ? "Reopening…" : "Reopen this report"}
    </button>
  );
}

/**
 * Lets the person who reported an issue say it is not actually fixed.
 *
 * Collapsed behind a button rather than shown open, because most people looking
 * at a resolved report are satisfied and do not need a form arguing with them.
 *
 * Reopening appends to the history; it does not undo the resolution. The claim
 * being contested stays visible above the objection, which is the whole reason
 * the table is append-only.
 */
export function ReopenForm({ issueId }: { issueId: string }) {
  const [state, formAction] = useActionState(reopenIssueAction, emptyFormState);
  const [open, setOpen] = useState(false);

  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
      >
        Reopened. Your reason is now on the timeline above and the issue is back in the queue.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="rounded-card border border-line bg-surface p-4">
        <p className="text-sm font-medium">Is this actually fixed?</p>
        <p className="mt-1 text-sm text-ink-soft">
          You reported this, so you can reopen it if the problem is still there. Nothing gets
          deleted — your reason is added to the timeline underneath what was already said.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex h-9 items-center justify-center rounded-control border border-line-strong bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-sunken"
        >
          No, it is not fixed
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
    >
      <input type="hidden" name="issueId" value={issueId} />

      {state.formError ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          {state.formError}
        </p>
      ) : null}

      <label htmlFor="reopen-reason" className="text-sm font-medium">
        What is still wrong?
      </label>
      <textarea
        id="reopen-reason"
        name="reason"
        rows={3}
        required
        minLength={REASON_MIN}
        placeholder="The pothole was filled but the filling has already sunk and it is as deep as before."
        aria-invalid={Boolean(state.fieldErrors.reason)}
        className="w-full "
      />
      {state.fieldErrors.reason ? (
        <p className="text-sm text-red-700 dark:text-red-300">{state.fieldErrors.reason[0]}</p>
      ) : null}

      <p className="text-xs text-ink-faint">
        This is published publicly under your display name.
      </p>

      <div className="flex gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-9 items-center justify-center rounded-control border border-line-strong bg-surface px-4 text-sm transition-colors hover:bg-surface-sunken"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
