import { z } from "zod";

/**
 * The minimum a reason has to be.
 *
 * Long enough that "done" and "ok" do not pass, short enough that a genuinely
 * terse but real reason still does. The number is arbitrary; requiring
 * *something* is not. Every one of these ends up on a public timeline that a
 * resident will read.
 */
export const REASON_MIN = 15;
export const REASON_MAX = 1000;

const reason = z
  .string()
  .trim()
  .min(REASON_MIN, `Explain the change in at least ${REASON_MIN} characters`)
  .max(REASON_MAX, `Keep the reason under ${REASON_MAX} characters`);

const evidencePhoto = z.object({
  url: z.string().refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
    } catch {
      return false;
    }
  }, "That photo could not be verified."),
  publicId: z.string().min(1),
});

export const statusChangeSchema = z.object({
  issueId: z.string().min(1),
  status: z.enum(["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "REJECTED", "REOPENED"]),
  reason,
  photos: z.array(evidencePhoto).max(3).default([]),
});

/** A public update that says something without changing the status. */
export const updateSchema = z.object({
  issueId: z.string().min(1),
  reason,
});

export type StatusChangeInput = z.infer<typeof statusChangeSchema>;
