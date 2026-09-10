"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import { canTransition, requiresEvidence } from "@/lib/transitions";
import { statusChangeSchema } from "@/lib/validation/admin";
import { emptyFormState, type FormState } from "@/lib/form-state";

/**
 * Change the status of an issue.
 *
 * This is the single most important write in the application, and everything
 * about it is deliberate:
 *
 *  - It is guarded by requireAdmin, not by the page being hard to find.
 *  - The transition is checked against the rules table, not against what the
 *    form happened to offer. A form is a suggestion; the server decides.
 *  - The history row, the audit row and the cached status column are written in
 *    one transaction. Any one of them landing without the others would be worse
 *    than the whole thing failing — a status with no explanation, or an
 *    explanation for a status that was never applied.
 *  - Nothing is ever updated in the history table. Only inserted.
 */
export async function changeStatusAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = statusChangeSchema.safeParse({
    issueId: formData.get("issueId"),
    status: formData.get("status"),
    reason: formData.get("reason"),
    photos: safeJson(formData.get("photos")),
  });

  if (!parsed.success) {
    return {
      ...emptyFormState,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { issueId, status, reason, photos } = parsed.data;

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    select: { id: true, status: true },
  });

  if (!issue) {
    return { ...emptyFormState, formError: "That issue no longer exists." };
  }

  // Re-read the current status from the database rather than trusting whatever
  // the page was rendered with. Two administrators with the same issue open is
  // not a hypothetical, and the second one must not silently overwrite work
  // done since their page loaded.
  if (!canTransition(issue.status, status, "ADMIN")) {
    return {
      ...emptyFormState,
      formError:
        "That change is not allowed from the issue's current status. It may have been updated by someone else — reload and try again.",
    };
  }

  if (requiresEvidence(status) && photos.length === 0) {
    return {
      ...emptyFormState,
      fieldErrors: {
        photos: ["Attach a photo showing the work was done before marking this resolved."],
      },
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.issueStatusHistory.create({
        data: { issueId, status, reason, actorId: admin.id },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "issue.status_changed",
          entityType: "Issue",
          entityId: issueId,
          reason,
        },
      });

      if (photos.length > 0) {
        await tx.attachment.createMany({
          data: photos.map((photo) => ({
            issueId,
            url: photo.url,
            cloudinaryPublicId: photo.publicId,
            kind: "EVIDENCE" as const,
            uploadedById: admin.id,
          })),
        });
      }

      // The cache, written last and only here — never on its own, and never
      // outside a transaction that also wrote the history row it mirrors.
      await tx.issue.update({ where: { id: issueId }, data: { status } });
    });
  } catch (error) {
    console.error("Failed to change status", error);
    return {
      ...emptyFormState,
      formError: "Something went wrong. Nothing was changed — please try again.",
    };
  }

  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/admin/issues/${issueId}`);
  revalidatePath("/admin");
  revalidatePath("/issues");

  return { ...emptyFormState, ok: true };
}

/**
 * Reopen your own report.
 *
 * The only power a citizen has over status, and the reason the history table is
 * append-only rather than a status column: reopening adds a row, so the
 * resolution that is being contested stays visible above it. An administrator
 * cannot make that disagreement disappear by resolving it again — that appends
 * another row too.
 */
export async function reopenIssueAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = statusChangeSchema.safeParse({
    issueId: formData.get("issueId"),
    status: "REOPENED",
    reason: formData.get("reason"),
    photos: [],
  });

  if (!parsed.success) {
    return { ...emptyFormState, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { issueId, reason } = parsed.data;

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    select: { id: true, status: true, reporterId: true },
  });

  if (!issue) return { ...emptyFormState, formError: "That issue no longer exists." };

  // Only the person who reported it. Letting anyone reopen anything would turn
  // the timeline into a comments section, and would let one account undo every
  // resolution in the borough.
  if (issue.reporterId !== user.id) {
    return {
      ...emptyFormState,
      formError: "Only the person who reported this can reopen it.",
    };
  }

  if (!canTransition(issue.status, "REOPENED", "CITIZEN")) {
    return {
      ...emptyFormState,
      formError: "This report cannot be reopened from its current status.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.issueStatusHistory.create({
        data: { issueId, status: "REOPENED", reason, actorId: user.id },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "issue.reopened",
          entityType: "Issue",
          entityId: issueId,
          reason,
        },
      });

      await tx.issue.update({ where: { id: issueId }, data: { status: "REOPENED" } });
    });
  } catch (error) {
    console.error("Failed to reopen issue", error);
    return {
      ...emptyFormState,
      formError: "Something went wrong. Nothing was changed — please try again.",
    };
  }

  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/admin");
  revalidatePath("/issues");

  return { ...emptyFormState, ok: true };
}

function safeJson(value: FormDataEntryValue | null): unknown {
  if (!value) return [];
  try {
    return JSON.parse(String(value));
  } catch {
    return [];
  }
}
