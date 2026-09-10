"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { IssueStatus } from "@/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/status";
import { requiresEvidence } from "@/lib/transitions";
import { REASON_MIN } from "@/lib/validation/admin";
import { PhotoUpload } from "@/components/upload/photo-upload";
import { changeStatusAction } from "./actions";
import { emptyFormState } from "@/lib/form-state";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-control bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-55"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * The form that changes an issue's status.
 *
 * It only offers transitions the rules allow from the current status, so an
 * administrator is not shown a choice that will be refused. The server checks
 * the same rules again regardless — the form is a convenience, and the endpoint
 * is reachable without it.
 */
export function StatusForm({
  issueId,
  currentStatus,
  options,
  uploadsEnabled,
}: {
  issueId: string;
  currentStatus: IssueStatus;
  options: IssueStatus[];
  uploadsEnabled: boolean;
}) {
  const [state, formAction] = useActionState(changeStatusAction, emptyFormState);
  const [selected, setSelected] = useState<IssueStatus | "">("");

  const needsPhoto = selected !== "" && requiresEvidence(selected);

  if (options.length === 0) {
    return (
      <p className="rounded-card border border-line bg-surface-sunken p-4 text-sm text-ink-soft">
        This issue is {STATUS_LABEL[currentStatus].toLowerCase()} and cannot be moved from here.
        Only the person who reported it can reopen it — which is the point: an outcome you can
        withdraw at will is not an outcome.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="issueId" value={issueId} />

      {state.formError ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          {state.formError}
        </p>
      ) : null}

      {state.ok ? (
        <p
          role="status"
          className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
        >
          Saved. The public timeline has been updated.
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Move this to</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <label
              key={option}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                selected === option
                  ? "border-ink bg-ink text-paper"
                  : "border-line-strong bg-surface text-ink-soft hover:border-ink-faint hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={option}
                checked={selected === option}
                onChange={() => setSelected(option)}
                className="sr-only"
                required
              />
              {STATUS_LABEL[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="text-sm font-medium">
          Why?
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          required
          minLength={REASON_MIN}
          placeholder="Inspected this morning; the defect is confirmed and booked for repair on Thursday."
          aria-describedby={state.fieldErrors.reason ? "reason-error" : "reason-hint"}
          aria-invalid={Boolean(state.fieldErrors.reason)}
          className="w-full "
        />
        <p id="reason-hint" className="text-xs text-ink-faint">
          This is published on the public timeline, under your name, permanently. It cannot be
          edited or deleted afterwards.
        </p>
        {state.fieldErrors.reason ? (
          <p id="reason-error" className="text-sm text-red-700 dark:text-red-300">
            {state.fieldErrors.reason[0]}
          </p>
        ) : null}
      </div>

      {needsPhoto ? (
        <fieldset className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
          <legend className="px-1 text-sm font-medium">Evidence</legend>
          <p className="text-xs text-ink-faint">
            Marking something resolved requires a photo of the finished work. It is the one claim
            here a resident cannot check for themselves.
          </p>
          <PhotoUpload disabled={!uploadsEnabled} />
          {state.fieldErrors.photos ? (
            <p className="text-sm text-red-700 dark:text-red-300">{state.fieldErrors.photos[0]}</p>
          ) : null}
          {!uploadsEnabled ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Photo upload is not configured on this deployment, so resolution cannot be recorded
              here yet.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <div>
        <SubmitButton label="Update status" />
      </div>
    </form>
  );
}
