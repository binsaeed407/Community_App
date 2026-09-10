"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { checkIssueRateLimit } from "@/lib/rate-limit";
import { issueSchema } from "@/lib/validation/issue";

export type ReportState = {
  fieldErrors: Record<string, string[]>;
  formError: string | null;
};

export const emptyReportState: ReportState = { fieldErrors: {}, formError: null };

export async function createIssueAction(
  _previous: ReportState,
  formData: FormData,
): Promise<ReportState> {
  // First line of every mutation. Middleware redirects unauthenticated page
  // navigations, but a server action is an endpoint that can be posted to
  // directly — so this is the check that actually matters.
  const user = await requireUser();

  const limit = await checkIssueRateLimit(user.id);
  if (!limit.allowed) {
    return {
      fieldErrors: {},
      formError: `You have reported several problems in the last hour. Please try again in ${limit.retryAfterMinutes} minute${limit.retryAfterMinutes === 1 ? "" : "s"}.`,
    };
  }

  const rawPhotos = formData.get("photos");

  const parsed = issueSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    addressLabel: formData.get("addressLabel"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    photos: rawPhotos ? safeJson(String(rawPhotos)) : [],
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, formError: null };
  }

  const input = parsed.data;

  // The category id comes from a client-controlled field, so it is checked
  // rather than trusted. Without this, a crafted post creates an issue with a
  // dangling foreign key and a 500 at render time.
  const category = await db.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });

  if (!category) {
    return { fieldErrors: { categoryId: ["Choose a category"] }, formError: null };
  }

  let issueId: string;

  try {
    // The issue and its first history row are written together, in one
    // transaction, because an issue with no history would be an issue whose
    // status came from nowhere — and the status column is only ever a cache of
    // that history. Half of this write landing is worse than none of it.
    issueId = await db.$transaction(async (tx) => {
      const issue = await tx.issue.create({
        data: {
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          addressLabel: input.addressLabel,
          latitude: input.latitude,
          longitude: input.longitude,
          reporterId: user.id,
          status: "SUBMITTED",
        },
        select: { id: true },
      });

      await tx.issueStatusHistory.create({
        data: {
          issueId: issue.id,
          status: "SUBMITTED",
          reason: "Reported by a resident.",
          actorId: user.id,
        },
      });

      if (input.photos.length > 0) {
        await tx.attachment.createMany({
          data: input.photos.map((photo) => ({
            issueId: issue.id,
            url: photo.url,
            cloudinaryPublicId: photo.publicId,
            kind: "REPORT" as const,
            uploadedById: user.id,
          })),
        });
      }

      return issue.id;
    });
  } catch (error) {
    console.error("Failed to create issue", error);
    return {
      fieldErrors: {},
      formError: "Something went wrong saving your report. Nothing was saved — please try again.",
    };
  }

  // Both lists are cached, and neither knows about the new row until told.
  revalidatePath("/issues");
  revalidatePath("/my-reports");

  redirect(`/issues/${issueId}`);
}

/** Parses the uploader's JSON without letting malformed input throw a 500. */
function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
